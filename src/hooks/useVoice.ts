import { useEffect, useRef, useState } from 'react';
import { wsManager } from '../lib/wsManager';
import type { WsMessage } from '../types';

// TTS 재생용 AudioContext 싱글톤
let ttsAudioCtx: AudioContext | null = null;

const getTtsAudioCtx = async (): Promise<AudioContext> => {
  if (!ttsAudioCtx || ttsAudioCtx.state === 'closed') {
    ttsAudioCtx = new AudioContext();
  }
  if (ttsAudioCtx.state === 'suspended') {
    await ttsAudioCtx.resume();
  }
  return ttsAudioCtx;
};

const playMp3 = async (buffer: ArrayBuffer) => {
  try {
    const ctx = await getTtsAudioCtx();
    const decoded = await ctx.decodeAudioData(buffer.slice(0));
    const src = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    src.start(0);
  } catch (e) {
    console.error('TTS 재생 오류:', e);
  }
};

export const useVoice = (sessionId: string) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isListeningRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [screenItems, setScreenItems] = useState<string[]>([]);

  const stopListeningInternal = () => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    isListeningRef.current = false;
    setIsListening(false);
  };

  useEffect(() => {
    if (!sessionId) return;

    wsManager.connect(sessionId, import.meta.env.VITE_WS_BASE_URL);

    const unsubscribe = wsManager.subscribe({
      onConnected: (v: boolean) => setIsConnected(v),
      onMessage: (data: WsMessage) => {
        setVoiceMessage(data.voice);
        if (data.screen) {
          const lines = data.screen.split('\n').map((l) => l.trim()).filter(Boolean);
          setScreenItems(lines);
        } else {
          setScreenItems([]);
        }
        stopListeningInternal();
      },
      onAudio: (buffer: ArrayBuffer) => playMp3(buffer),
    });

    return unsubscribe;
  }, [sessionId]);

  const startListening = async () => {
    if (!wsManager.isOpen()) return;
    if (isListeningRef.current) return;

    setScreenItems([]);

    // 사용자 클릭 시점에 TTS AudioContext 미리 resume (자동재생 정책 대응)
    await getTtsAudioCtx();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 브라우저 기본 샘플레이트로 먼저 열기 (강제 16000은 무시되는 브라우저 있음)
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      console.log('실제 AudioContext sampleRate:', audioCtx.sampleRate);

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // 브라우저 샘플레이트 → 16000Hz 다운샘플링
        const inputSampleRate = audioCtx.sampleRate;
        const outputSampleRate = 16000;
        const resampleRatio = inputSampleRate / outputSampleRate;
        const outputLength = Math.floor(inputData.length / resampleRatio);
        const resampled = new Float32Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
          resampled[i] = inputData[Math.floor(i * resampleRatio)];
        }

        wsManager.send(resampled.buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      isListeningRef.current = true;
      setIsListening(true);
      console.log('마이크 시작, WS 전송 중...');
    } catch (e) {
      console.error('마이크 오류:', e);
    }
  };

  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListeningInternal();
    } else {
      startListening();
    }
  };

  return { isConnected, isListening, voiceMessage, screenItems, toggleListening };
};