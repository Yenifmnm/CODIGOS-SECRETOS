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
      /* CON SILUETA NO SE EMITE LA CLASE DE TONO, y ésa es toda la corrección.

         `ribbon-btn--gold` / `--ochre` / `--ghost` no hacen otra cosa que
         pintar el fondo: un degradado más un `box-shadow` interior. Con la
         silueta del nodo, el dibujo Y el color vienen dentro del SVG, así que
         no hay tono que aplicar — y ese fondo, si se emite, lo tapa entero.

         Intentar ganarle desde `.ribbon-btn--svg { background: none }` no
         funciona y no puede funcionar: tienen la misma especificidad (0,1,0) y
         las de tono están declaradas después en la hoja, así que ganan por
         orden. Subirle la especificidad sería una carrera contra cualquier
         override futuro. No emitir la clase deja la carrera sin contrincante.

         Además saca el `box-shadow: inset 0 -3px 0`, que sobre una silueta
         rasgada dibujaba una barra recta en el pie del botón. */
      className={['ribbon-btn', silueta ? 'ribbon-btn--svg' : `ribbon-btn--${tone}`, className]
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
