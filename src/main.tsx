
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Import type extensions to make them available globally
import './lib/api/typesExtensions';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
