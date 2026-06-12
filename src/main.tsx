import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent scrolling on number inputs globally to avoid accidental value changes
document.addEventListener('wheel', () => {
  if (document.activeElement && (document.activeElement as HTMLInputElement).type === 'number') {
    (document.activeElement as HTMLElement).blur();
  }
});

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
