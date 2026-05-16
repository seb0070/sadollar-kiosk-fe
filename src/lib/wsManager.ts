// WebSocket을 React 완전 외부에서 관리하는 싱글톤 매니저
// StrictMode의 useEffect 이중 실행과 무관하게 동작

import type { WsMessage } from '../types';

type Listener = {
  onConnected: (v: boolean) => void;
  onMessage: (data: WsMessage) => void;
  onAudio: (buffer: ArrayBuffer) => void;
};

let ws: WebSocket | null = null;
let currentSessionId = '';
let listeners: Listener[] = [];

const notifyConnected = (v: boolean) => listeners.forEach((l) => l.onConnected(v));
const notifyMessage = (data: WsMessage) => listeners.forEach((l) => l.onMessage(data));
const notifyAudio = (buf: ArrayBuffer) => listeners.forEach((l) => l.onAudio(buf));

export const wsManager = {
  connect(sid: string, wsBaseUrl: string) {
    if (
      ws &&
      currentSessionId === sid &&
      (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    ws?.close();
    currentSessionId = sid;
    ws = new WebSocket(`${wsBaseUrl}/stt/ws?session_id=${sid}`);

    ws.onopen = () => {
      console.log('WS 연결됨:', sid);
      notifyConnected(true);
    };
    ws.onclose = () => {
      console.log('WS 닫힘');
      notifyConnected(false);
    };
    ws.onerror = (e) => console.error('WS 오류:', e);
    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const data: WsMessage = JSON.parse(event.data);
        console.log('[STT]  ', data.stt_text);
        console.log('[정제] ', data.refined_text);
        console.log('[음성] ', data.voice);
        console.log('[화면] ', data.screen);
        notifyMessage(data);
        return;
      }
      if (event.data instanceof Blob) {
        const buf = await event.data.arrayBuffer();
        if (buf.byteLength > 0) notifyAudio(buf);
      }
    };
  },

  send(data: ArrayBuffer) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  },

  sendText(data: object) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  },

  notifyTouch() {
    this.sendText({ type: 'touch' });
  },

  isOpen() {
    return ws?.readyState === WebSocket.OPEN;
  },

  disconnect() {
    ws?.close();
    ws = null;
    currentSessionId = '';
  },

  subscribe(listener: Listener) {
    listeners.push(listener);
    // 구독 시점에 이미 연결돼 있으면 즉시 알림
    if (ws?.readyState === WebSocket.OPEN) {
      listener.onConnected(true);
    }
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};