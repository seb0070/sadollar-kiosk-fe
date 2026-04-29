import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { SessionContext } from './store/sessionStore';
import Home from './pages/Home';
import Cart from './pages/Cart';

function App() {
  const [sessionId] = useState(() => crypto.randomUUID());

  return (
    <SessionContext.Provider value={{ sessionId }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </BrowserRouter>
    </SessionContext.Provider>
  );
}

export default App;
