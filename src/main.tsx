import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TradingProvider } from './context/TradingContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TradingProvider>
          <App />
        </TradingProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);