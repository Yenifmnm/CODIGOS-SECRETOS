import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import './parchment-field.css';

interface ParchmentFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
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
      >
        {/* El nombre del campo se retira apenas hay algo escrito: en la cápsula
            competía por el ancho con el valor y lo empujaba fuera de vista.
            Sigue en el DOM y asociado al input, así que el lector de pantalla
            lo anuncia igual; sólo deja de verse. */}
        <label
          className="pfield__label"
          htmlFor={inputId}
          data-figma={figma}
          data-figma-ejes={figmaEjes}
        >
          {icon && (
            <span className="pfield__icon" aria-hidden="true">
              {icon}
            </span>
          )}
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

/** Icono de cédula del Figma (72:455). */
export const IconId = (
  <svg viewBox="0 0 52 35" aria-hidden="true" focusable="false">
    <rect x="1.5" y="1.5" width="49" height="32" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
    <circle cx="16" cy="14" r="5" fill="currentColor" />
    <path d="M7 27c1.6-4.4 5-6.6 9-6.6s7.4 2.2 9 6.6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M31 12h14M31 20h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/** Icono de código secreto del Figma (72:451). */
export const IconCode = (
  <svg viewBox="0 0 30 40" aria-hidden="true" focusable="false">
    <path
      d="M15 2 18.6 9.4 26.8 10.6 20.9 16.3 22.3 24.4 15 20.6 7.7 24.4 9.1 16.3 3.2 10.6 11.4 9.4Z"
      fill="currentColor"
    />
    <path d="M15 26v12M11 31h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);
