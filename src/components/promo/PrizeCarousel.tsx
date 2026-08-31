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
  /**
   * Nodo del Figma de cada pieza, para `npm run figma:check`. El carrusel en sí
   * no es un nodo: en el frame las flechas, el premio, el rótulo y las fichas
   * cuelgan sueltos, así que se marca cada uno por separado.
   */
  nodos?: {
    flechaIzq?: string;
    flechaDer?: string;
    premio?: string;
    nombre?: string;
    miniActiva?: string;
    /** Ranuras vecinas de la tira, relativas a la activa. */
    miniIzq2?: string;
    miniIzq1?: string;
    miniDer1?: string;
  };
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
 * El frame dibuja cuatro fichas: dos a la izquierda de la activa, la activa y
 * una a la derecha. Se marcan por RANURA, no por premio: el diseño puso
 * imágenes sueltas (`premio 5`, `premio 4`, `premio 1`, `premio 2`) que no
 * siguen el orden del catálogo, así que lo comparable es la caja, no cuál
 * producto va adentro.
 */
function nodoDeRanura(nodos: PrizeCarouselProps['nodos'], offset: number) {
  if (!nodos) return undefined;
  if (offset === 0) return nodos.miniActiva;
  if (offset === -1) return nodos.miniIzq1;
  if (offset === -2) return nodos.miniIzq2;
  if (offset === 1) return nodos.miniDer1;
  return undefined;
}

/**
 * Carrusel de premios. Se opera con flechas, teclado (← →, Home, End),
 * click sobre un premio lateral y swipe táctil.
 */
export function PrizeCarousel({
  prizes,
  onActiveChange,
  withThumbs = false,
  caption,
  nodos,
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
    >
      <button
        type="button"
        className="carousel__arrow carousel__arrow--prev"
        onClick={() => go(-1)}
      >
        <span className="sr-only">Premio anterior</span>
        <img src={flecha} alt="" aria-hidden="true" data-figma={nodos?.flechaIzq} />
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
              data-figma={isCenter ? nodos?.premio : undefined}
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

      <button
        type="button"
        className="carousel__arrow carousel__arrow--next"
        onClick={() => go(1)}
      >
        <span className="sr-only">Premio siguiente</span>
        <img src={flecha} alt="" aria-hidden="true" data-figma={nodos?.flechaDer} />
      </button>

      <p className="sr-only" aria-live="polite">
        {prizes[active].name}
      </p>

      {caption !== undefined && (
        /* El rotulo es el nombre del premio, que sale del catalogo: el parrafo
           se achica a su contenido, asi que su caja ES la tinta y el ancho lo
           decide el nombre, no el CSS. Por eso solo deciden el alto y la y.

           `omitir="sombras"`: el resplandor blanco va al 20% y el nodo lo
           declara al 100%. NO es un desvio a corregir: es la reduccion pedida
           por la clienta el 27-08-2026, replicada desde HOME por consistencia y
           anotada al lado del valor en el CSS. Mientras este, el control no
           avisa si alguien toca esas sombras por error.

           Ojo con el formato: aca estamos DENTRO de una expresion JS y no entre
           hijos de JSX, asi que el comentario va con la sintaxis de JS y no
           envuelto en llaves. Y no puede contener la secuencia que cierra un
           comentario de bloque, porque lo termina antes de tiempo. */
        <p
          className="carousel__caption"
          data-figma={nodos?.nombre}
          data-figma-ejes="y,h"
          data-figma-omitir="sombras"
        >
          {caption}
        </p>
      )}

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
                data-figma={nodoDeRanura(nodos, i - active)}
                /* La x de cada ficha es la posicion del carril, que depende de
                   cual premio este activo y de cuanto se haya desplazado; el
                   frame ademas dibuja una instantanea a mitad del catalogo. Lo
                   comparable es la caja, no donde cayo el scroll. */
                data-figma-ejes="y,w,h"
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
