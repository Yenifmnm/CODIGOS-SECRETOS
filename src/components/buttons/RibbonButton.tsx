import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { mu } from '../../app/mobileStage';
import { RibbonSvg } from '../promo/RibbonSvg';
import './ribbon-button.css';

interface RibbonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fontSize?: number;
  width?: number;
  height?: number;
  tone?: 'gold' | 'ghost' | 'ochre';
  /** Medidas en px del lienzo mobile (402). Sólo aplican bajo 900px. */
  mobileFontSize?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  style?: CSSProperties;
  /**
   * Nodo del Figma del RÓTULO. La cinta y su texto son dos capas distintas en
   * el diseño; el nodo de la cinta va en `data-figma`, que viaja en `...rest`.
   */
  'data-figma-label'?: string;
  /**
   * El SVG de la silueta de ESTE nodo, de `assets/ui/cintas/`.
   *
   * Con él, la cinta se dibuja con el vector del diseño y el botón deja de
   * recortarse con el `clip-path` genérico. Sin él, el comportamiento de
   * siempre, que es el que sigue usando la rama de escritorio.
   */
  silueta?: string;
  /** Nodo del Figma de la CINTA, cuando se pasa `silueta`. */
  'data-figma-cinta'?: string;
}

const U = 19.2;
const cq = (px: number) => `${+(px / U).toFixed(4)}cqw`;

/**
 * Cinta del pergamino (nodos 22:3072 / 18:2977 del Figma): usada en
 * "Bases y Condiciones", "Acepto la misión", "Registrarme" y "Cancelar".
 *
 * En escritorio la silueta se recorta con un `clip-path` genérico. En mobile no
 * alcanza: cada cinta del diseño es un vector propio, con sus muescas, así que
 * se le pasa `silueta` con el SVG de su nodo. Ver `promo/RibbonSvg.tsx`.
 */
export function RibbonButton({
  children,
  fontSize = 40,
  width = 328,
  height = 58,
  tone = 'gold',
  mobileFontSize,
  mobileWidth,
  mobileHeight,
  className,
  style,
  'data-figma-label': figmaLabel,
  silueta,
  'data-figma-cinta': figmaCinta,
  ...rest
}: RibbonButtonProps) {
  return (
    <button
      type="button"
      className={['ribbon-btn', `ribbon-btn--${tone}`, silueta ? 'ribbon-btn--svg' : null, className]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: cq(width),
        height: cq(height),
        '--ribbon-fs': cq(fontSize),
        ...(mobileFontSize !== undefined ? { '--ribbon-fs-m': mu(mobileFontSize) } : null),
        ...(mobileWidth !== undefined ? { '--ribbon-w-m': mu(mobileWidth) } : null),
        ...(mobileHeight !== undefined ? { '--ribbon-h-m': mu(mobileHeight) } : null),
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {silueta && figmaCinta && <RibbonSvg src={silueta} nodo={figmaCinta} />}
      <span className="ribbon-btn__label" data-figma={figmaLabel}>
        {children}
      </span>
    </button>
  );
}
