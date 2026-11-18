import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted so the game renders the same offline, in the desktop snap and without Google
import '@fontsource/space-grotesk/latin-300.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-700.css';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Offline play for the web build. Not in development (it would cache stale
// modules) and not in the desktop shell, which serves the game from app://.
if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // No offline cache this visit; the game still plays online
    });
  });
}
