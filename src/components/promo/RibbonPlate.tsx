import type { CSSProperties, ReactNode } from 'react';
import { u } from '../../app/stage';
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
  'data-figma': figma,
}: RibbonPlateProps) {
  return (
    <div
      className={['plate', `plate--${tone}`, className].filter(Boolean).join(' ')}
      style={{ '--plate-notch': u(notch), ...style } as CSSProperties}
    >
      {/* La marca va en la capa que pinta, no en el contenedor: `.plate__bg`
          tiene la misma caja —`inset: 0`— y es la que lleva el color, así que
          el control de pintura puede verificarlo. */}
      <span className="plate__bg" aria-hidden="true" data-figma={figma} />
      <span className="plate__content">{children}</span>
    </div>
  );
}
