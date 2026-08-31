import { useCallback, useEffect, useRef, useState } from 'react';
import './telescope-magnifier.css';

interface TelescopeMagnifierProps {
  src: string;
  alt: string;
  /** Factor de ampliación dentro del lente. */
  zoom?: number;
  /** Diámetro del lente como % del ancho del contenedor. */
  lensRatio?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Texto alternativo del contenido ampliado, para quien no use el catalejo. */
  description?: string;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
}

const KEY_STEP = 0.06; // 6% del contenedor por pulsación

/* Cuánto tiene que moverse el dedo antes de decidir si el gesto es arrastre del
   catalejo o scroll de la página. Por debajo de esto no se captura nada: es la
   distancia con la que el navegador decide lo mismo para su propio paneo. */
const UMBRAL_GESTO = 8; // px

/**
 * Catalejo-lupa sobre el pack.
 *
 * Desktop: el lente sigue al puntero. Touch: se toca para posarlo y se arrastra
 * en horizontal para moverlo — el arrastre vertical es de la página, que si no
 * se queda sin scroll (ver `touch-action` en el CSS). Teclado: flechas para
 * desplazarlo. La ampliación se resuelve con
 * `background-position` sobre una máscara circular y se actualiza dentro de un
 * requestAnimationFrame — un solo listener, sin librerías.
 *
 * La lupa es una ayuda, no la única vía: el mismo contenido está descrito en
 * texto debajo.
 */
export function TelescopeMagnifier({
  src,
  alt,
  zoom = 2.2,
  lensRatio = 0.42,
  className,
  style,
  description,
  'data-figma': figma,
}: TelescopeMagnifierProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pending = useRef<{ x: number; y: number } | null>(null);
  // Posición normalizada 0..1 dentro del contenedor.
  const pos = useRef({ x: 0.5, y: 0.42 });
  const [visible, setVisible] = useState(false);
  /* El gesto de dedo en curso, mientras todavía no se sabe de quién es. Va en
     un ref y no en estado: se lee dentro del mismo `pointermove` que lo
     escribe, y un `useState` ahí daría el valor del render anterior. */
  const gesto = useRef<{ id: number; x0: number; y0: number; mio: boolean } | null>(null);

  const paint = useCallback(() => {
    frame.current = 0;
    const container = containerRef.current;
    const lens = lensRef.current;
    if (!container || !lens) return;

    if (pending.current) {
      pos.current = pending.current;
      pending.current = null;
    }

    const w = container.clientWidth;
    const h = container.clientHeight;
    const lensSize = w * lensRatio;
    const cx = pos.current.x * w;
    const cy = pos.current.y * h;

    lens.style.width = `${lensSize}px`;
    lens.style.height = `${lensSize}px`;
    lens.style.transform = `translate3d(${cx - lensSize / 2}px, ${cy - lensSize / 2}px, 0)`;
    lens.style.backgroundSize = `${w * zoom}px ${h * zoom}px`;
    // El punto bajo el puntero queda exactamente en el centro del lente.
    lens.style.backgroundPosition = `${-(cx * zoom - lensSize / 2)}px ${-(cy * zoom - lensSize / 2)}px`;
  }, [lensRatio, zoom]);

  const schedule = useCallback(
    (x: number, y: number) => {
      pending.current = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    },
    [paint],
  );

  useEffect(() => {
    paint();
    const onResize = () => schedule(pos.current.x, pos.current.y);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [paint, schedule]);

  const fromEvent = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    // Con mouse basta con pasar por encima; no hay gesto que disputar.
    if (e.pointerType === 'mouse') {
      const p = fromEvent(e);
      schedule(p.x, p.y);
      return;
    }

    const g = gesto.current;
    if (!g || g.id !== e.pointerId) return;

    if (!g.mio) {
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;
      if (Math.abs(dx) < UMBRAL_GESTO && Math.abs(dy) < UMBRAL_GESTO) return; // todavía no se sabe
      if (Math.abs(dy) >= Math.abs(dx)) {
        /* Predomina lo vertical: es scroll. Se suelta el gesto y no se vuelve a
           mirar hasta el próximo `pointerdown`. El empate cae de este lado a
           propósito: perder un arrastre se nota menos que perder el scroll. */
        gesto.current = null;
        return;
      }
      /* Predomina lo horizontal: el gesto es nuestro. Recién ACÁ se captura.
         Capturar en `pointerdown`, como estaba, se quedaba con el dedo antes de
         saber para qué venía, y dejaba la página sin scroll aunque el CSS lo
         permitiera. Desde este punto el navegador ya descartó su propio paneo,
         así que el lente vuelve a moverse en los dos ejes. */
      g.mio = true;
      setVisible(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    const p = fromEvent(e);
    schedule(p.x, p.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setVisible(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const p = fromEvent(e);
      schedule(p.x, p.y);
      return;
    }
    // Con el dedo sólo se anota de dónde salió. Decide `onPointerMove`.
    gesto.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, mio: false };
  };

  const endDrag = (e: React.PointerEvent) => {
    const g = gesto.current;
    /* Un toque que terminó sin llegar al umbral no es scroll ni arrastre: es un
       toque, y pone el catalejo donde tocó. Antes lo hacía `pointerdown`; ahora
       ahí no se sabe todavía si el dedo se va a quedar. `pointercancel` —el
       aviso de que el navegador se llevó el gesto para scrollear— no entra. */
    if (e.type === 'pointerup' && g && g.id === e.pointerId && !g.mio) {
      setVisible(true);
      const p = fromEvent(e);
      schedule(p.x, p.y);
    }
    gesto.current = null;
    if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const delta = map[e.key];
    if (!delta) return;
    e.preventDefault();
    setVisible(true);
    schedule(pos.current.x + delta[0], pos.current.y + delta[1]);
  };

  return (
    <div
      className={['telescope', className].filter(Boolean).join(' ')}
      style={style}
      data-figma={figma}
    >
      <div
        ref={containerRef}
        className={`telescope__viewport${visible ? ' telescope__viewport--active' : ''}`}
        role="img"
        aria-label={alt}
        tabIndex={0}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setVisible(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setVisible(false)}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onKeyDown={onKeyDown}
      >
        <img src={src} alt="" aria-hidden="true" className="telescope__base" />
        <div
          ref={lensRef}
          className="telescope__lens"
          aria-hidden="true"
          style={{ backgroundImage: `url(${src})` }}
        >
          <span className="telescope__rim" />
        </div>
      </div>

      <p className="telescope__hint">
        Movés el catalejo con el mouse, el dedo o las flechas del teclado.
      </p>
      {description && <p className="sr-only">{description}</p>}
    </div>
  );
}
