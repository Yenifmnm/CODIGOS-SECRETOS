import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
/* Correcciones exclusivas de iPhone. Va después del global a propósito, aunque
   sus reglas no dependen del orden: suben especificidad. Ver la cabecera del
   archivo antes de agregarle nada. */
import './styles/ios.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
