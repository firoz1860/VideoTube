import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { applyResolvedTheme, getInitialResolvedTheme } from './context/ThemeContext.tsx';
import './index.css';

applyResolvedTheme(getInitialResolvedTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
