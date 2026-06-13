import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent scrolling on number inputs globally to avoid accidental value changes
document.addEventListener('wheel', (e) => {
  if (document.activeElement && (document.activeElement as HTMLInputElement).type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
