import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMenus, getMenuSetInfo } from '../api/menu';
import { useVoice } from '../hooks/useVoice';
import { useCart } from '../store/cartStore';
import { useSession } from '../store/sessionStore';
import VoiceWave from '../components/VoiceWave';
import OptionModal from '../components/OptionModal';
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

const parseBadge = (badge: string): string[] => {
  try {
    return JSON.parse(badge);
  } catch {
    return [];
  }
};

const filterByCategory = (menus: MenuItem[], category: string): MenuItem[] => {
  switch (category) {
    case '추천메뉴':
      return menus.filter((m) => parseBadge(m.badge ?? '').includes('추천'));
    case '버거':
      return menus.filter((m) => m.category === '버거');
    case '디저트/치킨':
      return menus.filter(
        (m) => m.category === '디저트' || m.category === '치킨'
      );
    case '음료/커피':
      return menus.filter((m) => m.category === '음료');
    case '행사메뉴':
      return menus.filter((m) => parseBadge(m.badge ?? '').includes('NEW'));
    default:
      return menus;
  }
};

function Home() {
  const [activeCategory, setActiveCategory] = useState('추천메뉴');
  const [page, setPage] = useState(0);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const { sessionId } = useSession();

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const { addItem, totalCount, refetch } = useCart(menus);

  const {
    isConnected,
    isListening,
    voiceMessage,
    screenItems,
    toggleListening,
    stopListening,
  } = useVoice(sessionId, {
    onCartChange: refetch,
    onTimeout: refetch,
  });

  const filtered = menus ? filterByCategory(menus, activeCategory) : [];
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2000);
  };

  const handleMenuClick = async (menu: MenuItem) => {
    stopListening();
    const setInfo = await getMenuSetInfo(menu.id);
    if (setInfo) {
      // 세트 정보 있으면 모달 티우기
      setSelectedMenu(menu);
    } else {
      // 세트 없으면 바로 담기
      addItem(menu.id, menu.price, 0, '', '');
      showToast('장바구니에 담겼어요! 🍔');
    }
  };

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
      {/* 헤더 */}
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

      {/* 메뉴 영역 */}
      <div
        style={{
          height: `${MENU_AREA_HEIGHT}px`,
          flexShrink: 0,
          background: '#f8f8f8',
        }}
      >
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
              onClick={() => handleMenuClick(menu)}
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
                {menu.price.toLocaleString()}원
              </div>
            </div>
          ))}
        </div>
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

      {/* 하단 음성 영역 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderTop: '1px solid #ebebeb',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            gap: '10px',
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
            {voiceMessage || '원하시는 메뉴를 말씀해 주세요'}
          </div>
          {screenItems.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '100%',
              }}
            >
              {screenItems.map((item: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: '#fff5f3',
                    border: '1.5px solid #e63312',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#e63312',
                    textAlign: 'center',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
          <VoiceWave isActive={isListening} />
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '10px 14px 14px' }}>
          <button
            onClick={() => navigate('/cart')}
            style={{
              flex: 1,
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '12px',
              height: '52px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            장바구니 보기
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

      {/* 옵션 모달 */}
      {/* 토스트 메시지 */}
      {toastMsg && (
        <div
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {toastMsg}
        </div>
      )}

      {selectedMenu && (
        <OptionModal
          menu={selectedMenu}
          voiceMessage={voiceMessage}
          isListening={isListening}
          isConnected={isConnected}
          onToggleListening={toggleListening}
          onClose={() => setSelectedMenu(null)}
          onConfirm={(params) => {
            addItem(
              params.menu_id,
              params.unit_price,
              params.is_set ? 1 : 0,
              params.drink_option,
              params.side_option
            );
            showToast('장바구니에 담겼어요! 🍔');
          }}
        />
      )}
    </div>
  );
}

export default Home;
