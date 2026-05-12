import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { SessionContext } from './store/sessionStore';
import { VoiceProvider } from './store/voiceStore';
import Start from './pages/Start';
import Home from './pages/Home';
import Cart from './pages/Cart';
import PaymentComplete from './pages/PaymentComplete';

function App() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());

  const resetSession = useCallback(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, resetSession }}>
      <BrowserRouter>
        <VoiceProvider>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/home" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/payment-complete" element={<PaymentComplete />} />
          </Routes>
        </VoiceProvider>
      </BrowserRouter>
    </SessionContext.Provider>
  );
}

export default App;
