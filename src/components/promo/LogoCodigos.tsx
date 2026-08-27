import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import './logo-codigos.css';

interface LogoCodigosProps {
  /** La clase que posiciona el logo en cada pantalla. Va al contenedor. */
  className?: string;
  /** Nodo del Figma de esta capa, para `npm run figma:check`. */
  'data-figma'?: string;
}

/**
 * El logo CÓDIGOS SECRETOS, con los dos resplandores cian del nodo.
 *
 * POR QUÉ ES UN COMPONENTE Y NO UN `<img>` SUELTO. El nodo declara DOS
 * `0 0 250px #09EAFF`, y encadenarlas en un solo `filter` es el patrón que
 * WebKit no dibuja bien. Está medido dos veces en este proyecto:
 *
 *   · En el cofre de GANASTE, dos `drop-shadow` de 250 px encadenadas dejaban
 *     el 12% de los píxeles cálidos en WebKit — menos que sin filtro. Una sola
 *     de 500 salía igual en los dos motores, y las mismas dos repartidas en dos
 *     elementos también. El límite es el ENCADENADO, no el radio.
 *   · Acá: en el landing, la caja del logo mide 10.404 píxeles cian en WebKit
 *     contra 4.975 en Chromium. El doble. Y en un iPhone 14 el logo
 *     directamente NO SE DIBUJA: 57,1 de luminancia contra 123,4 en un 17.
 *
 * Así que las dos sombras van en DOS elementos, una cada uno, igual que en el
 * cofre. El contenedor lleva la clase que posiciona —todas las reglas de las
 * cinco pantallas siguen aplicando sobre él, sin tocarlas— y la imagen lo
 * llena. El `height: 100%` de la imagen se resuelve como `auto` cuando el
 * contenedor no tiene alto definido, que es el caso de dos de las cinco.
 *
 * Cinco pantallas lo usan: inicio, participar, premios, código y las cuatro de
 * resultado. Se cambia acá una vez, no en cinco lugares.
 */
export function LogoCodigos({ className, 'data-figma': figma }: LogoCodigosProps) {
  return (
    <span
      className={['logo-cs', className].filter(Boolean).join(' ')}
      data-figma={figma}
      /* El resplandor del nodo se dibuja repartido entre este elemento y la
         imagen, así que la comparación de sombras del checker —que mira UN
         elemento— no puede validarlo. Lo valida el diff de píxeles. */
      data-figma-omitir="sombras"
    >
      <img src={logoCodigos} alt="Códigos Secretos 2026" />
    </span>
  );
}
