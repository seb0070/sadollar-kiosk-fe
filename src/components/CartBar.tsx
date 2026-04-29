import type { CartItemLocal } from '../store/cartStore';

interface Props {
  items: CartItemLocal[];
  total: number;
  onRemove: (id: number) => void;
  isConnected: boolean;
  isListening: boolean;
  onToggle: () => void;
}

function CartBar({
  items,
  total,
  onRemove,
  isConnected,
  isListening,
  onToggle,
}: Props) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #eee',
        padding: '16px 14px 10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {/* 담긴 메뉴 목록 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flex: 1,
          overflowX: 'auto',
          paddingTop: '8px',
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'relative',
              flexShrink: 0,
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => onRemove(item.id)}
              style={{
                position: 'absolute',
                top: -8,
                right: -4,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#e63312',
                color: 'white',
                border: 'none',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              ✕
            </button>
            {item.quantity > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -4,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#222',
                  color: 'white',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  fontWeight: 'bold',
                }}
              >
                {item.quantity}
              </div>
            )}
            <img
              src={item.img_url}
              alt={item.name}
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'cover',
                borderRadius: '8px',
                background: '#f5f5f5',
              }}
            />
            <div
              style={{ fontSize: '9px', marginTop: '2px', maxWidth: '44px' }}
            >
              {item.name.length > 5 ? item.name.slice(0, 5) + '..' : item.name}
            </div>
          </div>
        ))}
      </div>

      {/* 마이크 버튼 */}
      <button
        onClick={onToggle}
        disabled={!isConnected}
        style={{
          flexShrink: 0,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: 'none',
          background: isListening ? '#e63312' : '#f0f0f0',
          boxShadow: isListening ? '0 0 0 6px rgba(230,51,18,0.3)' : 'none',
          cursor: isConnected ? 'pointer' : 'default',
          fontSize: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        🎤
      </button>

      {/* 결제 버튼 */}
      <button
        style={{
          flexShrink: 0,
          background: '#e63312',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          width: '72px',
          height: '56px',
          fontWeight: 'bold',
          fontSize: '12px',
          cursor: 'pointer',
          textAlign: 'center',
          lineHeight: '1.4',
        }}
      >
        결제{'\n'}
        {total.toLocaleString()}원
      </button>
    </div>
  );
}

export default CartBar;
