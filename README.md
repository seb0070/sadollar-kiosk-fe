# 🍔 Sadollar Kiosk — 프론트엔드

맥락형 음성인식 키오스크 프론트엔드입니다.
음성 입력 → STT → AI 에이전트 응답을 실시간으로 처리하며, 메뉴 탐색부터 주문 완료까지의 흐름을 담당합니다.

> 백엔드 레포: [sadollar-kiosk](https://github.com/culyrh/sadollar-kiosk.git)

---

## 환경 세팅

**Node.js 20+ 권장**

### 패키지 설치

```bash
npm install
```

### 환경변수 설정

`.env` 파일 생성 후 백엔드 서버 주소 입력:

```bash
cp .env.example .env
```

| 변수                | 설명                 | 기본값                  |
| ------------------- | -------------------- | ----------------------- |
| `VITE_API_BASE_URL` | 백엔드 REST API 주소 | `http://localhost:8000` |
| `VITE_WS_BASE_URL`  | WebSocket 서버 주소  | `ws://localhost:8000`   |

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 기술 스택

| 역할            | 기술                      |
| --------------- | ------------------------- |
| 프레임워크      | React 18 + Vite           |
| 언어            | TypeScript                |
| 상태관리        | Zustand                   |
| HTTP 클라이언트 | Axios                     |
| 라우팅          | React Router v6           |
| 음성 처리       | Web Audio API + WebSocket |

---

## 시스템 동작 구조

```
브라우저 마이크
↓
float32 PCM (50ms 청크, 16kHz mono)
↓
WS /stt/ws?session_id={id}
↓
백엔드 파이프라인 (STT → LLM 정제 → AI 에이전트 → TTS)
↓
수신 (발화 끝날 때마다 2개 frame 순서대로)
↓
┌─────────────────────────────────────────┐
│                                         │
│  text frame (JSON)   binary frame (MP3) │
│  ┌───────────────┐   ┌───────────────┐  │
│  │ stt_text      │   │ voice 텍스트를 │  │
│  │ refined_text  │   │ TTS 변환한     │  │
│  │ voice         │   │ 오디오 재생    │  │
│  │ screen        │   └───────────────┘  │
│  └───────────────┘                      │
│  → 화면 말풍선 표시                      │
│  → screen 있으면 선택지 UI 표시          │
└─────────────────────────────────────────┘
```

프론트엔드 WebSocket 메시지 처리:

- `typeof message === 'string'` → JSON 파싱 → voice로 말풍선 표시, screen 있으면 선택지 UI 표시
- `message instanceof Blob` → MP3 오디오 재생

---

## 프로젝트 구조

```
src/
├── api/              # axios 인스턴스, API 호출 함수
│   ├── client.ts     # baseURL, 인터셉터
│   ├── menu.ts       # 메뉴 API
│   ├── cart.ts       # 장바구니 API
│   ├── order.ts      # 주문/결제 API
│   └── session.ts    # 세션 API
│
├── types/
│   └── index.ts      # 공통 타입 정의 (API 응답 인터페이스)
│
├── hooks/
│   ├── useVoice.ts   # WebSocket + 마이크 스트림 처리
│   └── useCart.ts    # 장바구니 훅
│
├── store/
│   ├── sessionStore.ts  # 세션 ID 전역 상태
│   └── cartStore.ts     # 장바구니 전역 상태
│
├── pages/
│   ├── Home.tsx      # 메뉴 목록 화면
│   ├── Cart.tsx      # 장바구니 화면
│   └── Complete.tsx  # 주문 완료 화면
│
└── components/
    ├── MenuCard.tsx      # 메뉴 카드
    ├── VoiceButton.tsx   # 음성 인식 버튼
    └── ChatBubble.tsx    # AI 응답 말풍선
```

---

## 개발 현황

- [x] 프로젝트 초기 세팅 및 폴더 구조
- [ ] API 클라이언트 및 타입 연동
- [ ] 메뉴 목록 화면
- [ ] 음성 인식 WebSocket 연결
- [ ] 장바구니 상태 관리 및 화면
- [ ] 주문/결제 플로우
- [ ] AI 응답 말풍선 UI
