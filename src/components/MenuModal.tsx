import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MenuItem } from '../types';
import { getMenus } from '../api/menu';

const PAGE_SIZE = 9;

const CATEGORIES = ['추천메뉴', '버거', '디저트/치킨', '음료/커피', '행사메뉴'];

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

interface Props {
  onClose: () => void;
}

function MenuModal({ onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState('추천메뉴');
  const [page, setPage] = useState(0);

  const { data: menus } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const filtered = menus ? filterByCategory(menus, activeCategory) : [];
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(0);
  };

  return (
    <>
      {/* 딤 배경 */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 10,
        }}
      />

      {/* 팝업 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          height: '85%',
          background: '#fff',
          borderRadius: '20px',
          zIndex: 11,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #eee',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
            전체 메뉴
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#333',
            }}
          >
            ✕
          </button>
        </div>

        {/* 카테고리 탭 */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 12px',
            borderBottom: '1px solid #eee',
            flexShrink: 0,
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                background: activeCategory === cat ? '#e63312' : '#f0f0f0',
                color: activeCategory === cat ? 'white' : '#333',
                fontWeight: activeCategory === cat ? 'bold' : 'normal',
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 메뉴 그리드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '10px 12px',
            alignContent: 'start',
            flex: 1,
            overflowY: 'hidden',
          }}
        >
          {paged.map((menu: MenuItem) => (
            <div
              key={menu.id}
              style={{
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f9f9f9',
                borderRadius: '12px',
                padding: '6px',
                height: '110px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={menu.img_url || undefined}
                alt={menu.name}
                style={{
                  width: '60%',
                  aspectRatio: '1',
                  objectFit: 'contain',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                }}
              />
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginTop: '4px',
                  wordBreak: 'keep-all',
                }}
              >
                {menu.name}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#e63312',
                  marginTop: '2px',
                }}
              >
                {parseInt(menu.price.replace(',', '')).toLocaleString()}원
              </div>
            </div>
          ))}
        </div>

        {/* 페이지 네비게이션 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            padding: '10px',
            borderTop: '1px solid #eee',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            style={{
              padding: '8px 24px',
              borderRadius: '20px',
              border: 'none',
              background: page === 0 ? '#eee' : '#e63312',
              color: page === 0 ? '#999' : 'white',
              cursor: page === 0 ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            ◀ 이전
          </button>
          <span style={{ fontSize: '13px', color: '#666' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            style={{
              padding: '8px 24px',
              borderRadius: '20px',
              border: 'none',
              background: page === totalPages - 1 ? '#eee' : '#e63312',
              color: page === totalPages - 1 ? '#999' : 'white',
              cursor: page === totalPages - 1 ? 'default' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            다음 ▶
          </button>
        </div>
      </div>
    </>
  );
}

export default MenuModal;
