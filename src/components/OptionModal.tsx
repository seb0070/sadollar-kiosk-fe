import { useState, useEffect } from 'react';
import client from '../api/client';
import type { MenuItem } from '../types';

interface Option {
  option_id: string;
  option_type: string;
  menu_id: number;
  name: string;
  extra_price: number;
  img_url?: string;
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
  initialStep?: 'type' | 'drink' | 'side' | 'confirm';
  initialIsSet?: boolean;
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
const OPTIONS_PER_PAGE = 6;

function OptionModal({ menu, onClose, initialStep, initialIsSet, onConfirm }: Props) {
  const [step, setStep] = useState<Step>(initialStep ?? 'type');
  const [isSet, setIsSet] = useState(
    initialIsSet ?? (initialStep === 'drink' || initialStep === 'side')
  );
  const [setInfo, setSetInfo] = useState<SetMenu | null>(null);
  const [drinks, setDrinks] = useState<Option[]>([]);
  const [sides, setSides] = useState<Option[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Option | null>(null);
  const [selectedSide, setSelectedSide] = useState<Option | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [drinkPage, setDrinkPage] = useState(0);
  const [sidePage, setSidePage] = useState(0);

  useEffect(() => {
    client.get('/options').then((res) => {
      const all: Option[] = res.data.items;
      setDrinks(all.filter((o) => o.option_type === '드링크'));
      setSides(all.filter((o) => o.option_type === '사이드'));
    });
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
    setStep(set ? 'drink' : 'confirm');
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
  const handlePrev = () => {
    if (step === 'drink') setStep('type');
    else if (step === 'side') setStep('drink');
    else if (step === 'confirm') setStep(isSet ? 'side' : 'type');
  };

  const renderOptionCard = (
    item: Option,
    selected: boolean,
    onClick: () => void,
    fallbackEmoji: string
  ) => (
    <button
      key={item.option_id}
      onClick={onClick}
      style={{
        border: selected ? '2px solid #c95020' : '1.5px solid #e0e0e0',
        borderRadius: '10px',
        background: selected ? '#fff5f3' : 'white',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '6px 4px',
      }}
    >
      {item.img_url ? (
        <img
          src={item.img_url}
          alt={item.name}
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            borderRadius: '6px',
            background: '#f5f5f5',
          }}
        />
      ) : (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          {fallbackEmoji}
        </div>
      )}
      <div
        style={{
          fontSize: '10px',
          fontWeight: '600',
          color: selected ? '#c95020' : '#222',
          textAlign: 'center',
          lineHeight: '1.3',
        }}
      >
        {item.name}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: selected ? '#c95020' : '#888',
          fontWeight: '600',
        }}
      >
        {item.extra_price > 0
          ? `+${item.extra_price.toLocaleString()}원`
          : '기본'}
      </div>
    </button>
  );

  const renderPagination = (
    page: number,
    total: number,
    setPage: React.Dispatch<React.SetStateAction<number>>
  ) =>
    total > OPTIONS_PER_PAGE ? (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          padding: '10px 0 0',
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
          }}
        >
          ◀
        </button>
        <span style={{ fontSize: '12px', color: '#999' }}>
          {page + 1} / {Math.ceil(total / OPTIONS_PER_PAGE)}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={(page + 1) * OPTIONS_PER_PAGE >= total}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background:
              (page + 1) * OPTIONS_PER_PAGE >= total ? '#eee' : '#c95020',
            color: (page + 1) * OPTIONS_PER_PAGE >= total ? '#bbb' : 'white',
            fontSize: '14px',
            cursor:
              (page + 1) * OPTIONS_PER_PAGE >= total ? 'default' : 'pointer',
          }}
        >
          ▶
        </button>
      </div>
    ) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '88%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 본체 */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            height: '50vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <img
              src={menu.img_url || undefined}
              alt={menu.name}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                borderRadius: '8px',
                background: '#f5f5f5',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: '700',
                  fontSize: '13px',
                  color: '#222',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {menu.name}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#c95020',
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
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: '#f0f0f0',
                color: '#888',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* 콘텐츠 */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {step === 'type' && (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#222',
                    padding: '14px 16px 10px',
                  }}
                >
                  어떻게 주문하시겠어요?
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: setInfo ? '1fr 1fr' : '1fr',
                      gap: '12px',
                      width: '100%',
                    }}
                  >
                    <button
                      onClick={() => handleTypeSelect(false)}
                      style={{
                        border: '1.5px solid #e0e0e0',
                        borderRadius: '16px',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        height: '130px',
                      }}
                    >
                      <img
                        src={menu.img_url || undefined}
                        alt={menu.name}
                        style={{
                          width: '44px',
                          height: '44px',
                          objectFit: 'contain',
                          borderRadius: '10px',
                          background: '#f5f5f5',
                        }}
                      />
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#222' }}>
                        단품
                      </div>
                      <div style={{ fontSize: '13px', color: '#c95020', fontWeight: '700' }}>
                        {menu.price.toLocaleString()}원
                      </div>
                    </button>
                    {setInfo && (
                      <button
                        onClick={() => handleTypeSelect(true)}
                        style={{
                          border: '1.5px solid #e0e0e0',
                          borderRadius: '16px',
                          background: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          height: '130px',
                        }}
                      >
                        <img
                          src={setInfo.img_url || menu.img_url || undefined}
                          alt={setInfo.name}
                          style={{
                            width: '44px',
                            height: '44px',
                            objectFit: 'contain',
                            borderRadius: '10px',
                            background: '#f5f5f5',
                          }}
                        />
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#222' }}>
                          세트
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          음료+사이드 포함
                        </div>
                        <div style={{ fontSize: '13px', color: '#c95020', fontWeight: '700' }}>
                          {setInfo.set_price.toLocaleString()}원
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 'drink' && (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#222',
                    padding: '14px 16px 10px',
                  }}
                >
                  음료를 선택해주세요
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(2, 1fr)',
                    gap: '10px',
                    padding: '0 16px 14px',
                  }}
                >
                  {drinks
                    .slice(
                      drinkPage * OPTIONS_PER_PAGE,
                      (drinkPage + 1) * OPTIONS_PER_PAGE
                    )
                    .map((d) =>
                      renderOptionCard(
                        d,
                        selectedDrink?.option_id === d.option_id,
                        () => handleDrinkSelect(d),
                        '🥤'
                      )
                    )}
                </div>
              </>
            )}

            {step === 'side' && (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#222',
                    padding: '14px 16px 10px',
                  }}
                >
                  사이드를 선택해주세요
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(2, 1fr)',
                    gap: '10px',
                    padding: '0 16px 14px',
                  }}
                >
                  {sides
                    .slice(
                      sidePage * OPTIONS_PER_PAGE,
                      (sidePage + 1) * OPTIONS_PER_PAGE
                    )
                    .map((s) =>
                      renderOptionCard(
                        s,
                        selectedSide?.option_id === s.option_id,
                        () => handleSideSelect(s),
                        '🍟'
                      )
                    )}
                </div>
              </>
            )}

            {step === 'confirm' && (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#222',
                    padding: '14px 16px 10px',
                  }}
                >
                  주문 내역을 확인해주세요
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 16px 16px',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      background: '#f9f9f9',
                      borderRadius: '12px',
                      padding: '14px',
                    }}
                  >
                    {[
                      { label: '메뉴', value: menu.name },
                      { label: '종류', value: isSet ? '세트' : '단품' },
                      ...(isSet && selectedDrink
                        ? [{ label: '음료', value: selectedDrink.name }]
                        : []),
                      ...(isSet && selectedSide
                        ? [{ label: '사이드', value: selectedSide.name }]
                        : []),
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#555' }}>
                          {label}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        borderTop: '1px solid #e0e0e0',
                        marginTop: '8px',
                        paddingTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#555' }}>
                        금액
                      </span>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#c95020',
                        }}
                      >
                        {unitPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>
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
          </div>

          {/* 페이지네이션 */}
          <div
            style={{
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {step === 'drink' &&
              drinks.length > OPTIONS_PER_PAGE &&
              renderPagination(drinkPage, drinks.length, setDrinkPage)}
            {step === 'side' &&
              sides.length > OPTIONS_PER_PAGE &&
              renderPagination(sidePage, sides.length, setSidePage)}
          </div>

          {/* 하단 버튼 */}
          <div
            style={{
              padding: '4px 14px 14px',
              flexShrink: 0,
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {step === 'confirm' ? (
              <>
                <button
                  onClick={handlePrev}
                  style={{
                    flex: 1,
                    height: '44px',
                    background: 'white',
                    color: '#555',
                    border: '1.5px solid #ddd',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  이전
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 2,
                    height: '44px',
                    background: '#c95020',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                >
                  {(unitPrice * quantity).toLocaleString()}원 담기
                </button>
              </>
            ) : step === 'type' ? (
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  height: '44px',
                  background: '#f0f0f0',
                  color: '#555',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            ) : (
              <>
                <button
                  onClick={handlePrev}
                  style={{
                    flex: 1,
                    height: '44px',
                    background: 'white',
                    color: '#555',
                    border: '1.5px solid #ddd',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  이전
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    height: '44px',
                    background: '#f0f0f0',
                    color: '#555',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptionModal;
