
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'sonner';
import { initializePreloadServices } from './services/preloadServices';

// Initialize preloading services as early as possible
initializePreloadServices();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-center" closeButton richColors />
  </React.StrictMode>,
);
