import { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useVoice } from '../hooks/useVoice';
import { useSession } from './sessionStore';
import type { ScreenItem } from '../types';

interface VoiceContextValue {
  isListening: boolean;
  voiceMessage: string;
  screenItems: ScreenItem[];
  startListening: () => void;
  stopListening: () => void;
  clearScreenItems: () => void;
  setExtraActionHandler: (handler: ((action: string) => void) | null) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sessionId } = useSession();
  const extraHandlerRef = useRef<((action: string) => void) | null>(null);

  const location = useLocation();
  const { isListening, voiceMessage, screenItems, startListening, stopListening, clearScreenItems } =
    useVoice(sessionId, {
      onCartChange: () => queryClient.invalidateQueries({ queryKey: ['cart', sessionId] }),
      onTimeout: () => {
        queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
        navigate('/');
      },
      onAction: (action) => {
        if (action === 'PAGE:cart') navigate('/cart');
        else if (action === 'PAGE:welcome') navigate('/');
        else if (action === 'PAGE:menu') navigate('/home');
        else if (action === 'PAGE:complete') navigate('/payment-complete');
        else extraHandlerRef.current?.(action);
      },
    });

  const setExtraActionHandler = useCallback(
    (handler: ((action: string) => void) | null) => {
      extraHandlerRef.current = handler;
    },
    []
  );

  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/payment-complete') {
      startListening();
    } else {
      stopListening();
    }
  }, [location.pathname]);

  return (
    <VoiceContext.Provider
      value={{ isListening, voiceMessage, screenItems, startListening, stopListening, clearScreenItems, setExtraActionHandler }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export const useVoiceContext = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoiceContext must be used within VoiceProvider');
  return ctx;
};
