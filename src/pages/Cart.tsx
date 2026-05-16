import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../store/cartStore';
import { useVoiceContext } from '../store/voiceStore';
import { getMenus } from '../api/menu';
import { wsManager } from '../lib/wsManager';
import type { MenuItem } from '../types';

function Cart() {
  const navigate = useNavigate();

  const { data: menus } = useQuery<MenuItem[]>({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const { items, updateItem, removeItem, total, totalCount } = useCart(menus);
  const { voiceMessage } = useVoiceContext();

  const handlePayment = (paymentMethod: 'card' | 'mobile') => {
    if (items.length === 0) return;
    wsManager.notifyTouch();
    navigate('/payment-waiting', { state: { method: paymentMethod, touch: true } });
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f8f8',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#555',
            fontSize: '12px',
            fontWeight: '500',
            padding: '4px 2px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          메뉴로
        </button>
        <span style={{ fontWeight: '800', fontSize: '17px', color: '#c95020' }}>
          장바구니
        </span>
        <div style={{ width: '72px' }} />
      </div>

      {/* 주문 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {items.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#aaa',
              marginTop: '60px',
              fontSize: '15px',
            }}
          >
            담긴 메뉴가 없어요
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.cart_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fff',
                borderRadius: '14px',
                padding: '12px',
                marginBottom: '10px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              }}
            >
              <img
                src={item.img_url}
                alt={item.name}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  background: '#f9f9f9',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#222',
                    marginBottom: '2px',
                  }}
                >
                  {item.name} {item.is_set === 1 ? '세트' : '단품'}
                </div>
                {(item.drink_name || item.side_name) && (
                  <div style={{ marginBottom: '4px' }}>
                    {item.drink_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                        <span>-{item.drink_name}</span>
                        <span>{item.drink_extra_price ? `+${item.drink_extra_price.toLocaleString()}원` : '0원'}</span>
                      </div>
                    )}
                    {item.side_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                        <span>-{item.side_name}</span>
                        <span>{item.side_extra_price ? `+${item.side_extra_price.toLocaleString()}원` : '0원'}</span>
                      </div>
                    )}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '13px',
                    color: '#c95020',
                    fontWeight: '700',
                  }}
                >
                  {(item.unit_price * item.quantity).toLocaleString()}원
                </div>
                {/* 수량 조절 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '8px',
                  }}
                >
                  <button
                    onClick={() => { wsManager.notifyTouch(); updateItem(item.cart_id, item.quantity - 1); }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '1.5px solid #ddd',
                      background: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#555',
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      minWidth: '20px',
                      textAlign: 'center',
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => { wsManager.notifyTouch(); updateItem(item.cart_id, item.quantity + 1); }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '1.5px solid #ddd',
                      background: 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#555',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => { wsManager.notifyTouch(); removeItem(item.cart_id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: 0,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* 음성 메시지 영역 */}
      {voiceMessage ? (
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #ebebeb',
            padding: '10px 16px',
            flexShrink: 0,
            fontSize: '13px',
            color: '#555',
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          {voiceMessage}
        </div>
      ) : null}

      {/* 하단 합계 + 결제 버튼 */}
      <div
        style={{
          background: '#fff',
          borderTop: '1px solid #ebebeb',
          padding: '12px 16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#555',
          }}
        >
          <span>
            주문수 <strong style={{ color: '#222' }}>{totalCount}</strong>
          </span>
          <span>
            총 주문금액{' '}
            <strong style={{ color: '#c95020' }}>
              {total.toLocaleString()}원
            </strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handlePayment('card')}
            disabled={items.length === 0}
            style={{
              flex: 1,
              background: items.length === 0 ? '#e8e8e8' : '#3a3a4a',
              color: items.length === 0 ? '#bbb' : 'white',
              border: 'none',
              borderRadius: '12px',
              height: '48px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: items.length === 0 ? 'default' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '-0.2px',
            }}
          >
            카드결제
          </button>
          <button
            onClick={() => handlePayment('mobile')}
            disabled={items.length === 0}
            style={{
              flex: 1,
              background: items.length === 0 ? '#e8e8e8' : '#c95020',
              color: items.length === 0 ? '#bbb' : 'white',
              border: 'none',
              borderRadius: '12px',
              height: '48px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: items.length === 0 ? 'default' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '-0.2px',
            }}
          >
            모바일결제
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
