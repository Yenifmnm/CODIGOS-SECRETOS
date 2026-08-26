import type { ReactNode } from 'react';
import { SpaceBackground } from '../effects/SpaceBackground';
import { StarField } from '../effects/StarField';
import { SiteMenu } from '../navigation/SiteMenu';
import { MobileStage } from './MobileStage';
import { useIsMobile } from '../../hooks/useIsMobile';
import { mu } from '../../app/mobileStage';

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
  /** Cielo vertical de la rama mobile. No afecta al desktop. */
  mobileBg?: MobileBg;
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
  mobileBg = 'cielo',
  mobileVelo,
  mobileCielo,
  title,
}: StageProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mstage">
        {/* Cielo vertical fijo: no scrollea con el contenido. */}
        <div className="mstage__sky" aria-hidden="true">
          <img
            src={MOBILE_BG[mobileBg]}
            alt=""
            className="mstage__bg"
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
        <SpaceBackground />
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
