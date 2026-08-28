import { useEffect } from 'react';

interface PrefetchProps {
  /** URLs ya resueltas por el bundler: se importan y se pasan, no se escriben. */
  urls: string[];
}

/**
 * Deja pedido de antemano lo que va a hacer falta en la pantalla SIGUIENTE.
 *
 * `rel="prefetch"` es una prioridad de ociosidad: el navegador lo baja cuando
 * no tiene nada mejor que hacer, así que no compite con lo que la pantalla
 * actual necesita ahora. Por eso es barato ponerlo, y por eso NO sirve para lo
 * que hace falta ya —para eso está `preload`, que es lo que usa el `index.html`
 * con el fondo y el logo—.
 *
 * Se limpia al desmontar: si la persona no llega a ir a esa pantalla, el enlace
 * no queda colgado en el `<head>`.
 *
 * OJO CON QUÉ SE LE PASA. Vale la pena sólo para lo que la pantalla siguiente
 * NO tenga ya en caché. Medido para `/donde-esta-el-codigo` viniendo de
 * `/participar`: de sus nueve imágenes, OCHO ya están bajadas —el fondo, el
 * logo y su halo, el portal, la nave, el destello, el logo de PuroSol y el
 * cursor— y la única que falta es `jugos.webp`. Prefetchear las otras ocho no
 * ahorraría nada y ensuciaría el `<head>`.
 */
export function Prefetch({ urls }: PrefetchProps) {
  useEffect(() => {
    const enlaces = urls.map((url) => {
      const l = document.createElement('link');
      l.rel = 'prefetch';
      l.as = 'image';
      l.href = url;
      document.head.appendChild(l);
      return l;
    });
    return () => enlaces.forEach((l) => l.remove());
  }, [urls]);

  return null;
}
