import { useEffect, useRef, useState } from 'react';
import { wsManager } from '../lib/wsManager';
import type { WsMessage, ScreenItem } from '../types';

let ttsAudioCtx: AudioContext | null = null;
let isTtsPlaying = false;
let ttsEndedAt = 0;
const ttsQueue: ArrayBuffer[] = [];
let isTtsProcessing = false;

const getTtsAudioCtx = async (): Promise<AudioContext> => {
  if (!ttsAudioCtx || ttsAudioCtx.state === 'closed') {
    ttsAudioCtx = new AudioContext();
  }
  if (ttsAudioCtx.state === 'suspended') {
    await ttsAudioCtx.resume();
  }
  return ttsAudioCtx;
};

const processTtsQueue = async () => {
  if (isTtsProcessing || ttsQueue.length === 0) return;
  isTtsProcessing = true;
  isTtsPlaying = true;

  while (ttsQueue.length > 0) {
    const buffer = ttsQueue.shift()!;
    try {
      const ctx = await getTtsAudioCtx();
      const decoded = await ctx.decodeAudioData(buffer.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      await new Promise<void>((resolve) => {
        // AudioContext가 suspend 상태로 onended가 안 불리는 경우를 대비한 safety timeout
        const safetyTimer = setTimeout(resolve, (decoded.duration + 5) * 1000);
        src.onended = () => {
          clearTimeout(safetyTimer);
          resolve();
        };
        src.start(0);
      });
    } catch (e) {
      console.error('TTS 재생 오류:', e);
    }
  }

  isTtsPlaying = false;
  isTtsProcessing = false;
  ttsEndedAt = Date.now();
};

const playMp3 = (buffer: ArrayBuffer) => {
  ttsQueue.push(buffer);
  processTtsQueue();
};

interface UseVoiceOptions {
  onCartChange?: () => void;
  onTimeout?: () => void;
  onAction?: (action: string) => void;
}

export const useVoice = (sessionId: string, options?: UseVoiceOptions) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isListeningRef = useRef(false);

  const onCartChangeRef = useRef(options?.onCartChange);
  const onTimeoutRef = useRef(options?.onTimeout);
  const onActionRef = useRef(options?.onAction);
  useEffect(() => { onCartChangeRef.current = options?.onCartChange; }, [options?.onCartChange]);
  useEffect(() => { onTimeoutRef.current = options?.onTimeout; }, [options?.onTimeout]);
  useEffect(() => { onActionRef.current = options?.onAction; }, [options?.onAction]);

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [screenItems, setScreenItems] = useState<ScreenItem[]>([]);

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

    const unsubscribe = wsManager.subscribe({
      onConnected: (v: boolean) => {
        setIsConnected(v);
        if (!v) stopListeningInternal();
      },
      onMessage: (data: WsMessage) => {
        const action = data.action ?? 'NONE';

        console.log('[WS] action:', action, 'screen:', data.screen);

        // TIMEOUT 처리
        if (action === 'TIMEOUT') {
          stopListeningInternal();
          wsManager.disconnect();
          onCartChangeRef.current?.();
          onTimeoutRef.current?.();
          return;
        }

        setVoiceMessage(data.voice);

        // screen: RECOMMEND일 때만 카드 표시 (DRINK/SIDE_SELECT는 모달, TAB은 탭전환으로 처리)
        const skipScreenItems =
          action.startsWith('DRINK_SELECT:') ||
          action.startsWith('SIDE_SELECT:') ||
          action.startsWith('TAB:');

        let validScreenItems: ScreenItem[] = [];
        if (Array.isArray(data.screen)) {
          const asObjects = (data.screen as unknown[]).filter(
            (item): item is ScreenItem =>
              typeof item === 'object' && item !== null && 'name' in item && 'price' in item
          );
          if (asObjects.length > 0) {
            validScreenItems = asObjects;
          } else {
            validScreenItems = (data.screen as unknown[])
              .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
              .map(name => ({ name: name.trim(), price: 0, img_url: '' }));
          }
        } else if (typeof data.screen === 'string' && data.screen.trim()) {
          validScreenItems = data.screen
            .split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .map(line => line.split(/\s*[–-]\s*/)[0].trim())
            .filter(name => name.length > 0)
            .map(name => ({ name, price: 0, img_url: '' }));
        }

        if (validScreenItems.length > 0 && !skipScreenItems) {
          setScreenItems(validScreenItems);
        } else {
          setScreenItems([]);
        }

        // 장바구니 갱신
        if (data.voice) {
          onCartChangeRef.current?.();
        }

        // action 처리
        if (action) {
          onActionRef.current?.(action);
        }
      },
      onAudio: (buffer: ArrayBuffer) => playMp3(buffer),
    });

    return unsubscribe;
  }, [sessionId]);

  const startListening = async () => {
    if (isListeningRef.current) return;

    wsManager.connect(sessionId, import.meta.env.VITE_WS_BASE_URL);
    setVoiceMessage('');
    setScreenItems([]);
    await getTtsAudioCtx();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isTtsPlaying || Date.now() - ttsEndedAt < 300) return;
        const inputData = e.inputBuffer.getChannelData(0);
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

  return {
    isConnected,
    isListening,
    voiceMessage,
    screenItems,
    startListening,
    toggleListening,
    stopListening: stopListeningInternal,
    clearScreenItems: () => setScreenItems([]),
  };
};