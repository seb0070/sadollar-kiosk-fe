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

### 프로덕션 빌드 및 실행

```bash
npm run build
npx serve dist
```

`http://localhost:3000` 접속

---

## 기술 스택

| 역할            | 기술                      |
| --------------- | ------------------------- |
| 프레임워크      | React 18 + Vite           |
| 언어            | TypeScript                |
| 서버 상태 관리  | TanStack React Query      |
| HTTP 클라이언트 | Axios                     |
| 라우팅          | React Router v6           |
| 음성 처리       | Web Audio API + WebSocket |

---

## 시스템 동작 구조

```
브라우저 마이크
↓
float32 PCM (4096 샘플 청크, 16kHz mono 리샘플링)
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
│  │ action        │                      │
│  └───────────────┘                      │
│  → AI 대사 화면 표시                     │
│  → action에 따라 페이지 이동 / 모달 제어 │
│  → screen 있으면 추천 메뉴 카드 표시     │
└─────────────────────────────────────────┘
```

### action 값 정의

| action 값           | 동작                           |
| ------------------- | ------------------------------ |
| `PAGE:cart`         | 장바구니 페이지로 이동         |
| `PAGE:welcome`      | 시작 화면으로 이동             |
| `PAGE:menu`         | 메뉴 화면으로 이동             |
| `PAGE:complete`     | 결제 완료 화면으로 이동        |
| `TAB:{카테고리}`    | 해당 카테고리 탭으로 전환      |
| `CART_ADD`          | 옵션 모달 확인 단계로 이동     |
| `TYPE_SELECT:{id}`  | 해당 메뉴 세트/단품 모달 열기  |
| `DRINK_SELECT:{id}` | 해당 메뉴 음료 선택 모달 열기  |
| `SIDE_SELECT:{id}`  | 해당 메뉴 사이드 선택 모달 열기|
| `TIMEOUT`           | 세션 초기화 후 시작 화면으로   |

---

## 프로젝트 구조

```
src/
├── api/
│   ├── client.ts            # Axios 인스턴스 (baseURL 설정)
│   ├── menu.ts              # 메뉴 목록 / 세트 정보 API
│   ├── cart.ts              # 장바구니 CRUD API
│   └── order.ts             # 주문 생성 / 결제 완료 API
│
├── types/
│   └── index.ts             # 공통 타입 정의
│
├── lib/
│   └── wsManager.ts         # WebSocket 싱글톤 매니저
│
├── hooks/
│   └── useVoice.ts          # WebSocket 연결 + 마이크 스트림 + TTS 재생
│
├── store/
│   ├── voiceStore.tsx       # VoiceProvider (음성 Context 전역 공급)
│   ├── sessionStore.ts      # 세션 ID 전역 상태
│   └── cartStore.ts         # 장바구니 상태 + React Query 연동
│
├── pages/
│   ├── Start.tsx            # 시작 화면 (음성 주문 선택)
│   ├── Home.tsx             # 메뉴 목록 화면 (3x3 그리드, 카테고리 탭)
│   ├── Cart.tsx             # 장바구니 화면 (카드/모바일 결제)
│   └── PaymentComplete.tsx  # 결제 완료 화면
│
└── components/
    ├── VoiceWave.tsx        # 음성 파형 애니메이션
    ├── OptionModal.tsx      # 메뉴 옵션 모달 (세트/단품 → 음료 → 사이드 → 확인)
    └── CartResultModal.tsx  # 장바구니 담기 완료 모달
```

---

## 개발 현황

- [x] 프로젝트 초기 세팅 및 폴더 구조
- [x] API 클라이언트 및 타입 연동
- [x] 시작 화면
- [x] 메뉴 목록 화면 (3x3 그리드, 카테고리 탭, 페이지네이션)
- [x] 음성 인식 WebSocket 연결 및 실시간 처리
- [x] 메뉴 옵션 선택 모달 (세트/단품, 음료, 사이드)
- [x] 장바구니 상태 관리 및 화면
- [x] 주문/결제 플로우 (카드결제 / 모바일결제)
- [x] 결제 완료 화면
- [x] AI 응답 표시 및 TTS 재생
- [x] 비활성 타임아웃 수신 및 세션 초기화
- [ ] 화면 터치 시 타임아웃 갱신 신호 전송
