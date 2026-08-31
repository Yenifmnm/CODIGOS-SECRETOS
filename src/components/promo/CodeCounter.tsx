import type { CSSProperties } from 'react';
import contadorPlate from '../../assets/ui/contador.webp';
import './code-counter.css';

interface CodeCounterProps {
  count: number;
  /** Cantidad de dígitos del marcador (Figma muestra 4). */
  digits?: number;
  label?: string;
  style?: CSSProperties;
  className?: string;
  /**
   * Nodo del Figma de la PLACA. El rótulo de abajo es una capa aparte en el
   * diseño y lleva su propia marca.
   */
  'data-figma'?: string;
  /** Nodo del Figma del rótulo («Códigos cargados»). */
  'data-figma-label'?: string;
  /** Controles que `figma:check` no debe aplicar al rótulo. */
  'data-figma-label-omitir'?: string;
}

/**
 * Contador de códigos cargados (nodo 63:110 del Figma).
 * La cifra es texto HTML real sobre el marcador, nunca parte de la imagen:
 * así puede venir del backend y ser leída por lectores de pantalla.
 */
export function CodeCounter({
  count,
  digits = 4,
  label = 'Códigos cargados',
  style,
  className,
  'data-figma': figma,
  'data-figma-label': figmaLabel,
  'data-figma-label-omitir': figmaLabelOmitir,
}: CodeCounterProps) {
  const padded = String(Math.max(0, Math.trunc(count))).padStart(digits, '0').slice(-digits);

  return (
    <div
      className={['code-counter', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="code-counter__plate" data-figma={figma}>
        <img src={contadorPlate} alt="" aria-hidden="true" />
        <output className="code-counter__value" aria-label={`${count} ${label}`}>
          {padded.split('').map((d, i) => (
            <span key={i} className="code-counter__digit" aria-hidden="true">
              {d}
            </span>
          ))}
        </output>
      </div>
      <span
        className="code-counter__label"
        aria-hidden="true"
        data-figma={figmaLabel}
        data-figma-omitir={figmaLabelOmitir}
      >
        {label}
      </span>
    </div>
  );
}
