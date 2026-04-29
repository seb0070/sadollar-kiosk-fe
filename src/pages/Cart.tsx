import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartStore';

function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, total } = useCart();
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        maxWidth: 'calc(100vh * 0.5625)',
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
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #ebebeb',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: '1.5px solid #ddd',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            color: '#555',
            fontWeight: '500',
          }}
        >
          ← 메뉴로
        </button>
        <span style={{ fontWeight: '800', fontSize: '17px', color: '#e63312' }}>
          주문 내역
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
              key={item.id}
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
                  style={{ fontSize: '14px', fontWeight: '600', color: '#222' }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#e63312',
                    marginTop: '4px',
                    fontWeight: '700',
                  }}
                >
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
                <div
                  style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}
                >
                  x{item.quantity}
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* 하단 총금액 + 결제 */}
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
            <strong style={{ color: '#e63312' }}>
              {total.toLocaleString()}원
            </strong>
          </span>
        </div>
        <button
          disabled={items.length === 0}
          style={{
            width: '100%',
            background: items.length === 0 ? '#e0e0e0' : '#e63312',
            color: items.length === 0 ? '#aaa' : 'white',
            border: 'none',
            borderRadius: '14px',
            height: '54px',
            fontWeight: '700',
            fontSize: '17px',
            cursor: items.length === 0 ? 'default' : 'pointer',
          }}
        >
          결제 {total.toLocaleString()}원
        </button>
      </div>
    </div>
  );
}

export default Cart;
