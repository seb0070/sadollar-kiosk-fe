import { useState, useEffect } from 'react';
import client from '../api/client';
import type { MenuItem } from '../types';

interface Option {
  option_id: string;
  option_type: string;
  menu_id: number;
  name: string;
  extra_price: number;
}

interface SetMenu {
  set_id: number;
  name: string;
  set_price: number;
  img_url?: string;
}

interface Props {
  menu: MenuItem;
  onClose: () => void;
  onConfirm: (params: {
    menu_id: number;
    unit_price: number;
    is_set: boolean;
    drink_option?: string;
    side_option?: string;
    quantity: number;
  }) => void;
}

type Step = 'type' | 'drink' | 'side' | 'confirm';

function OptionModal({ menu, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<Step>('type');
  const [isSet, setIsSet] = useState(false);
  const [setInfo, setSetInfo] = useState<SetMenu | null>(null);
  const [drinks, setDrinks] = useState<Option[]>([]);
  const [sides, setSides] = useState<Option[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Option | null>(null);
  const [selectedSide, setSelectedSide] = useState<Option | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // 옵션 목록 로드
    client.get('/options').then((res) => {
      const all: Option[] = res.data.items;
      setDrinks(all.filter((o) => o.option_type === '드링크'));
      setSides(all.filter((o) => o.option_type === '사이드'));
    });
    // 세트 정보 로드
    client
      .get(`/menu/${menu.id}/set`)
      .then((res) => {
        if (res.data.set) setSetInfo(res.data.set);
      })
      .catch(() => {});
  }, [menu.id]);

  const unitPrice = isSet
    ? (setInfo?.set_price ?? menu.price + 2000) +
      (selectedDrink?.extra_price ?? 0) +
      (selectedSide?.extra_price ?? 0)
    : menu.price;

  const handleTypeSelect = (set: boolean) => {
    setIsSet(set);
    if (set) {
      setStep('drink');
    } else {
      setStep('confirm');
    }
  };

  const handleDrinkSelect = (drink: Option) => {
    setSelectedDrink(drink);
    setStep('side');
  };

  const handleSideSelect = (side: Option) => {
    setSelectedSide(side);
    setStep('confirm');
  };

  const handleConfirm = () => {
    onConfirm({
      menu_id: menu.id,
      unit_price: unitPrice,
      is_set: isSet,
      drink_option: selectedDrink?.option_id,
      side_option: selectedSide?.option_id,
      quantity,
    });
    onClose();
  };

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  };

  const sheet: React.CSSProperties = {
    background: 'white',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: 'calc(100vh * 0.5625)',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const header: React.CSSProperties = {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  };

  const body: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  };

  const footer: React.CSSProperties = {
    padding: '12px 16px 20px',
    borderTop: '1px solid #f0f0f0',
    flexShrink: 0,
  };

  const optionBtn = (selected: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: selected ? '2px solid #e63312' : '1.5px solid #e0e0e0',
    background: selected ? '#fff5f3' : 'white',
    color: selected ? '#e63312' : '#333',
    fontWeight: selected ? '700' : '500',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '8px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div style={header}>
          {step !== 'type' && (
            <button
              onClick={() => {
                if (step === 'drink') setStep('type');
                if (step === 'side') setStep('drink');
                if (step === 'confirm') setStep(isSet ? 'side' : 'type');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#555',
                padding: 0,
              }}
            >
              ←
            </button>
          )}
          <img
            src={menu.img_url || undefined}
            alt={menu.name}
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
              borderRadius: '8px',
              background: '#f5f5f5',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#222' }}>
              {menu.name}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#e63312',
                fontWeight: '600',
                marginTop: '2px',
              }}
            >
              {menu.price.toLocaleString()}원
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#bbb',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Step 1: 단품 / 세트 */}
        {step === 'type' && (
          <>
            <div style={body}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#222',
                  marginBottom: '16px',
                }}
              >
                어떻게 주문하시겠어요?
              </div>
              <button
                style={optionBtn(!isSet)}
                onClick={() => handleTypeSelect(false)}
              >
                <span>단품</span>
                <span style={{ fontSize: '13px', color: '#888' }}>
                  {menu.price.toLocaleString()}원
                </span>
              </button>
              {setInfo && (
                <button
                  style={optionBtn(isSet)}
                  onClick={() => handleTypeSelect(true)}
                >
                  <span>
                    세트{' '}
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      (음료+사이드 포함)
                    </span>
                  </span>
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    {setInfo.set_price.toLocaleString()}원
                  </span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Step 2: 음료 선택 */}
        {step === 'drink' && (
          <>
            <div style={body}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#222',
                  marginBottom: '16px',
                }}
              >
                음료를 선택해주세요
              </div>
              {drinks.map((d) => (
                <button
                  key={d.option_id}
                  style={optionBtn(selectedDrink?.option_id === d.option_id)}
                  onClick={() => handleDrinkSelect(d)}
                >
                  <span>{d.name}</span>
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    {d.extra_price > 0
                      ? `+${d.extra_price.toLocaleString()}원`
                      : '기본'}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3: 사이드 선택 */}
        {step === 'side' && (
          <>
            <div style={body}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#222',
                  marginBottom: '16px',
                }}
              >
                사이드를 선택해주세요
              </div>
              {sides.map((s) => (
                <button
                  key={s.option_id}
                  style={optionBtn(selectedSide?.option_id === s.option_id)}
                  onClick={() => handleSideSelect(s)}
                >
                  <span>{s.name}</span>
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    {s.extra_price > 0
                      ? `+${s.extra_price.toLocaleString()}원`
                      : '기본'}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4: 최종 확인 */}
        {step === 'confirm' && (
          <>
            <div style={body}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#222',
                  marginBottom: '16px',
                }}
              >
                주문 내역을 확인해주세요
              </div>
              <div
                style={{
                  background: '#f9f9f9',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#555' }}>메뉴</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {menu.name}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#555' }}>종류</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {isSet ? '세트' : '단품'}
                  </span>
                </div>
                {isSet && selectedDrink && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#555' }}>
                      음료
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {selectedDrink.name}
                    </span>
                  </div>
                )}
                {isSet && selectedSide && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#555' }}>
                      사이드
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {selectedSide.name}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    borderTop: '1px solid #e0e0e0',
                    marginTop: '8px',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#555' }}>금액</span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#e63312',
                    }}
                  >
                    {unitPrice.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 수량 선택 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                }}
              >
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1.5px solid #ddd',
                    background: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    minWidth: '24px',
                    textAlign: 'center',
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1.5px solid #ddd',
                    background: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </>
        )}

        {/* 하단 버튼 */}
        <div style={footer}>
          {step === 'confirm' ? (
            <button
              onClick={handleConfirm}
              style={{
                width: '100%',
                height: '52px',
                background: '#e63312',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              {(unitPrice * quantity).toLocaleString()}원 담기
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: '52px',
                background: '#f0f0f0',
                color: '#555',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OptionModal;
