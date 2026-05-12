import { useEffect, useRef } from 'react';
import type { CartItem } from '../types';

interface Props {
  items: CartItem[];
  onClose: () => void;
  autoCloseSec?: number;
}

function CartResultModal({ items, onClose, autoCloseSec = 3 }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = items[items.length - 1];

  useEffect(() => {
    timerRef.current = setTimeout(onClose, autoCloseSec * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!last) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '88%',
          maxWidth: '360px',
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'modalIn 0.3s ease',
        }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes shrink {
            from { width: 100%; }
            to   { width: 0%; }
          }
        `}</style>

        {/* 헤더 */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {last.img_url && (
            <img
              src={last.img_url}
              alt={last.name}
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                borderRadius: '8px',
                background: '#f5f5f5',
                flexShrink: 0,
              }}
            />
          )}
          <div>
            <div
              style={{ fontSize: '12px', color: '#888', marginBottom: '2px' }}
            >
              🛒 장바구니에 담겼어요!
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#222' }}>
              {last.name} {last.is_set === 1 ? '세트' : '단품'}
            </div>
          </div>
        </div>

        {/* 주문 내역 */}
        <div style={{ padding: '16px' }}>
          <div
            style={{
              background: '#f9f9f9',
              borderRadius: '12px',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#555' }}>종류</span>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>
                {last.is_set === 1 ? '세트' : '단품'}
              </span>
            </div>
            {last.drink_name && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#888' }}>-{last.drink_name}</span>
                <span style={{ fontSize: '12px', color: last.drink_extra_price ? '#c95020' : '#aaa' }}>
                  {last.drink_extra_price ? `+${last.drink_extra_price.toLocaleString()}원` : '0원'}
                </span>
              </div>
            )}
            {last.side_name && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#888' }}>-{last.side_name}</span>
                <span style={{ fontSize: '12px', color: last.side_extra_price ? '#c95020' : '#aaa' }}>
                  {last.side_extra_price ? `+${last.side_extra_price.toLocaleString()}원` : '0원'}
                </span>
              </div>
            )}
            <div
              style={{
                borderTop: '1px solid #e0e0e0',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', color: '#555' }}>금액</span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#c95020',
                }}
              >
                {(last.unit_price * last.quantity).toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 자동 닫힘 프로그레스바 */}
        <div style={{ height: '4px', background: '#f0f0f0' }}>
          <div
            style={{
              height: '100%',
              background: '#c95020',
              animation: `shrink ${autoCloseSec}s linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CartResultModal;
