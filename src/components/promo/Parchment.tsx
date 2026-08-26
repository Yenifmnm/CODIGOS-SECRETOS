import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import pergamino1 from '../../assets/ui/pergamino-1.webp';
import './parchment.css';

interface ParchmentProps {
  children: ReactNode;
  /** Retardo antes de empezar a desplegar, en ms. */
  delay?: number;
  style?: CSSProperties;
  className?: string;
  onOpened?: () => void;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
}

/**
 * Pergamino que se despliega al entrar (nodo 22:3023).
 *
 * Secuencia: rollo cerrado → despliegue vertical → aparece el contenido.
 * Con `prefers-reduced-motion` aparece directamente abierto, con un fundido.
 */
export function Parchment({
  children,
  delay = 180,
  style,
  className,
  onOpened,
  'data-figma': figma,
}: ParchmentProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'rolled' | 'unfurling' | 'open'>(
    reduced ? 'open' : 'rolled',
  );

  // Ref para que un callback inline no reinicie la secuencia en cada render.
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;

  useEffect(() => {
    if (reduced) {
      setPhase('open');
      onOpenedRef.current?.();
      return;
    }

    const t1 = window.setTimeout(() => setPhase('unfurling'), delay);
    const t2 = window.setTimeout(() => {
      setPhase('open');
      onOpenedRef.current?.();
    }, delay + 760);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [delay, reduced]);

  return (
    <div
      className={['parchment', `parchment--${phase}`, className].filter(Boolean).join(' ')}
      style={style}
      data-figma={figma}
    >
      <div className="parchment__sheet">
        <img src={pergamino1} alt="" aria-hidden="true" className="parchment__img" />
      </div>
      <div className="parchment__content">{children}</div>
    </div>
  );
}
