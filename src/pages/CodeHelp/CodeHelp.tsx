import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { PurosolShip } from '../../components/promo/PurosolShip';
import { TelescopeMagnifier } from '../../components/promo/TelescopeMagnifier';
import { CloseButton } from '../../components/navigation/CloseButton';
import { box, u } from '../../app/stage';
import './code-help.css';

import { LogoCodigos } from '../../components/promo/LogoCodigos';
import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import jugos from '../../assets/promo/jugos.webp';
import portal from '../../assets/planets/portal.webp';
import destello from '../../assets/effects/destello.webp';
import barco from '../../assets/promo/barco.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';

const PACK_ALT =
  'Pack de jugos PuroSol con el sticker promocional. El código secreto está impreso en el sticker, en el frente del envase.';

const CONTACT = [
  '*GUARDÁ TUS STICKERS GANADORES PARA CANJEAR TU PREMIO*',
  '¡COMUNICATE AL +595 984 324 335 PARA RETIRARLO!',
];

/** DÓNDE ESTÁ EL CÓDIGO — Figma 19:2982. */
export default function CodeHelp() {
  const note = (
    <>
      {CONTACT.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );

  return (
    <Stage
      title="¿Dónde encuentro el código secreto?"
      compactMenu
      mobileCielo={{ nodo: '73:782', x: -22, y: -38, w: 445, h: 965 }}
      mobile={
        /* Figma "donde esta el codigo" (402x913): cielo claro con horizonte,
           logo → titular dorado a dos renglones → nave completa a la izquierda
           del pack → pack apoyado sobre la superficie del planeta → píldora
           cian de contacto sobre esa superficie. */
        <div
          className="codehelp-m"
          id="contenido"
          data-figma="73:781"
          data-figma-ejes="x,w"
          data-figma-omitir="pintura"
        >
          {/* Portal asomando por el borde superior derecho, con la X encima.
              Está en el Figma de esta vista y faltaba en la composición. */}
          <img
            src={portal}
            alt=""
            aria-hidden="true"
            className="codehelp-m__portal"
            data-figma="73:817"
          />

          <CloseButton to="/participar" className="codehelp-m__close" data-figma="99:258" />

          <LogoCodigos className="codehelp-m__logo" data-figma="73:783" />

          {/* El corte de renglón es el del Figma mobile, no uno automático. */}
          <p className="codehelp-m__title" data-figma="73:827">
            Buscá el Código Secreto en
            <br />
            los stickers de Purosol
          </p>

          {/* Superficie oscura sobre la que se apoyan el pack y la píldora. */}
          <div className="codehelp-m__planet" aria-hidden="true" data-figma="73:819" />

          {/* La escena no es un nodo: en el frame el destello, la nave y el
              pack cuelgan sueltos del propio frame. */}
          <div className="codehelp-m__scene">
            {/* Destello detrás del pack, como en el Figma. */}
            <img
              src={destello}
              alt=""
              aria-hidden="true"
              className="codehelp-m__flare"
              data-figma="73:793"
            />
            {/* `flipped` es el espejo horizontal del nodo: ver el porqué en
                `code-help.css`, que tiene el detalle de cómo se resolvió. */}
            {/* Marcado con el mismo nodo que la nave: ella omite las sombras
                porque el resplandor no vive ahí, y esta capa es la que lo
                dibuja. */}
            <img
              src={barco}
              alt=""
              aria-hidden="true"
              className="codehelp-m__ship-halo"
              data-figma="73:789"
              data-figma-omitir="pintura"
            />
            <PurosolShip
              flipped
              className="codehelp-m__ship"
              data-figma="73:789"
              /* Dos controles que este elemento no puede pasar, los dos por
                 lo mismo: `.ship` lleva la animación de flotación, que escribe
                 `transform`.

                 · sombras — el `0 0 250px #FFFFFF` del nodo vive en
                   `.codehelp-m__ship-halo`, la capa quieta de acá arriba: un
                   desenfoque de 250 px sobre algo que se mueve cuesta cuadros.
                 · espejo — el nodo está espejado y el volteo va en la imagen de
                   adentro (`flipped`), porque acá lo pisaría la animación. */
              data-figma-omitir="sombras,espejo"
            />
            <TelescopeMagnifier
              src={jugos}
              alt={PACK_ALT}
              description={PACK_ALT}
              zoom={2.2}
              data-figma="73:821"
            />
          </div>

          {/* En el frame la píldora son dos capas: `Rectangle 1` (73:824), la
              superficie con su radio, y el texto adentro (73:825). Acá también,
              para que las dos se puedan medir. `Group 3` (73:823) es el grupo
              que las envuelve y tiene la misma caja que la superficie. */}
          <div className="codehelp-m__note" data-figma="73:824">
            <div className="codehelp-m__note-text" data-figma="73:825">
              {note}
            </div>
          </div>
        </div>
      }
    >
      <Deco src={destello} x={-117} y={540} w={415} h={275} opacity={0.5}
        float={{ amplitude: 9, duration: 5.6 }} />
      <Deco src={destello} x={1603} y={287} w={415} h={275}
        float={{ amplitude: 8, duration: 4.8, delay: 0.6 }} />
      <Deco src={planetaVit1} x={1073} y={-57} w={339} h={166} blur={5} opacity={0.9}
        float={{ amplitude: 5, duration: 6.8, drift: 4 }} />
      <Deco src={planetaVit2} x={1851} y={146} w={169} h={184} rotate={15.05} blur={5} opacity={0.8}
        float={{ amplitude: 6, duration: 7.2, delay: 1.1 }} />
      <Deco src={portal} x={521} y={733} w={330} h={269} opacity={0.6}
        float={{ amplitude: 7, duration: 6, delay: 0.4 }} />

      <PurosolShip flipped style={{ ...box({ x: -258, y: 731, w: 664, h: 455 }), zIndex: 3 }} />

      <Deco src={logoCodigos} x={129} y={312} w={669} h={499} zIndex={4}
        glow="0 0 3cqw #09eaff" float={{ amplitude: 8, duration: 5.4 }} />

      {/* Superficie oscura del planeta sobre la que se apoya el pack.
          Está en la propuesta y faltaba en la web: el documento de ajustes lo
          marca como "planeta oscurecido no se ve ahora en la web" (pág. 8).
          La geometría sale de medir la curva sobre la captura de la propuesta:
          el ápice cae en (1440, 786) del lienzo de diseño. */}
      <div className="codehelp__planet abs" style={{ ...box({ x: -728, y: 786, w: 4336, h: 4336 }), zIndex: 1 }} />

      <div className="codehelp__halo abs" style={{ ...box({ x: 686, y: 731, w: 1496, h: 1277 }), zIndex: 2 }} />

      <p className="t-display t-gold codehelp__title abs" style={{ left: u(1410), top: u(176), fontSize: u(60), width: u(558), zIndex: 6 }}>
        <span>Buscá el Código Secreto en</span>
        <span>Los stickers de Purosol</span>
      </p>

      <TelescopeMagnifier
        src={jugos}
        alt={PACK_ALT}
        description={PACK_ALT}
        zoom={2.2}
        className="codehelp__pack"
        style={{ ...box({ x: 1200, y: 157, w: 467, h: 765 }), zIndex: 6 }}
      />

      <div className="codehelp__note abs" style={{ ...box({ x: 1095, y: 935, w: 640, h: 82 }), zIndex: 7 }} id="contenido">
        {note}
      </div>

      <CloseButton to="/participar" style={{ left: u(1758), top: u(41) }} />
    </Stage>
  );
}
