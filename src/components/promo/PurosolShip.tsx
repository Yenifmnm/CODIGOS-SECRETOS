import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import barcoDefault from '../../assets/promo/barco.webp';
import './purosol-ship.css';

interface PurosolShipProps {
  /** Recurso alternativo para una exportación puntual de Figma. */
  src?: string;
  /** `enter` navega desde la derecha hacia su posición y luego queda flotando. */
  variant?: 'enter' | 'idle';
  flipped?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
  /** Ejes o controles que `figma:check` no debe aplicar a esta capa. */
  'data-figma-omitir'?: string;
  /** Prioridad de descarga. La landing la baja: la nave es decoración. */
  prioridad?: 'high' | 'low';
}

/**
 * Nave pirata. Según el PPT entra navegando desde el borde derecho hacia la
 * izquierda; terminado el recorrido queda en flotación idle muy sutil, sin
 * repetir el trayecto completo.
 */
export function PurosolShip({
  src = barcoDefault,
  variant = 'idle',
  flipped = false,
  style,
  className,
  'data-figma': figma,
  'data-figma-omitir': figmaOmitir,
  prioridad,
}: PurosolShipProps) {
  const reduced = useReducedMotion();
  const animate = variant === 'enter' && !reduced;

  return (
    <div
      className={['ship', animate ? 'ship--enter' : 'ship--idle', className].filter(Boolean).join(' ')}
      style={style}
      data-figma={figma}
      data-figma-omitir={figmaOmitir}
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        className="ship__img"
        fetchPriority={prioridad}
        style={flipped ? { transform: 'scaleX(-1)' } : undefined}
      />
    </div>
  );
}
