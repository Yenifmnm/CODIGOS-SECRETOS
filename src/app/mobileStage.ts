/**
 * Conversión de coordenadas del Figma mobile (lienzo 402 px de ancho) a
 * unidades del contenedor mobile.
 *
 * Análogo a `app/stage.ts`, con dos diferencias de fondo:
 *
 *  · El lienzo mide 402 px de ancho, no 1920. Por lo tanto 1cqw === 4.02 px de
 *    diseño, y el contenedor declara `container-type: inline-size` en vez de
 *    `size`: sólo el ancho define la escala.
 *  · La página mobile scrollea. Las coordenadas Y del diseño (913 px, o 969 en
 *    las pantallas de resultado) se usan como referencia de proporción y
 *    espaciado, nunca como una altura fija: el contenido fluye.
 *
 * En consecuencia `mbox()` se usa sólo dentro de escenas de proporción fija
 * (`MobileScene`), donde sí existe un alto conocido. Todo lo demás —textos,
 * formularios, botones— va en flujo normal.
 */

export const MOBILE_DESIGN_W = 402;
/** Alto de referencia de las pantallas comunes. */
export const MOBILE_DESIGN_H = 913;
/** Alto de referencia de las cuatro pantallas de resultado. */
export const MOBILE_DESIGN_H_RESULT = 969;

const UNIT = MOBILE_DESIGN_W / 100; // 4.02

/** Valor de diseño (px sobre el lienzo de 402) → unidad proporcional. */
export const mu = (px: number): string => `${+(px / UNIT).toFixed(4)}cqw`;

/**
 * Porcentaje relativo a la escena que lo contiene.
 * Dentro de una `MobileScene` conviene a las coordenadas verticales, que deben
 * escalar con el alto de la escena y no con el ancho del contenedor.
 */
export const mpct = (px: number, total: number): string =>
  `${+((px / total) * 100).toFixed(4)}%`;

export interface MobileBoxSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Alto de la escena que contiene la caja, en px de diseño. */
  sceneH: number;
}

/**
 * Caja absoluta dentro de una escena de proporción fija.
 *
 * X y ancho van en `cqw` (escalan con el ancho del contenedor); Y y alto van en
 * porcentaje de la escena. Como la escena mantiene su `aspect-ratio`, ambos
 * ejes escalan al mismo ritmo y la composición no se deforma.
 */
export function mbox({ x, y, w, h, sceneH }: MobileBoxSpec): React.CSSProperties {
  return {
    left: mu(x),
    top: mpct(y, sceneH),
    width: mu(w),
    height: mpct(h, sceneH),
  };
}

/** `aspect-ratio` de una escena a partir de su alto de diseño. */
export const mratio = (h: number, w: number = MOBILE_DESIGN_W): string => `${w} / ${h}`;
