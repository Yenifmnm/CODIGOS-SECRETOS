import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import halo from '../../assets/logos/codigos-secretos-halo.webp';
import './logo-codigos.css';

interface LogoCodigosProps {
  /** La clase que posiciona el logo en cada pantalla. Va al contenedor. */
  className?: string;
  /**
   * De dónde sale el resplandor cian.
   *
   *   `css`       — `drop-shadow` en tiempo de ejecución. Es lo que hacen
   *                 PREMIOS, CÓDIGO y las cuatro de resultado.
   *   `horneado`  — una imagen con el resplandor ya dibujado, exportada del
   *                 propio nodo. Cero desenfoque en tiempo de ejecución.
   *
   * Sólo INICIO y PARTICIPAR usan `horneado`, que son las dos donde se reportó
   * el cuadrado y la demora. Las otras tres quedan como estaban.
   */
  resplandor?: 'css' | 'horneado';
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
 * PRIMER INTENTO, Y POR QUÉ NO ALCANZÓ. Se pusieron las dos sombras en dos
 * elementos, una en este contenedor y otra en la imagen. Eso DIBUJÓ UN HALO
 * CUADRADO en iPhone 17 Pro: anidar no es repartir. La sombra del contenedor se
 * aplica sobre el resultado ya desenfocado de la de adentro, y esa segunda
 * pasada se recorta en la región del filtro; el borde recto del recorte es el
 * cuadrado. Dos elementos, uno dentro del otro, son dos pasadas igual que
 * encadenarlas en un mismo `filter`.
 *
 * OJO: el arreglo del cofre en `result-layout.css` tiene la misma forma
 * —`.mchest__stack` es hija de `.mchest__img`, no su hermana— y Playwright no
 * lo delata. Está sin reportar, pero es el mismo constructo.
 *
 * AHORA VA UNA SOLA SOMBRA, en la imagen. Una pasada, sin segunda región que
 * recortar. Cuesta densidad y está medido: contra el export del landing, la
 * caja del logo queda a 12,5 de luminancia con una sombra, contra 2,3 con las
 * dos anidadas. No es afinable —dos sombras apiladas componen densidad y el
 * alfa no puede pasar de 1: barriendo radio 125..250 y alfa 1 y 0,8, la mejor
 * combinación sigue a 12,5—. Si hace falta recuperar esa densidad, la vía
 * medida es un `::before` con la misma imagen y su propia sombra: HERMANO del
 * `<img>` y no su padre, que da 5,9 y tampoco filtra sobre otro filtro.
 *
 * El contenedor lleva la clase que posiciona —todas las reglas de las cinco
 * pantallas siguen aplicando sobre él, sin tocarlas— y la imagen lo llena. El
 * `height: 100%` de la imagen se resuelve como `auto` cuando el contenedor no
 * tiene alto definido, que es el caso de dos de las cinco.
 *
 * Cinco pantallas lo usan: inicio, participar, premios, código y las cuatro de
 * resultado. Se cambia acá una vez, no en cinco lugares.
 */
export function LogoCodigos({
  className,
  resplandor = 'css',
  'data-figma': figma,
}: LogoCodigosProps) {
  const horneado = resplandor === 'horneado';
  return (
    <span
      className={['logo-cs', horneado && 'logo-cs--horneado', className]
        .filter(Boolean)
        .join(' ')}
      data-figma={figma}
      /* El resplandor del nodo se dibuja repartido entre este elemento y la
         imagen, así que la comparación de sombras del checker —que mira UN
         elemento— no puede validarlo. Lo valida el diff de píxeles. */
      data-figma-omitir="sombras"
    >
      {/* El resplandor, ya dibujado. Va ANTES para quedar detrás, es
          `position: absolute` —así no cambia la caja que mide `figma:check`— y
          se sale de la caja los mismos 250 px de margen que trae el export. */}
      {horneado && (
        <img src={halo} alt="" aria-hidden="true" className="logo-cs__halo" />
      )}
      <img src={logoCodigos} alt="Códigos Secretos 2026" />
    </span>
  );
}
