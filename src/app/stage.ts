/**
 * Conversión de coordenadas de Figma (lienzo 1920x1080) a unidades del stage.
 *
 * 1cqw === 1% del ancho del stage === 19.2px de diseño.
 * Sirve para x, y, width, height, font-size, radios y blur: todo escala junto.
 */
export const DESIGN_W = 1920;
export const DESIGN_H = 1080;
const UNIT = DESIGN_W / 100; // 19.2

/** Valor de diseño (px) → unidad proporcional del stage. */
export const u = (px: number): string => `${+(px / UNIT).toFixed(4)}cqw`;

export interface BoxSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Caja absoluta a partir de las coordenadas exactas del Figma. */
export function box({ x, y, w, h }: BoxSpec): React.CSSProperties {
  return { left: u(x), top: u(y), width: u(w), height: u(h) };
}

/** Texto centrado en `cx` (equivale al `-translate-x-1/2` del export de Figma). */
export function centeredText(cx: number, y: number, fontSize: number): React.CSSProperties {
  return {
    left: u(cx),
    top: u(y),
    fontSize: u(fontSize),
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  };
}
