import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

console.log("Main initialization...");

window.onerror = (message, source, lineno, colno, error) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.height = '100%';
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '20px';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.fontFamily = 'monospace';
  errorDiv.innerHTML = `
    <h1>GLOBAL_ERROR_DETECTED</h1>
    <p>Message: ${message}</p>
    <p>Source: ${source}</p>
    <p>Line: ${lineno}, Col: ${colno}</p>
    <pre>${error?.stack || 'No stack trace available'}</pre>
  `;
  document.body.appendChild(errorDiv);
};

createRoot(document.getElementById('root')!).render(
  <App />
);
