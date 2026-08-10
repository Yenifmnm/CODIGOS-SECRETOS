import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import botonSecundario from '../../assets/ui/boton-secundario.webp';
import botonCarga from '../../assets/ui/boton-carga.webp';
import { mu } from '../../app/mobileStage';
import './promo-button.css';

/**
 * Las dos superficies del sistema. `secundario` es la cinta rasgada del
 * desktop; `carga` es el tablón con postes y soga que el Figma mobile usa en el
 * CTA del landing. Ambas comparten proporción 3:1, así que la caja no cambia.
 */
const PLATES = { secundario: botonSecundario, carga: botonCarga } as const;

export type PromoPlate = keyof typeof PLATES;

interface PromoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tamaño de la tipografía en px de diseño (Figma). */
  fontSize?: number;
  /** Ancho/alto en px de diseño; si se omite, hereda del contenedor. */
  width?: number;
  height?: number;
  loading?: boolean;
  /** Superficie del botón. Por defecto la del desktop. */
  plate?: PromoPlate;
  /** Tipografía en px del lienzo mobile (402). Sólo aplica bajo 900px. */
  mobileFontSize?: number;
  style?: CSSProperties;
}

const U = 19.2;
const cq = (px: number) => `${+(px / U).toFixed(4)}cqw`;

/**
 * Botón principal del sistema: el estandarte de pergamino del Figma
 * ("boton secundario", nodos 72:446 / 23:3128). El asset original es la
 * superficie; el texto es HTML real y accesible encima.
 */
export const PromoButton = forwardRef<HTMLButtonElement, PromoButtonProps>(function PromoButton(
  {
    children,
    fontSize = 50,
    width,
    height,
    loading = false,
    plate = 'secundario',
    mobileFontSize,
    style,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={['promo-btn', loading ? 'promo-btn--loading' : '', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{
        ...(width !== undefined ? { width: cq(width) } : null),
        ...(height !== undefined ? { height: cq(height) } : null),
        '--promo-btn-fs': cq(fontSize),
        ...(mobileFontSize !== undefined ? { '--promo-btn-fs-m': mu(mobileFontSize) } : null),
        ...style,
      } as CSSProperties}
      {...rest}
    >
      <img src={PLATES[plate]} alt="" aria-hidden="true" className="promo-btn__plate" />
      <span className="promo-btn__label">{children}</span>
      {loading && <span className="promo-btn__spinner" aria-hidden="true" />}
    </button>
  );
});
