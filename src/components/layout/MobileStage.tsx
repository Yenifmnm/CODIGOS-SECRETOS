import type { CSSProperties, ReactNode } from 'react';
import { mratio } from '../../app/mobileStage';
import './mobile-stage.css';

interface MobileStageProps {
  children: ReactNode;
  /** Clase extra para ajustes puntuales de una pantalla. */
  className?: string;
}

/**
 * Sistema de coordenadas de la rama mobile.
 *
 * Declara `container-type: inline-size`, con lo cual `1cqw` equivale al 1% de
 * su propio ancho y los helpers de `app/mobileStage.ts` funcionan dentro.
 * A diferencia del stage desktop no fija altura: la página scrollea y el
 * contenido fluye en columna.
 */
export function MobileStage({ children, className }: MobileStageProps) {
  return <div className={`mstage__canvas${className ? ` ${className}` : ''}`}>{children}</div>;
}

interface MobileSceneProps {
  children: ReactNode;
  /** Alto de la escena en px del diseño mobile (ancho fijo: 402). */
  height: number;
  /** Ancho de diseño, si la escena no ocupa los 402 px completos. */
  width?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Bloque de ilustración con proporción fija.
 *
 * Sirve para las composiciones donde la superposición entre capas es parte del
 * diseño (el cúmulo de premios y la nave del landing, el cofre de los
 * resultados, el pack de "dónde está el código"). Al mantener el
 * `aspect-ratio` del Figma, los elementos posicionados con `mbox()` conservan
 * su relación exacta a cualquier ancho, y siguen siendo capas independientes
 * que se pueden animar por separado.
 *
 * Para texto y formularios NO se usa esto: va todo en flujo normal.
 */
export function MobileScene({ children, height, width, className, style }: MobileSceneProps) {
  return (
    <div
      className={`mscene${className ? ` ${className}` : ''}`}
      style={{ aspectRatio: mratio(height, width), ...style }}
    >
      {children}
    </div>
  );
}
