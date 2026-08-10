import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { mu } from '../../app/mobileStage';
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
}

const U = 19.2;
const cq = (px: number) => `${+(px / U).toFixed(4)}cqw`;

/**
 * Cinta del pergamino (nodos 22:3072 / 18:2977 del Figma): usada en
 * "Bases y Condiciones", "Acepto la misión", "Registrarme" y "Cancelar".
 * La silueta de estandarte se recorta con clip-path, sin imagen extra.
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
  ...rest
}: RibbonButtonProps) {
  return (
    <button
      type="button"
      className={['ribbon-btn', `ribbon-btn--${tone}`, className].filter(Boolean).join(' ')}
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
      <span className="ribbon-btn__label">{children}</span>
    </button>
  );
}
