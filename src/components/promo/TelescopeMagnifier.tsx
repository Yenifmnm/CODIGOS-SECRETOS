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

/**
 * Catalejo-lupa sobre el pack.
 *
 * Desktop: el lente sigue al puntero. Touch: se arrastra con el dedo.
 * Teclado: flechas para desplazarlo. La ampliación se resuelve con
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
  const [dragging, setDragging] = useState(false);

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
    // En touch sólo se mueve mientras se arrastra; con mouse basta con pasar por encima.
    if (e.pointerType !== 'mouse' && !dragging) return;
    const p = fromEvent(e);
    schedule(p.x, p.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setVisible(true);
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = fromEvent(e);
    schedule(p.x, p.y);
  };

  const endDrag = (e: React.PointerEvent) => {
    setDragging(false);
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
