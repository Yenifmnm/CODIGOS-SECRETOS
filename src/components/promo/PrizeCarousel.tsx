import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { Prize } from '../../types/promo';
import flecha from '../../assets/ui/flecha-navegacion.webp';
import './prize-carousel.css';

interface PrizeCarouselProps {
  prizes: Prize[];
  onActiveChange?: (prize: Prize) => void;
  /**
   * Renderiza la tira de miniaturas bajo el carrusel. El Figma mobile la
   * incluye; el desktop no, así que es opcional y por defecto no se dibuja.
   * Vive acá dentro porque el índice activo es estado de este componente.
   */
  withThumbs?: boolean;
  /**
   * Nombre del premio activo, dibujado entre el carrusel y las miniaturas.
   * El Figma mobile lo ubica ahí; en desktop el nombre lo posiciona la pantalla
   * con sus propias coordenadas, así que esta prop queda sin usar.
   */
  caption?: string;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
}

/**
 * Posiciones de las cinco ranuras, leídas del Figma (57:86):
 * los cinco premios comparten el eje y=686 y varían en x y escala.
 */
const CENTER_X = 970;
const ITEM_W = 442; // ancho de la ranura activa (premio 1 1)

/** x en % del propio elemento: escala junto con el stage sin usar calc(). */
const slot = (x: number, scale: number, opacity: number, z: number) => ({
  x: `${+(((x - CENTER_X) / ITEM_W) * 100).toFixed(3)}%`,
  scale,
  opacity,
  z,
});

const SLOTS: Record<number, ReturnType<typeof slot>> = {
  [-2]: slot(348.5, 0.5, 0.5, 1),
  [-1]: slot(609.5, 0.55, 0.5, 2),
  [0]: slot(CENTER_X, 1, 1, 3),
  [1]: slot(1330.5, 0.55, 0.5, 2),
  [2]: slot(1581, 0.5, 0.5, 1),
};

const OFFSETS = [-2, -1, 0, 1, 2];

/** Distancia mínima de swipe, en px de pantalla. */
const SWIPE_THRESHOLD = 40;

/**
 * Carrusel de premios. Se opera con flechas, teclado (← →, Home, End),
 * click sobre un premio lateral y swipe táctil.
 */
export function PrizeCarousel({
  prizes,
  onActiveChange,
  withThumbs = false,
  caption,
  'data-figma': figma,
}: PrizeCarouselProps) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const touchStart = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const total = prizes.length;

  const go = useCallback(
    (delta: number) => {
      if (total === 0) return;
      setActive((i) => (i + delta + total * 10) % total);
    },
    [total],
  );

  useEffect(() => {
    if (prizes[active]) onActiveChange?.(prizes[active]);
  }, [active, prizes, onActiveChange]);

  /* Con el catálogo completo la tira de miniaturas no entra en el ancho del
     teléfono y pasa a ser un carril horizontal. Si no la acompañamos, al mover
     el carrusel la miniatura activa queda fuera de vista. */
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    const item = strip.children[active] as HTMLElement | undefined;
    if (!item) return;
    const target = item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2;
    strip.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' });
  }, [active, reduced]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(total - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (total === 0) return null;

  return (
    <div
      className="carousel"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Catálogo de premios"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      data-figma={figma}
    >
      <button type="button" className="carousel__arrow carousel__arrow--prev" onClick={() => go(-1)}>
        <span className="sr-only">Premio anterior</span>
        <img src={flecha} alt="" aria-hidden="true" />
      </button>

      <div className="carousel__track">
        {OFFSETS.map((offset) => {
          const index = (active + offset + total * 10) % total;
          const prize = prizes[index];
          const spot = SLOTS[offset];
          const isCenter = offset === 0;

          return (
            <motion.button
              key={`${prize.id}-${offset}`}
              type="button"
              className={`carousel__item${isCenter ? ' carousel__item--active' : ''}`}
              style={{ zIndex: spot.z }}
              aria-current={isCenter || undefined}
              aria-hidden={!isCenter}
              tabIndex={-1}
              onClick={() => !isCenter && go(offset)}
              initial={false}
              animate={{ x: spot.x, scale: spot.scale, opacity: spot.opacity }}
              transition={
                reduced
                  ? { duration: 0.001 }
                  : { type: 'spring', stiffness: 190, damping: 26, mass: 0.9 }
              }
            >
              <img src={prize.image} alt="" aria-hidden="true" />
            </motion.button>
          );
        })}
      </div>

      <button type="button" className="carousel__arrow carousel__arrow--next" onClick={() => go(1)}>
        <span className="sr-only">Premio siguiente</span>
        <img src={flecha} alt="" aria-hidden="true" />
      </button>

      <p className="sr-only" aria-live="polite">
        {prizes[active].name}
      </p>

      {caption !== undefined && <p className="carousel__caption">{caption}</p>}

      {/* Tira de miniaturas del Figma mobile: salto directo a cada premio. */}
      {withThumbs && (
        <ul className="carousel__thumbs" ref={thumbsRef}>
          {prizes.map((p, i) => (
            <li key={p.id ?? p.name}>
              <button
                type="button"
                className={`carousel__thumb${i === active ? ' carousel__thumb--active' : ''}`}
                aria-current={i === active || undefined}
                onClick={() => setActive(i)}
              >
                <span className="sr-only">{p.name}</span>
                <img src={p.thumb ?? p.image} alt="" aria-hidden="true" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
