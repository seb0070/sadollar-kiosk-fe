import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMenus } from '../api/menu';
import { useVoice } from '../hooks/useVoice';
import { useCart } from '../store/cartStore';
import VoiceWave from '../components/VoiceWave';
import type { MenuItem } from '../types';

const CATEGORIES = ['추천메뉴', '버거', '디저트/치킨', '음료/커피', '행사메뉴'];
const CARD_HEIGHT = 110;
const GRID_ROWS = 2;
const ITEMS_PER_PAGE = 6;
const GAP = 8;
const GRID_PADDING = 10;
const PAGINATION_HEIGHT = 44;

const MENU_AREA_HEIGHT =
  GRID_PADDING * 2 +
  CARD_HEIGHT * GRID_ROWS +
  GAP * (GRID_ROWS - 1) +
  PAGINATION_HEIGHT;

const filterByCategory = (menus: MenuItem[], category: string): MenuItem[] => {
  switch (category) {
    case '추천메뉴':
      return menus.filter((m) => m.badge === 'BEST');
    case '버거':
      return menus.filter((m) => m.category === '버거');
    case '디저트/치킨':
      return menus.filter(
        (m) => m.category === '디저트' || m.category === '치킨'
      );
    case '음료/커피':
      return menus.filter((m) => m.category === '음료');
    case '행사메뉴':
      return menus.filter((m) => m.badge === 'NEW');
    default:
      return menus;
  }
};

function Home() {
  const [activeCategory, setActiveCategory] = useState('추천메뉴');
  const [page, setPage] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  const { isConnected, isListening, message, toggleListening } = useVoice();
  const { items, addItem, removeItem, total } = useCart();

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const filtered = menus ? filterByCategory(menus, activeCategory) : [];
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(0);
  };

  if (isLoading)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#e63312',
        }}
      >
        로딩 중...
      </div>
    );

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
        position: 'relative',
      }}
    >
      {/* 상단 헤더 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#fff',
          borderBottom: '1px solid #ebebeb',
          flexShrink: 0,
        }}
      >
        <button
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
          ← 처음으로
        </button>
        <span style={{ fontWeight: '800', fontSize: '17px', color: '#e63312' }}>
          리아버거
        </span>
        <div style={{ width: '72px' }} />
      </div>

      {/* 카테고리 탭 */}
      <div
        style={{
          display: 'flex',
          background: '#fff',
          borderBottom: '1px solid #ebebeb',
          flexShrink: 0,
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            style={{
              flex: 1,
              padding: '12px 2px',
              border: 'none',
              borderBottom:
                activeCategory === cat
                  ? '2.5px solid #e63312'
                  : '2.5px solid transparent',
              background: 'white',
              color: activeCategory === cat ? '#e63312' : '#999',
              fontWeight: activeCategory === cat ? '700' : '400',
              fontSize: '11px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 메뉴 영역 — 항상 고정 높이 */}
      <div
        style={{
          height: `${MENU_AREA_HEIGHT}px`,
          flexShrink: 0,
          background: '#f8f8f8',
        }}
      >
        {/* 메뉴 그리드 */}
        <div
          style={{
            padding: `${GRID_PADDING}px 12px`,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: `repeat(${GRID_ROWS}, ${CARD_HEIGHT}px)`,
            gap: `${GAP}px`,
          }}
        >
          {paged.map((menu) => (
            <div
              key={menu.id}
              onClick={() =>
                addItem({
                  id: menu.id,
                  name: menu.name,
                  price: parseInt(menu.price.replace(',', '')),
                  img_url: menu.img_url ?? '',
                })
              }
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '8px 6px',
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                border: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={menu.img_url || undefined}
                alt={menu.name}
                style={{
                  width: '54px',
                  height: '54px',
                  objectFit: 'contain',
                  background: '#fafafa',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  marginTop: '6px',
                  color: '#222',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '0 4px',
                  boxSizing: 'border-box',
                }}
              >
                {menu.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#e63312',
                  marginTop: '3px',
                  fontWeight: '700',
                }}
              >
                {parseInt(menu.price.replace(',', '')).toLocaleString()}원
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 — 항상 표시 */}
        <div
          style={{
            height: `${PAGINATION_HEIGHT}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: page === 0 ? '#eee' : '#e63312',
              color: page === 0 ? '#bbb' : 'white',
              fontSize: '14px',
              cursor: page === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ◀
          </button>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: page >= totalPages - 1 ? '#eee' : '#e63312',
              color: page >= totalPages - 1 ? '#bbb' : 'white',
              fontSize: '14px',
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 하단 AI 응답 + 파형 + 버튼 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderTop: '1px solid #ebebeb',
        }}
      >
        {/* AI 응답 + 파형 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              color: '#333',
              fontWeight: '500',
              textAlign: 'center',
              lineHeight: '1.6',
            }}
          >
            {message || '원하시는 메뉴를 말씀해 주세요'}
          </div>
          <VoiceWave isActive={isListening} />
        </div>

        {/* 버튼 영역 */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 14px 14px',
          }}
        >
          <button
            onClick={() => items.length > 0 && setCartOpen(true)}
            style={{
              flex: 1,
              background: '#f0f0f0',
              color: items.length === 0 ? '#bbb' : '#333',
              border: 'none',
              borderRadius: '12px',
              height: '52px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: items.length > 0 ? 'pointer' : 'default',
              position: 'relative',
            }}
          >
            장바구니
            {totalCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#e63312',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                }}
              >
                {totalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => items.length > 0 && navigate('/cart')}
            disabled={items.length === 0}
            style={{
              flex: 1,
              background: items.length === 0 ? '#e0e0e0' : '#e63312',
              color: items.length === 0 ? '#aaa' : 'white',
              border: 'none',
              borderRadius: '12px',
              height: '52px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: items.length === 0 ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {items.length === 0
              ? '결제하기'
              : `결제 ${total.toLocaleString()}원`}
          </button>

          <button
            onClick={toggleListening}
            disabled={!isConnected}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: 'none',
              background: isListening ? '#e63312' : '#f0f0f0',
              fontSize: '22px',
              cursor: isConnected ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isListening
                ? '0 0 0 6px rgba(230,51,18,0.25)'
                : '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
            }}
          >
            🎤
          </button>
        </div>
      </div>

      {/* 장바구니 드로어 */}
      {cartOpen && (
        <>
          <div
            onClick={() => setCartOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 10,
            }}
          />

          {message && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(66.6% + 12px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'white',
                borderRadius: '14px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                zIndex: 12,
                width: '80%',
                textAlign: 'center',
                border: '2px solid #e63312',
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '66.6%',
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              zIndex: 11,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setCartOpen(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                cursor: 'pointer',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '4px',
                  background: '#ddd',
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '12px', color: '#aaa' }}>내리기 ▼</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 16px 10px',
                fontSize: '13px',
                borderBottom: '1px solid #eee',
              }}
            >
              <span style={{ color: '#555' }}>
                주문수 <strong style={{ color: '#222' }}>{totalCount}</strong>
              </span>
              <span style={{ color: '#555' }}>
                합계{' '}
                <strong style={{ color: '#e63312' }}>
                  {total.toLocaleString()}원
                </strong>
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '10px',
                  }}
                >
                  <img
                    src={item.img_url}
                    alt={item.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      background: '#f9f9f9',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#222',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#e63312',
                        marginTop: '2px',
                        fontWeight: '700',
                      }}
                    >
                      {(item.price * item.quantity).toLocaleString()}원
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    x{item.quantity}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ccc',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: '10px 16px 16px' }}>
              <button
                onClick={() => navigate('/cart')}
                style={{
                  width: '100%',
                  background: '#e63312',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  height: '52px',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                결제 {total.toLocaleString()}원
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
