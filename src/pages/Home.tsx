import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMenus, getMenuSetInfo } from '../api/menu';
import { useVoiceContext } from '../store/voiceStore';
import { useCart } from '../store/cartStore';
import { wsManager } from '../lib/wsManager';
import VoiceWave from '../components/VoiceWave';
import OptionModal from '../components/OptionModal';
import type { MenuItem, ScreenItem } from '../types';

const CATEGORIES = ['추천메뉴', '버거', '디저트/치킨', '음료/커피', '행사메뉴'];
const CARD_HEIGHT = 115;
const GRID_ROWS = 3;
const ITEMS_PER_PAGE = 9;
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
  const [modalInitialStep, setModalInitialStep] = useState<
    'type' | 'drink' | 'side' | 'confirm'
  >('type');
  const [modalIsSet, setModalIsSet] = useState(false);
  const [modalVersion, setModalVersion] = useState(0);
  const [voiceSelectedDrink, setVoiceSelectedDrink] = useState('');
  const [voiceSelectedSide, setVoiceSelectedSide] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const { addItem, totalCount } = useCart(menus);

  const {
    isListening,
    voiceMessage,
    screenItems,
    startListening,
    clearScreenItems,
    setExtraActionHandler,
  } = useVoiceContext();

  const homeActionHandlerRef = useRef<(action: string, drinkOption?: string, sideOption?: string) => void>(() => {});

  useEffect(() => {
    homeActionHandlerRef.current = (action: string, drinkOption?: string, sideOption?: string) => {
      if (action.startsWith('TAB:')) {
        const tab = action.replace('TAB:', '');
        const tabMap: Record<string, string> = {
          디저트: '디저트/치킨',
          치킨: '디저트/치킨',
          음료: '음료/커피',
          커피: '음료/커피',
          아이스샷: '음료/커피',
        };
        setActiveCategory(tabMap[tab] ?? tab);
        setPage(0);
      } else if (action === 'CART_ADD') {
        if (selectedMenu) {
          setModalIsSet(modalInitialStep === 'drink' || modalInitialStep === 'side');
          setModalInitialStep('confirm');
          setVoiceSelectedDrink(drinkOption ?? '');
          setVoiceSelectedSide(sideOption ?? '');
        }
        startListening();
      } else if (action.startsWith('TYPE_SELECT:')) {
        const menuId = parseInt(action.replace('TYPE_SELECT:', ''));
        const menu = !isNaN(menuId)
          ? menus?.find((m) => m.id === menuId) ?? null
          : null;
        if (menu) {
          setModalIsSet(false);
          setModalInitialStep('type');
          setSelectedMenu(menu);
          setModalVersion(v => v + 1);
        }
      } else if (action.startsWith('DRINK_SELECT:')) {
        const menuId = parseInt(action.replace('DRINK_SELECT:', ''));
        const menu = !isNaN(menuId)
          ? menus?.find((m) => m.id === menuId) ?? null
          : null;
        if (menu) {
          setVoiceSelectedDrink('');
          setVoiceSelectedSide('');
          setModalIsSet(true);
          setModalInitialStep('drink');
          setSelectedMenu(menu);
          setModalVersion(v => v + 1);
        }
      } else if (action.startsWith('SIDE_SELECT:')) {
        const menuId = parseInt(action.replace('SIDE_SELECT:', ''));
        const menu = !isNaN(menuId)
          ? menus?.find((m) => m.id === menuId) ?? null
          : null;
        if (menu) {
          setModalIsSet(true);
          setModalInitialStep('side');
          setSelectedMenu(menu);
          setModalVersion(v => v + 1);
        }
      }
    };
  });

  useEffect(() => {
    setExtraActionHandler((action, drinkOption, sideOption) => homeActionHandlerRef.current(action, drinkOption, sideOption));
    return () => setExtraActionHandler(null);
  }, [setExtraActionHandler]);

  const prevTotalCountRef = useRef(-1);
  useEffect(() => {
    if (
      prevTotalCountRef.current !== -1 &&
      totalCount > prevTotalCountRef.current &&
      selectedMenu &&
      modalInitialStep === 'confirm'
    ) {
      setSelectedMenu(null);
      setVoiceSelectedDrink('');
      setVoiceSelectedSide('');
    }
    prevTotalCountRef.current = totalCount;
  }, [totalCount]); // eslint-disable-line react-hooks/exhaustive-deps

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
    wsManager.notifyTouch();
    const setInfo = await getMenuSetInfo(menu.id);
    if (setInfo) {
      setModalInitialStep('type');
      setSelectedMenu(menu);
    } else {
      addItem(menu.id, menu.price, 0, '', '');
      showToast('장바구니에 담겼어요! 🍔');
      startListening();
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
          height: '100%',
          color: '#c95020',
        }}
      >
        로딩 중...
      </div>
    );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/')}
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
            <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" stroke="#555" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M9 22V13h6v9" stroke="#555" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          처음으로
        </button>
        <span style={{ fontWeight: '800', fontSize: '17px', color: '#c95020' }}>
          리아버거
        </span>
        <div style={{ width: '72px' }} />
      </div>

      {/* 카테고리 탭 - 파일 인덱스 스타일 */}
      <div
        style={{
          display: 'flex',
          background: '#fff',
          padding: '7px 8px 0',
          gap: '3px',
          flexShrink: 0,
          borderBottom: '2px solid #ebebeb',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                flex: 1,
                padding: isActive ? '9px 3px' : '7px 3px',
                borderTop: `1.5px solid ${isActive ? '#e0e0e0' : 'transparent'}`,
                borderLeft: `1.5px solid ${isActive ? '#e0e0e0' : 'transparent'}`,
                borderRight: `1.5px solid ${isActive ? '#e0e0e0' : 'transparent'}`,
                borderBottom: isActive ? '2px solid #f8f8f8' : 'none',
                borderRadius: '8px 8px 0 0',
                background: isActive ? '#f8f8f8' : '#eeeeee',
                color: isActive ? '#c95020' : '#666',
                fontWeight: isActive ? '700' : '500',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: isActive ? '-2px' : '0',
                transition: 'all 0.1s',
                boxShadow: isActive ? '0 -2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {cat}
            </button>
          );
        })}
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
                  fontSize: '12px',
                  fontWeight: '600',
                  marginTop: '5px',
                  color: '#222',
                  width: '100%',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  padding: '0 4px',
                  boxSizing: 'border-box',
                  lineHeight: '1.3',
                  textAlign: 'center',
                }}
              >
                {menu.name}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#c95020',
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
              background: page === 0 ? '#eee' : '#c95020',
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
              background: page >= totalPages - 1 ? '#eee' : '#c95020',
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

      {/* 음성 영역 - 남은 공간 채움 (텍스트/파형은 fixed로 표시) */}
      <div style={{ flex: 1, background: '#f8f8f8' }} />

      {/* 하단 버튼 영역 */}
      <div
        style={{
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '8px', padding: '10px 14px 14px' }}>
          <button
            onClick={() => navigate('/cart')}
            disabled={totalCount === 0}
            style={{
              flex: 1,
              background: totalCount > 0 ? '#c95020' : '#f0f0f0',
              color: totalCount > 0 ? 'white' : '#bbb',
              border: 'none',
              borderRadius: '12px',
              height: '48px',
              fontWeight: '600',
              fontSize: '15px',
              letterSpacing: '-0.2px',
              cursor: totalCount > 0 ? 'pointer' : 'default',
              position: 'relative',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {totalCount > 0 ? `장바구니 보기 (${totalCount})` : '장바구니 보기'}
          </button>
        </div>
      </div>

      {/* 옵션 모달 */}
      {/* 토스트 메시지 */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(30,30,30,0.88)',
            color: 'white',
            padding: '28px 40px',
            borderRadius: '18px',
            fontSize: '17px',
            fontWeight: '700',
            textAlign: 'center',
            zIndex: 250,
            pointerEvents: 'none',
            minWidth: '200px',
            backdropFilter: 'blur(4px)',
            letterSpacing: '-0.3px',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 추천 메뉴 모달 */}
      {screenItems.length > 0 && selectedMenu === null && (
        <div
          onClick={() => clearScreenItems()}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(2px)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearScreenItems();
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              maxWidth: '360px',
              maxHeight: '80vh',
              overflowY: 'auto' as const,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${
                  screenItems.length === 1
                    ? 1
                    : screenItems.length === 2
                    ? 2
                    : screenItems.length === 4
                    ? 2
                    : 3
                }, 1fr)`,
                gap: '14px',
                width: '100%',
                ...(screenItems.length === 1 ? { maxWidth: '160px' } : {}),
              }}
            >
              {screenItems.map((item: ScreenItem, idx: number) => {
                const resolved = menus?.find((m) => m.name === item.name);
                const displayImg = item.img_url || resolved?.img_url || '';
                const displayPrice = item.price || resolved?.price || 0;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (resolved) handleMenuClick(resolved);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: 'white',
                      border: '1.5px solid #c95020',
                      borderRadius: '14px',
                      padding: '12px 8px',
                      cursor: 'pointer',
                      aspectRatio: '3/4',
                      overflow: 'hidden',
                      boxSizing: 'border-box' as const,
                    }}
                  >
                    <img
                      src={displayImg}
                      alt={item.name}
                      style={{
                        width: '55%',
                        aspectRatio: '1',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        background: '#f5f5f5',
                      }}
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#222',
                        textAlign: 'center',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.3',
                        width: '100%',
                        padding: '0 4px',
                        boxSizing: 'border-box' as const,
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#c95020',
                        fontWeight: '700',
                      }}
                    >
                      {displayPrice.toLocaleString()}원
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {selectedMenu && (
        <OptionModal
          key={`${selectedMenu.id}-${modalInitialStep}-${modalVersion}`}
          menu={selectedMenu}
          initialStep={modalInitialStep}
          initialIsSet={modalIsSet}
          preselectedDrink={voiceSelectedDrink}
          preselectedSide={voiceSelectedSide}
          onDrinkSelect={(name) => setVoiceSelectedDrink(name)}
          onSideSelect={(name) => setVoiceSelectedSide(name)}
          onClose={() => {
            setSelectedMenu(null);
            setVoiceSelectedDrink('');
            setVoiceSelectedSide('');
            startListening();
          }}
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

      {/* 음성 텍스트 - 모달 유무에 따라 색상 전환 */}
      <div
        style={{
          position: 'fixed',
          top: '570px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          zIndex: 200,
          pointerEvents: 'none',
          textAlign: 'center',
          fontSize: '17px',
          fontWeight: '700',
          color: (!!selectedMenu || screenItems.length > 0) ? 'white' : '#333',
          lineHeight: '1.5',
        }}
      >
        {voiceMessage || '원하시는 메뉴를 말씀해 주세요'}
      </div>

      {/* 파형 */}
      <div
        style={{
          position: 'fixed',
          bottom: '89px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          pointerEvents: 'none',
        }}
      >
        <VoiceWave isActive={isListening} />
      </div>
    </div>
  );
}

export default Home;
