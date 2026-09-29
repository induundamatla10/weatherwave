import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global resilience handler to prevent transient network issues from crashing applet runtime
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message === 'Failed to fetch' ||
      event.reason.name === 'TypeError' ||
      (typeof event.reason === 'string' && event.reason.includes('Failed to fetch')))
  ) {
    console.warn('Recovered from unhandled network error:', event.reason);
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
