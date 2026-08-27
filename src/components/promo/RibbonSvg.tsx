import './ribbon-svg.css';

interface RibbonSvgProps {
  /** El SVG del nodo, importado de `assets/ui/cintas/`. */
  src: string;
  /** Nodo del Figma de esta cinta, para `npm run figma:check`. */
  nodo: string;
  className?: string;
}

/**
 * La silueta de una cinta del pergamino, con el SVG del nodo.
 *
 * POR QUÉ NO ES UN `clip-path`. Las doce cintas ocres del diseño mobile son
 * vectores dibujados a mano y **cada una tiene su propia silueta**: las muescas
 * de los bordes no están en el mismo lugar, ni tienen la misma profundidad, ni
 * el mismo dibujo. Antes las doce se recortaban con un mismo
 * `polygon(0% 0%, 100% 0%, 96% 50%, 100% 100%, 0% 100%, 4% 50%)`, que da un
 * chevrón parejo y no se parece a ninguna.
 *
 * El SVG llega del Figma con `figma:pull --export`, así que es la pieza exacta
 * y no una aproximación. Ver `assets/ui/cintas/README.md`.
 *
 * `data-figma-omitir="fondo"`: el color viaja DENTRO del SVG —y con su alfa: las
 * seis cintas de campo vienen con `fill-opacity="0.5"`, que es el `#D8831C80`
 * del spec— así que es el del diseño por construcción y no hay
 * `background-color` que comparar.
 */
export function RibbonSvg({ src, nodo, className }: RibbonSvgProps) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={['ribbon-svg', className].filter(Boolean).join(' ')}
      data-figma={nodo}
      data-figma-omitir="fondo"
    />
  );
}
