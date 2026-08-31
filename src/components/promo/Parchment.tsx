import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import pergaminoDefault from '../../assets/ui/pergamino-1.webp';
import './parchment.css';

interface ParchmentProps {
  children: ReactNode;
  /** Exportación alternativa para una composición puntual de Figma. */
  src?: string;
  /** Retardo antes de empezar a desplegar, en ms. */
  delay?: number;
  style?: CSSProperties;
  className?: string;
  onOpened?: () => void;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
  /**
   * Nodo del Figma de la IMAGEN del pergamino. Va aparte porque en mobile el
   * papel está girado -90° y el giro tiene que vivir en el elemento marcado
   * para que el control verifique también el ancho y el alto.
   */
  imgFigma?: string;
}

/**
 * Pergamino que se despliega al entrar (nodo 22:3023).
 *
 * Secuencia: rollo cerrado → despliegue vertical → aparece el contenido.
 * Con `prefers-reduced-motion` aparece directamente abierto, con un fundido.
 */
export function Parchment({
  children,
  src = pergaminoDefault,
  delay = 180,
  style,
  className,
  onOpened,
  'data-figma': figma,
  imgFigma,
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
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="parchment__img"
          data-figma={imgFigma}
        />
      </div>
      <div className="parchment__content">{children}</div>
    </div>
  );
}
