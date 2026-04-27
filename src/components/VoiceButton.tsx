interface Props {
  isConnected: boolean;
  isListening: boolean;
  onToggle: () => void;
}

function VoiceButton({ isConnected, isListening, onToggle }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '2%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <button
        onClick={onToggle}
        disabled={!isConnected}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: 'none',
          background: isListening ? '#e63312' : 'rgba(255,255,255,0.9)',
          boxShadow: isListening
            ? '0 0 0 8px rgba(230,51,18,0.3)'
            : '0 4px 12px rgba(0,0,0,0.3)',
          cursor: isConnected ? 'pointer' : 'default',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        🎤
      </button>
      <span
        style={{
          color: 'white',
          fontSize: '11px',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {!isConnected
          ? '연결 중...'
          : isListening
          ? '듣는 중... (탭하여 종료)'
          : '탭하여 말하기'}
      </span>
    </div>
  );
}

export default VoiceButton;
