import type { CSSProperties, ReactNode } from 'react';
import { u } from '../../app/stage';
import { RibbonSvg } from './RibbonSvg';
import './ribbon-plate.css';

interface RibbonPlateProps {
  /** `ochre` = titulares y botones; `sand` = campos del formulario. */
  tone?: 'ochre' | 'sand';
  /** Profundidad de la muesca lateral, en px de diseño. */
  notch?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
  /**
   * El SVG de la silueta de ESTE nodo, de `assets/ui/cintas/`.
   *
   * Con él, la cinta se dibuja con el vector del diseño. Sin él, cae al
   * `clip-path` genérico de seis puntos, que es lo que sigue usando la rama de
   * escritorio. Las doce cintas mobile lo pasan.
   */
  silueta?: string;
}

/**
 * Cinta de fondo del pergamino de REGISTRO (18:2951 / 18:2977).
 *
 * El recorte va en una capa aparte y no en el contenedor: si se recortara el
 * contenedor, el mensaje de error del campo —que cuelga por debajo— quedaría
 * cortado.
 */
export function RibbonPlate({
  tone = 'sand',
  notch = 18,
  className,
  style,
  children,
  silueta,
  'data-figma': figma,
}: RibbonPlateProps) {
  return (
    <div
      className={['plate', `plate--${tone}`, className].filter(Boolean).join(' ')}
      style={{ '--plate-notch': u(notch), ...style } as CSSProperties}
    >
      {/* La marca va en la capa que pinta, no en el contenedor: las dos tienen
          la misma caja —`inset: 0`— y son las que llevan el color, así que el
          control puede verificarlo.

          Con `silueta`, el dibujo es el vector del nodo. Sin ella, el
          `clip-path` genérico de `.plate__bg`, que es lo que sigue usando la
          rama de escritorio. */}
      {silueta && figma ? (
        <RibbonSvg src={silueta} nodo={figma} />
      ) : (
        <span className="plate__bg" aria-hidden="true" data-figma={figma} />
      )}
      <span className="plate__content">{children}</span>
    </div>
  );
}
