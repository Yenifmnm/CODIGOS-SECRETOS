import type { CSSProperties, ReactNode } from 'react';
import { SpaceBackground } from '../effects/SpaceBackground';
import { StarField } from '../effects/StarField';
import { SiteMenu } from '../navigation/SiteMenu';
import { MobileStage } from './MobileStage';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MOBILE_DESIGN_H, mu } from '../../app/mobileStage';

import fondoMobile from '../../assets/backgrounds/fondo-mobile.webp';
import fondoMobileProfundo from '../../assets/backgrounds/fondo-mobile-profundo.webp';
import fondoMobileHalo from '../../assets/backgrounds/fondo-mobile-halo.webp';

/** Los tres cielos verticales del Figma mobile. */
const MOBILE_BG = {
  cielo: fondoMobile,
  profundo: fondoMobileProfundo,
  halo: fondoMobileHalo,
} as const;

export type MobileBg = keyof typeof MOBILE_BG;

interface StageProps {
  /** Composición desktop, en coordenadas de diseño (1920x1080). */
  children: ReactNode;
  /** Composición mobile: flujo vertical propio, no la desktop encogida. */
  mobile: ReactNode;
  /** Oculta el menú (pantallas donde el diseño no lo incluye). */
  withMenu?: boolean;
  /** Menú siempre plegado: registro, carga de código y resultados. */
  compactMenu?: boolean;
  /** Fondo exclusivo de una composición desktop. Mobile nunca usa esta prop. */
  desktopBg?: string;
  /** Cielo vertical de la rama mobile. No afecta al desktop. */
  mobileBg?: MobileBg;
  /**
   * Prioridad de descarga del fondo mobile. Va por prop y no fija en el
   * componente porque el ajuste de carga se hizo SÓLO en la landing: las otras
   * pantallas quedan como estaban hasta medirlas una por una.
   */
  mobileBgPrioridad?: 'high' | 'low';
  /**
   * Capa que se dibuja DENTRO del cielo, entre la foto y las estrellas. Es
   * para los velos que algunos frames apoyan sobre la foto de fondo: puestos
   * más arriba apagarían las estrellas, que en el Figma van por encima.
   */
  mobileVelo?: ReactNode;
  /**
   * Encuadre de la foto de fondo, en px del lienzo mobile (402), más el nodo
   * del que sale. En el Figma hay DOS: `(-46, -38) 493x1070` en las pantallas
   * de flujo y `(-22, -38) 445x965` en las de resultado, que además miden 969
   * de alto. Cada pantalla pasa el suyo; sin esto la foto se recorta con
   * `object-fit: cover` sobre el viewport y queda en otro encuadre.
   *
   * Va en px de diseño y no en px de pantalla a propósito: `mu()` los convierte
   * a `cqw`, así el encuadre escala con el ancho del teléfono en vez de
   * desarmarse en una pantalla más alta o más baja que el lienzo.
   */
  mobileCielo?: { nodo: string; x: number; y: number; w: number; h: number };
  /**
   * Alto del frame mobile en px de diseño. 913 en las pantallas de flujo y 969
   * en las cuatro de resultado. De acá sale el alto útil —menos la barra de
   * estado— contra el que la rama mobile calcula su escala, así que una
   * pantalla que declare el alto equivocado se dibuja más chica o más grande de
   * lo que corresponde.
   */
  mobileAlto?: number;
  title: string;
}

/**
 * Contenedor común de todas las pantallas.
 *
 * Desktop: fondo 16:9 que cubre el viewport + lienzo 16:9 que se contiene en él,
 * de modo que la composición nunca queda cortada. Los hijos se posicionan con
 * las coordenadas exactas del Figma convertidas a `cqw` (ver app/stage.ts).
 * Mobile (<900px): se descarta esa composición y se renderiza `mobile`.
 */
export function Stage({
  children,
  mobile,
  withMenu = true,
  compactMenu = false,
  desktopBg,
  mobileBg = 'cielo',
  mobileBgPrioridad,
  mobileVelo,
  mobileCielo,
  mobileAlto = MOBILE_DESIGN_H,
  title,
}: StageProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className="mstage"
        style={{ '--mstage-diseno-h': mobileAlto } as CSSProperties}
      >
        {/* Cielo vertical fijo: no scrollea con el contenido. */}
        <div className="mstage__sky" aria-hidden="true">
          {/* Capa de sangrado: la misma foto a pantalla completa, SIN marca.
              Rellena lo que la capa del nodo deja descubierto cuando la
              composición se escala por debajo del viewport —siempre en
              landscape, y al costado en cualquier teléfono más ancho que los
              402 del diseño—. Va sin `data-figma` a propósito: su caja no es la
              de ningún nodo y no tiene que compararse con nada. */}
          <img
            src={MOBILE_BG[mobileBg]}
            alt=""
            className="mstage__bg--sangra"
            fetchPriority={mobileBgPrioridad}
          />
          {/* Todo lo que es capa marcada del diseño va DENTRO de esta caja, que
              copia el ancho y el origen del lienzo. Fuera de ella `mu()` mediría
              contra el viewport y el fondo escalaría distinto que el resto. */}
          <div className="mstage__sky-caja">
            {/* Capa del nodo: su caja es la del Figma y escala con la
                composición, así que `figma:check` la mide como a cualquier otra. */}
            <img
              src={MOBILE_BG[mobileBg]}
              alt=""
              className="mstage__bg"
              fetchPriority={mobileBgPrioridad}
              data-figma={mobileCielo?.nodo}
              style={
                mobileCielo
                  ? {
                      left: mu(mobileCielo.x),
                      top: mu(mobileCielo.y),
                      width: mu(mobileCielo.w),
                      height: mu(mobileCielo.h),
                    }
                  : undefined
              }
            />
            {mobileVelo}
          </div>
          <StarField />
        </div>
        <MobileStage>
          {withMenu && <SiteMenu compact={compactMenu} />}
          <h1 className="sr-only">{title}</h1>
          {mobile}
        </MobileStage>
      </div>
    );
  }

  return (
    <div className="stage">
      {/* Fondo en su propia capa "cover": llena la ventana sea cual sea su forma. */}
      <div className="stage__bg" aria-hidden="true">
        {desktopBg ? (
          <img
            src={desktopBg}
            alt=""
            className="deco deco--cover"
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          />
        ) : (
          <SpaceBackground />
        )}
      </div>
      <div className="stage__inner">
        <div className="layer" style={{ zIndex: 2 }}>
          <h1 className="sr-only">{title}</h1>
          {children}
          {withMenu && <SiteMenu compact={compactMenu} />}
        </div>
      </div>
    </div>
  );
}
