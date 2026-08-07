import type { CSSProperties } from 'react';
import { box, type BoxSpec } from '../../app/stage';
import { FloatingLayer } from '../effects/FloatingLayer';

interface DecoProps extends BoxSpec {
  src: string;
  /** Parámetros de flotación; omitirlos deja el elemento quieto. */
  float?: { amplitude?: number; duration?: number; delay?: number; drift?: number; rotate?: number };
  opacity?: number;
  blur?: number;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  glow?: string;
  zIndex?: number;
  style?: CSSProperties;
}

/**
 * Imagen decorativa posicionada con las coordenadas del Figma.
 * Siempre `aria-hidden` y sin eventos de puntero.
 */
export function Deco({
  src,
  float,
  opacity,
  blur,
  rotate = 0,
  flipX = false,
  flipY = false,
  glow,
  zIndex,
  style,
  ...spec
}: DecoProps) {
  const transforms = [
    rotate ? `rotate(${rotate}deg)` : '',
    flipX ? 'scaleX(-1)' : '',
    flipY ? 'scaleY(-1)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const img = (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="deco"
      style={{
        opacity,
        filter: [blur ? `blur(${blur}px)` : '', glow ? `drop-shadow(${glow})` : '']
          .filter(Boolean)
          .join(' ') || undefined,
        transform: transforms || undefined,
      }}
    />
  );

  return (
    <div className="abs" style={{ ...box(spec), zIndex, pointerEvents: 'none', ...style }}>
      {float ? <FloatingLayer {...float}>{img}</FloatingLayer> : img}
    </div>
  );
}
