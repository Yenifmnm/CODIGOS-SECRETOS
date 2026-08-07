import { useState, type CSSProperties } from 'react';
import { useIsTouch } from '../../hooks/useIsTouch';
import { MOCK_CHEST_PREVIEW } from '../../mocks/prizes';
import cofreCerrado from '../../assets/promo/cofre-cerrado.webp';
import cofreAbierto from '../../assets/promo/cofre-abierto.webp';
import './treasure-chest.css';

interface TreasureChestProps {
  /** 'idle' respira cerrado; 'interactive' se abre al hover/tap; 'open' ya abierto. */
  mode?: 'idle' | 'interactive' | 'open';
  style?: CSSProperties;
  className?: string;
}

/**
 * Cofre del tesoro.
 *
 * - `interactive` (Home): al pasar el cursor —o tocar, en dispositivos táctiles—
 *   el cofre se abre y asoman algunos premios. Es SÓLO una animación de preview:
 *   los premios salen de un array mock y no representan ningún sorteo.
 * - `idle` (Perdiste / código inválido): permanece cerrado con un balanceo y
 *   una respiración muy sutiles.
 * - `open` (Ganaste): la apertura la orquesta <PrizeReveal>.
 */
export function TreasureChest({ mode = 'idle', style, className }: TreasureChestProps) {
  const isTouch = useIsTouch();
  const [open, setOpen] = useState(mode === 'open');
  const interactive = mode === 'interactive';
  const isOpen = mode === 'open' || (interactive && open);

  const hoverProps =
    interactive && !isTouch
      ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
      : {};

  const content = (
    <>
      <img
        src={isOpen ? cofreAbierto : cofreCerrado}
        alt=""
        aria-hidden="true"
        className="chest__img"
      />
      {interactive && (
        <div className="chest__prizes" aria-hidden="true">
          {MOCK_CHEST_PREVIEW.map((p, i) => (
            <img
              key={p.id}
              src={p.image}
              alt=""
              className={`chest__prize chest__prize--${i + 1}`}
              data-visible={isOpen ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </>
  );

  const classes = [
    'chest',
    `chest--${mode}`,
    isOpen ? 'chest--is-open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!interactive) {
    return (
      <div className={classes} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={style}
      aria-pressed={open}
      onClick={() => setOpen((v) => !v)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...hoverProps}
    >
      <span className="sr-only">
        {open ? 'Cerrar el cofre del tesoro' : 'Abrir el cofre y espiar algunos premios'}
      </span>
      {content}
    </button>
  );
}
