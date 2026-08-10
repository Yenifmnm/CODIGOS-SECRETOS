import type { ReactNode } from 'react';
import { SpaceBackground } from '../effects/SpaceBackground';
import { StarField } from '../effects/StarField';
import { SiteMenu } from '../navigation/SiteMenu';
import { MobileStage } from './MobileStage';
import { useIsMobile } from '../../hooks/useIsMobile';

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
  title,
}: StageProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="mstage">
        {/* Cielo vertical fijo: no scrollea con el contenido. */}
        <div className="mstage__sky" aria-hidden="true">
          <img src={MOBILE_BG[mobileBg]} alt="" className="mstage__bg" />
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
