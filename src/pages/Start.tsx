import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bannerImg from '../assets/banner.jpg';
import touchOrderImg from '../assets/touch_order.png';
import voiceOrderImg from '../assets/voice_order.png';
import { useSession } from '../store/sessionStore';

function Start() {
  const navigate = useNavigate();
  const { resetSession } = useSession();

  useEffect(() => {
    resetSession();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        maxWidth: 'calc(100vh * 0.5625)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* 상단 배너 */}
      <div style={{ flexShrink: 0, width: '100%' }}>
        <img
          src={bannerImg}
          alt="배너"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* 하단 주문 선택 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 28px 40px',
          gap: '24px',
          background: '#f5f5f5',
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#111',
            textAlign: 'center',
            letterSpacing: '-0.3px',
          }}
        >
          주문 방식을 선택해 주세요
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            width: '100%',
          }}
        >
          {/* 터치 주문 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '32px 16px',
              borderRadius: '16px',
              background: '#fff',
              cursor: 'default',
            }}
          >
            <img
              src={touchOrderImg}
              alt="터치 주문"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                opacity: 0.35,
              }}
            />
            <span
              style={{ fontSize: '17px', fontWeight: '700', color: '#bbb' }}
            >
              터치 주문
            </span>
          </div>

          {/* 음성 주문 */}
          <div
            onClick={() => navigate('/home')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '32px 16px',
              borderRadius: '16px',
              background: '#fff',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <img
              src={voiceOrderImg}
              alt="음성 주문"
              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
            />
            <span
              style={{ fontSize: '17px', fontWeight: '700', color: '#000000' }}
            >
              음성 주문
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Start;
