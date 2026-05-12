interface Props {
  isActive: boolean;
}

function VoiceWave({ isActive }: Props) {
  const bars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: '32px',
      }}
    >
      {bars.map((i) => (
        <div
          key={i}
          style={{
            width: '3px',
            borderRadius: '2px',
            background: isActive ? '#c95020' : '#ddd',
            height: isActive ? undefined : '4px',
            animation: isActive
              ? `wave ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite alternate`
              : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 4px; }
          to { height: 28px; }
        }
      `}</style>
    </div>
  );
}

export default VoiceWave;
