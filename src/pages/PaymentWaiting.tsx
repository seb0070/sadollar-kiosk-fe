import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { wsManager } from '../lib/wsManager';
import { useSession } from '../store/sessionStore';
import { createOrder, completePayment } from '../api/order';

interface LocationState {
  method: 'card' | 'mobile';
  touch?: boolean;
}

const PAYMENT_DELAY_MS = 8000;

function PaymentWaiting() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useSession();
  const state = location.state as LocationState | null;
  const method = state?.method ?? 'card';
  const isTouch = state?.touch ?? false;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(async () => {
      if (isTouch) {
        try {
          const order = await createOrder(sessionId, method);
          const orderId: number = order.order_id ?? order.id;
          await completePayment(orderId, sessionId);
          navigate('/payment-complete', { state: { orderId, totalPrice: order.total_price } });
        } catch {
          navigate('/payment-complete');
        }
      } else {
        wsManager.sendText({ type: 'payment_complete', method });
        // PAGE:complete 액션은 백엔드가 WS로 전송 → voiceStore가 /payment-complete로 이동
      }
    }, PAYMENT_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isCard = method === 'card';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f8f8',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* 아이콘 */}
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: '#3a3a4a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          flexShrink: 0,
        }}
      >
        {isCard ? (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M2 10h20" stroke="white" strokeWidth="2"/>
            <path d="M6 15h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <rect x="7" y="2" width="10" height="20" rx="2" stroke="white" strokeWidth="2"/>
            <circle cx="12" cy="17" r="1" fill="white"/>
          </svg>
        )}
      </div>

      <div style={{ fontSize: '22px', fontWeight: '800', color: '#222', marginBottom: '10px' }}>
        {isCard ? '카드를 넣어주세요' : '모바일 결제 진행 중'}
      </div>
      <div style={{ fontSize: '14px', color: '#888', marginBottom: '40px', textAlign: 'center' }}>
        {isCard ? '카드 단말기에 카드를 삽입하거나 태그해주세요' : '모바일 결제를 진행해주세요'}
      </div>

      {/* 스피너 */}
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f0f0f0',
          borderTop: `4px solid ${isCard ? '#3a3a4a' : '#c95020'}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ fontSize: '12px', color: '#bbb', marginTop: '24px' }}>
        결제 처리 중입니다. 잠시만 기다려주세요
      </div>
    </div>
  );
}

export default PaymentWaiting;
