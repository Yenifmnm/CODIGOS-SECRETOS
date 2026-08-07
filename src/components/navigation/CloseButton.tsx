import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';
import './close-button.css';

interface CloseButtonProps {
  /** Destino al cerrar. Por defecto vuelve a la pantalla anterior. */
  to?: string;
  label?: string;
  style?: CSSProperties;
  className?: string;
}

/** Botón cerrar del Figma (23:3148): aro cian con cruz, 105x105. */
export function CloseButton({ to, label = 'Cerrar', style, className }: CloseButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={['close-btn', className].filter(Boolean).join(' ')}
      style={style}
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 105 105" aria-hidden="true" focusable="false">
        <circle cx="52.5" cy="52.5" r="47" className="close-btn__ring-outer" />
        <circle cx="52.5" cy="52.5" r="38" className="close-btn__ring-inner" />
        <g className="close-btn__cross">
          <rect x="34" y="49.5" width="37" height="6" rx="3" transform="rotate(45 52.5 52.5)" />
          <rect x="34" y="49.5" width="37" height="6" rx="3" transform="rotate(-45 52.5 52.5)" />
        </g>
      </svg>
    </button>
  );
}
