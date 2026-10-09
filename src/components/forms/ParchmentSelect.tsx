import { useId, type CSSProperties, type SelectHTMLAttributes } from 'react';
import './parchment-field.css';
import './parchment-select.css';

interface ParchmentSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'children' | 'size'> {
  label: string;
  options: readonly string[];
  error?: string;
  fontSize?: number;
  'data-figma'?: string;
  'data-figma-ejes'?: string;
}

/** Selector nativo: teclado en escritorio y selector del sistema en móviles. */
export function ParchmentSelect({
  label, options, error, fontSize = 30, id, className,
  'data-figma': figma, 'data-figma-ejes': figmaEjes, ...rest
}: ParchmentSelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div
      className={['pfield', 'pfield--line', 'pfield--select',
        error ? 'pfield--invalid' : '', rest.value ? '' : 'pfield--empty', className]
        .filter(Boolean).join(' ')}
      style={{ '--pfield-fs': `${+(fontSize / 19.2).toFixed(4)}cqw` } as CSSProperties}
    >
      <label className="pfield__label" htmlFor={selectId} data-figma={figma} data-figma-ejes={figmaEjes}>
        <span className="pfield__label-text">{label}</span>
      </label>
      <select
        {...rest}
        id={selectId}
        className="pfield__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        <option value="" disabled>Seleccioná un departamento</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p className="pfield__error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}
