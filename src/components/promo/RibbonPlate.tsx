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
}: RibbonPlateProps) {
  return (
    <div
      className={['plate', `plate--${tone}`, className].filter(Boolean).join(' ')}
      style={{ '--plate-notch': u(notch), ...style } as CSSProperties}
    >
      <span className="plate__bg" aria-hidden="true" />
      <span className="plate__content">{children}</span>
    </div>
  );
}
