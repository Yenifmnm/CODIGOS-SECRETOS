import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import './parchment-field.css';

import iconoCedula from '../../assets/ui/icono-cedula.svg';
import iconoCandado from '../../assets/ui/icono-candado.svg';

interface ParchmentFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** URL del ícono. La marca del nodo va en el `<img>`, que es lo que mide. */
  icon?: string;
  error?: string;
  /** Tamaño de fuente en px de diseño. */
  fontSize?: number;
  /** `pill` = cápsula del formulario de participación (72:447).
   *  `line` = campo subrayado del pergamino de registro (18:2951). */
  variant?: 'pill' | 'line';
  /**
   * Nodo del Figma del RÓTULO, no del campo entero: la caja del campo ya la
   * mide la cinta que lo envuelve. Ver `docs/FIGMA-WORKFLOW.md`.
   */
  'data-figma'?: string;
  /** Ejes que decide `figma:check` para ese nodo. */
  'data-figma-ejes'?: string;
  /** Nodo del Figma del ÍCONO, que es una capa aparte del rótulo. */
  'data-figma-icono'?: string;
  /**
   * Nodo del Figma de la CÁPSULA. En el frame de participar el campo son tres
   * capas sueltas —el `Rectangle` de fondo, el rótulo y el ícono—, así que cada
   * una lleva la suya. En registro no hay cápsula y esta prop no se usa.
   */
  'data-figma-caja'?: string;
}

/**
 * Campo de formulario sobre pergamino.
 * El `label` es un <label> real asociado al input: nunca un placeholder solo.
 */
export const ParchmentField = forwardRef<HTMLInputElement, ParchmentFieldProps>(
  function ParchmentField(
    {
      label,
      icon,
      error,
      fontSize = 35,
      variant = 'pill',
      className,
      id,
      'data-figma': figma,
      'data-figma-ejes': figmaEjes,
      'data-figma-icono': figmaIcono,
      'data-figma-caja': figmaCaja,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;

    return (
      <div
        className={[
          'pfield',
          `pfield--${variant}`,
          error ? 'pfield--invalid' : '',
          rest.value ? '' : 'pfield--empty',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--pfield-fs': `${+(fontSize / 19.2).toFixed(4)}cqw` } as React.CSSProperties}
        data-figma={figmaCaja}
      >
        {/* El nombre del campo se retira apenas hay algo escrito: en la cápsula
            competía por el ancho con el valor y lo empujaba fuera de vista.
            Sigue en el DOM y asociado al input, así que el lector de pantalla
            lo anuncia igual; sólo deja de verse. */}
        {/* El ícono va FUERA del rótulo: en el frame son dos capas hermanas
            —el ícono en x 71/74 y el texto en x 100— y si viviera adentro, la
            caja del `<label>` arrancaría en el ícono y no en el texto, que es
            lo que mide el nodo. Es `aria-hidden`, así que no pierde nada por
            no estar dentro del `<label>`. */}
        {icon && (
          <span className="pfield__icon" aria-hidden="true">
            <img src={icon} alt="" data-figma={figmaIcono} />
          </span>
        )}
        <label
          className="pfield__label"
          htmlFor={inputId}
          data-figma={figma}
          data-figma-ejes={figmaEjes}
        >
          <span className="pfield__label-text">{label}</span>
        </label>
        <input
          ref={ref}
          id={inputId}
          className="pfield__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {error && (
          <p className="pfield__error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

/** Cédula del Figma — nodo `70:370`, 21x14. Bajado con
    `npm run figma:pull -- --export 70:370`, no redibujado. */
export const IconId = iconoCedula;

/** Candado del campo de código secreto — nodo `70:366`, 12x16. */
export const IconCode = iconoCandado;
