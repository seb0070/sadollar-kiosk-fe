import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../store/sessionStore';
import { getOrders } from '../api/order';

interface PaymentState {
  orderId: number;
  totalPrice: number;
}

function PaymentComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = useSession();
  const state = location.state as PaymentState | null;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fetchedOrder, setFetchedOrder] = useState<{ orderId: number; totalPrice: number } | null>(null);

  useEffect(() => {
    if (!state?.orderId && sessionId) {
      getOrders(sessionId).then((data) => {
        const orders: { order_id: number; total_price: number }[] = Array.isArray(data)
          ? data
          : (data?.orders ?? []);
        const latest = orders[orders.length - 1];
        if (latest) setFetchedOrder({ orderId: latest.order_id, totalPrice: latest.total_price });
      }).catch(() => {});
    }
  }, [sessionId, state?.orderId]);

  // 30초 후 자동 홈 복귀
  useEffect(() => {
    timerRef.current = setTimeout(() => navigate('/'), 30000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate]);

  const handleGoHome = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    navigate('/');
  };

  const resolvedOrderId = state?.orderId ?? fetchedOrder?.orderId;
  const orderNumber = resolvedOrderId ? String(resolvedOrderId).padStart(4, '0') : '----';
  const totalPrice = state?.totalPrice ?? fetchedOrder?.totalPrice ?? 0;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        maxWidth: 'calc(100vh * 0.5625)',
        margin: '0 auto',
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
      {/* 체크 아이콘 */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#c95020',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          flexShrink: 0,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M10 21L17 28L30 14"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        style={{
          fontSize: '22px',
          fontWeight: '800',
          color: '#222',
          marginBottom: '6px',
        }}
      >
        결제 완료
      </div>
      <div style={{ fontSize: '14px', color: '#888', marginBottom: '28px' }}>
        주문이 접수되었습니다
      </div>

      {/* 주문 정보 카드 */}
      <div
        style={{
          width: '100%',
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#888' }}>주문번호</span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: '800',
              color: '#c95020',
              letterSpacing: '1px',
            }}
          >
            #{orderNumber}
          </span>
        </div>
        <div
          style={{
            height: '1px',
            background: '#f0f0f0',
            marginBottom: '14px',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '14px', color: '#888' }}>결제금액</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#222' }}>
            {totalPrice.toLocaleString()}
            <span style={{ fontSize: '14px', fontWeight: '700' }}>원</span>
          </span>
        </div>
      </div>

      {/* 안내 문구 */}
      <div
        style={{
          width: '100%',
          background: '#fff5f3',
          border: '1.5px solid #c95020',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#c95020',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '28px',
        }}
      >
        🍔 음식이 준비되면 번호판으로 안내드립니다
      </div>

      {/* 처음으로 버튼 */}
      <button
        onClick={handleGoHome}
        style={{
          width: '100%',
          height: '54px',
          background: '#c95020',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          fontSize: '17px',
          fontWeight: '700',
          cursor: 'pointer',
          marginBottom: '12px',
        }}
      >
        처음으로 돌아가기
      </button>

      <div style={{ fontSize: '12px', color: '#bbb' }}>
        잠시 후 자동으로 처음 화면으로 이동합니다
      </div>
    </div>
  );
}

export default PaymentComplete;
