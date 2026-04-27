import { useQuery } from '@tanstack/react-query';
import { getMenus } from '../api/menu';
import { useState } from 'react';
import MenuModal from '../components/MenuModal';

function Home() {
  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const [showModal, setShowModal] = useState(false);

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        maxWidth: 'calc(100vh * 0.5625)',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* 배경 이미지 */}
      <img
        src="/kiosk_background.png"
        alt="background"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* 추천 메뉴 + 전체 메뉴 보기 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
        }}
      >
        {/* 상단 라벨 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            ⭐ 추천 메뉴
          </span>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ≡ 전체 메뉴 보기
          </button>
        </div>

        {/* 메뉴 카드 3개 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {menus
            ?.filter((menu) => menu.badge === 'BEST')
            .slice(0, 3)
            .map((menu) => (
              <div
                key={menu.id}
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '16px',
                  padding: '10px 8px',
                  flex: 1,
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <img
                  src={menu.img_url}
                  alt={menu.name}
                  style={{
                    width: '60px',
                    height: '50px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '11px',
                    marginTop: '6px',
                  }}
                >
                  {menu.name}
                </div>
                <div
                  style={{
                    color: '#e63312',
                    fontSize: '11px',
                    marginTop: '2px',
                  }}
                >
                  {parseInt(menu.price.replace(',', '')).toLocaleString()}원
                </div>
              </div>
            ))}
        </div>
      </div>
      {showModal && <MenuModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default Home;
