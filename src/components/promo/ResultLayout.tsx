import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage } from '../layout/Stage';
import { Deco } from '../layout/Deco';
import { PromoButton } from '../buttons/PromoButton';
import { CloseButton } from '../navigation/CloseButton';
import { CodeCounter } from './CodeCounter';
import { box, centeredText, u } from '../../app/stage';
import './result-layout.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import destello from '../../assets/effects/destello.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';

export interface ResultLayoutProps {
  title: string;
  /** Tamaño del titular en px de diseño (Figma: 160 en GANASTE, 140 en PERDISTE). */
  titleSize?: number;
  message: ReactNode;
  messageSize?: number;
  /** Y del mensaje en coordenadas de diseño. */
  messageY?: number;
  /** Y del botón "Cargar otro código". */
  ctaY?: number;
  /** Escena de la derecha: cofre + premio, en coordenadas de diseño. */
  scene: ReactNode;
  code?: string;
  /** true → "CANJEASTE EL CÓDIGO"; false → "CÓDIGO INGRESADO" (no se consumió). */
  codeRedeemed?: boolean;
  codeCount: number;
  /** Versión mobile de la escena. */
  mobileScene: ReactNode;
  pageTitle: string;
}

const CONTACT_LINES = [
  '*GUARDÁ TUS STICKERS GANADORES PARA CANJEAR TU PREMIO*',
  '¡COMUNICATE AL +595 984 324 335 PARA RETIRARLO!',
];

/**
 * Estructura común de las cuatro pantallas de resultado
 * (23:3081 GANASTE, 23:3159 PERDISTE, 107:297 y 131:131).
 *
 * La navegación queda siempre plegada: el foco es el resultado.
 */
export function ResultLayout({
  title,
  titleSize = 160,
  message,
  messageSize = 60,
  messageY = 616,
  ctaY = 711,
  scene,
  code,
  codeRedeemed = true,
  codeCount,
  mobileScene,
  pageTitle,
}: ResultLayoutProps) {
  const navigate = useNavigate();
  const reload = () => navigate('/participar');

  const codeLabel = codeRedeemed ? 'CANJEASTE EL CÓDIGO' : 'CÓDIGO INGRESADO';

  const note = (
    <>
      {code && (
        <p className="result__note-code">
          {codeLabel}: <strong>{code}</strong>
        </p>
      )}
      {CONTACT_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );

  return (
    <Stage
      title={pageTitle}
      compactMenu
      mobile={
        <div className="m-stack" id="contenido">
          <img src={logoCodigos} alt="Códigos Secretos 2026" className="m-logo m-logo--sm" />
          <p className="m-title m-title--lg">{title}</p>
          <p className="m-sub">{message}</p>
          {mobileScene}
          <PromoButton fontSize={50} onClick={reload}>
            Cargar otro código
          </PromoButton>
          <CodeCounter count={codeCount} />
          <div className="m-note">{note}</div>
          <CloseButton to="/" />
        </div>
      }
    >
      {/* --- Universo --- */}
      <Deco src={destello} x={1} y={155} w={415} h={275} opacity={0.5}
        float={{ amplitude: 9, duration: 5.2 }} />
      <Deco src={destello} x={713} y={40} w={297} h={197}
        float={{ amplitude: 7, duration: 4.4, delay: 0.7 }} />
      <Deco src={destello} x={1554} y={438} w={385} h={255}
        float={{ amplitude: 10, duration: 6, delay: 1.3 }} />
      <Deco src={planetaVit1} x={842} y={-57} w={253} h={124} blur={5} opacity={0.9}
        float={{ amplitude: 5, duration: 6.6, drift: 4 }} />
      <Deco src={planetaVit2} x={1811} y={146} w={169} h={184} rotate={15.05} blur={5} opacity={0.8}
        float={{ amplitude: 6, duration: 7, delay: 0.9 }} />

      {/* Halo del nodo "Ellipse 1", detrás de la escena. */}
      <div className="result__halo abs" style={{ ...box({ x: 889, y: 794, w: 951, h: 911 }), zIndex: 1 }} />

      <Deco src={logoCodigos} x={299} y={202} w={329} h={245} zIndex={4}
        glow="0 0 2.4cqw #09eaff" float={{ amplitude: 6, duration: 5 }} />

      {/* --- Columna de texto --- */}
      <p className="t-display result__title abs" style={{ ...centeredText(479, 463, titleSize), zIndex: 6 }}>
        {title}
      </p>

      <p
        className="t-display t-white-glow result__message abs"
        style={{
          left: u(480),
          top: u(messageY),
          fontSize: u(messageSize),
          width: u(700),
          transform: 'translateX(-50%)',
          zIndex: 6,
        }}
      >
        {message}
      </p>

      <PromoButton
        id="contenido"
        className="abs"
        style={{ ...box({ x: 276, y: ctaY, w: 375, h: 125 }), zIndex: 7 }}
        fontSize={50}
        onClick={reload}
      >
        Cargar otro código
      </PromoButton>

      {/* --- Escena (cofre / premio) --- */}
      {scene}

      {/* --- Pie: aviso de stickers y contador --- */}
      <div className="result__note abs" style={{ ...box({ x: 144, y: 894, w: 640, h: 101 }), zIndex: 7 }}>
        {note}
      </div>

      <CodeCounter
        className="abs"
        count={codeCount}
        style={{ left: u(1168), top: u(940), zIndex: 7 }}
      />

      <CloseButton to="/" style={{ left: u(1737), top: u(34) }} />
    </Stage>
  );
}
