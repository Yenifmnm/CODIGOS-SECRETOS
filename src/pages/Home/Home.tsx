import { useNavigate } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { MobileScene } from '../../components/layout/MobileStage';
import { Deco } from '../../components/layout/Deco';
import { FloatingLayer } from '../../components/effects/FloatingLayer';
import { PromoButton } from '../../components/buttons/PromoButton';
import { PurosolShip } from '../../components/promo/PurosolShip';
import { box, centeredText } from '../../app/stage';
import { mbox } from '../../app/mobileStage';
import './home.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import planetaPremios from '../../assets/planets/planeta-premios.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';
import glow from '../../assets/effects/glow.webp';
import destello from '../../assets/effects/destello.webp';
import auriculares from '../../assets/prizes/auriculares.webp';
import playstation from '../../assets/prizes/playstation.webp';
/* En mobile el cúmulo lleva la consola SOLA: landing.png no dibuja el joystick,
   que sí trae `playstation.webp` y es el que usa la composición de desktop. */
import playstationConsola from '../../assets/prizes/playstation-consola.webp';
import nintendo from '../../assets/prizes/nintendo.webp';
import barco from '../../assets/promo/barco.webp';

/**
 * INICIO — Figma 13:49.
 *
 * Coordenadas tomadas 1:1 del diseño. Cada elemento es una capa independiente
 * (nada de screenshot de fondo) para poder flotar a distinta profundidad.
 */
export default function Home() {
  const navigate = useNavigate();
  const goParticipar = () => navigate('/participar');

  return (
    <Stage
      title="El Tesoro Galáctico de los Códigos Secretos 2026"
      /* `CODIGO 1` (70:168): el encuadre de la foto, que no es el que da
         `object-fit: cover` sobre el viewport. */
      mobileCielo={{ nodo: '70:168', x: -46, y: -38, w: 493, h: 1070 }}
      /* `Rectangle 6` (117:293): el velo que el frame apoya sobre la foto. */
      mobileVelo={<div className="home-m__velo" data-figma="117:293" />}
      mobile={<HomeMobile onStart={goParticipar} />}
    >
      {/* --- Universo lejano --- */}
      <Deco
        src={planetaVit2}
        x={7}
        y={60}
        w={169}
        h={184}
        rotate={15.05}
        blur={5}
        opacity={0.8}
        float={{ amplitude: 6, duration: 6.4, delay: 0.4, drift: 3 }}
      />
      <Deco
        src={planetaVit1}
        x={1073}
        y={962}
        w={339}
        h={166}
        blur={5}
        opacity={0.9}
        float={{ amplitude: 5, duration: 7, delay: 1.1, drift: -4 }}
      />
      <Deco
        src={destello}
        x={1276}
        y={171}
        w={415}
        h={275}
        float={{ amplitude: 9, duration: 4.6, delay: 0.2 }}
      />

      {/* --- Nave: entra navegando desde la derecha y queda flotando --- */}
      <PurosolShip variant="enter" style={{ ...box({ x: 1322, y: 273, w: 1016, h: 696 }), zIndex: 3 }} />

      {/* --- Cúmulo de premios (izquierda) --- */}
      <Deco src={glow} x={-211} y={390} w={883} h={561} opacity={0.9} />
      <Deco
        src={planetaPremios}
        x={-104}
        y={205}
        w={503}
        h={510}
        float={{ amplitude: 7, duration: 6.8, delay: 0.9, rotate: 1.2 }}
      />
      <Deco
        src={playstation}
        x={7}
        y={400}
        w={279}
        h={280}
        float={{ amplitude: 11, duration: 4.2, delay: 0.6, rotate: -2 }}
      />
      <Deco
        src={nintendo}
        x={107}
        y={580}
        w={278}
        h={279}
        float={{ amplitude: 9, duration: 5.4, delay: 1.4, drift: 5, rotate: 2 }}
      />
      <Deco
        src={auriculares}
        x={356}
        y={577}
        w={168}
        h={169}
        float={{ amplitude: 12, duration: 3.6, delay: 0.1, rotate: -3 }}
      />

      {/*
        SIN COFRE. Lo pedía el PPT (lám. 29), pero el documento de ajustes del
        cliente lo saca: "se ve el cofre en la pag de inicio, pero en la
        propuesta de diseño no estaba incluido" (pág. 5). El componente
        `TreasureChest` sigue en el proyecto: lo usan /ganaste y /perdiste.
      */}

      {/* --- Bloque central --- */}
      <Deco
        src={logoCodigos}
        x={712}
        y={171}
        w={495}
        h={369}
        glow="0 0 3cqw #09eaff"
        zIndex={4}
        float={{ amplitude: 8, duration: 5.2 }}
      />

      <p
        className="t-display t-gold abs"
        style={{ ...centeredText(948, 540, 100), zIndex: 5 }}
      >
        Ganá un viaje al Caribe
      </p>

      <p
        className="t-display t-white-glow abs"
        style={{ ...centeredText(960, 662, 50), zIndex: 5 }}
      >
        ¡y cientos de premios más!
      </p>

      <PromoButton
        id="contenido"
        className="abs"
        style={{ ...box({ x: 660, y: 759, w: 573, h: 192 }), zIndex: 7 }}
        fontSize={60}
        onClick={goParticipar}
      >
        Cargá acá tu código
      </PromoButton>
    </Stage>
  );
}

/* --------------------------------------------------------------------------
   Composición mobile — Figma "landing.png" (402x913).

   Las coordenadas Y del mockup llevan descontada la barra de estado del
   sistema (54 px), que no se implementa: es sólo el marco del mockup.

   La escena inferior es un bloque de proporción fija: el cúmulo de premios y
   la nave se superponen igual que en el diseño, y cada pieza sigue siendo una
   capa propia para poder flotar por separado.
   -------------------------------------------------------------------------- */
/* Alto de la escena: del borde de arriba del barco (562) al de abajo del glow
   (933), que son la primera y la última capa del cúmulo en el frame. */
const SCENE_H = 371;

function HomeMobile({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="home-m"
      id="contenido"
      data-figma="65:123"
      data-figma-ejes="x,w"
      /* El relleno del frame (#212F5C) es el color base debajo de la foto, que
         lo tapa entera; este div no pinta nada. */
      data-figma-omitir="pintura"
    >
      {/* B3 asomando por la esquina superior derecha, desenfocado y cortado por
          el borde. Está rotado 15.1° en el Figma, así que `figma:check` lo
          compara centro contra centro. */}
      <img
        src={planetaVit2}
        alt=""
        aria-hidden="true"
        className="home-m__b3"
        data-figma="70:180"
      />

      <img
        src={logoCodigos}
        alt="Códigos Secretos 2026"
        className="home-m__logo"
        data-figma="70:169"
      />

      <div className="mblock">
        <p className="home-m__title" data-figma="70:194">Ganá un viaje al Caribe</p>
        <p className="home-m__sub" data-figma="70:193">¡y cientos de premios más!</p>
      </div>

      {/* Destello detrás del tablón. En el Figma va encima de los dos textos y
          debajo del botón, así que el CTA lleva su propio apilado. */}
      <img
        src={destello}
        alt=""
        aria-hidden="true"
        className="home-m__flare"
        data-figma="70:204"
      />

      <div className="home-m__cta">
        <PromoButton
          plate="carga"
          mobileFontSize={30}
          onClick={onStart}
          data-figma="70:202"
          data-figma-label="70:197"
        >
          Cargá acá tu código
        </PromoButton>
      </div>

      {/* Cúmulo de premios (izquierda, sangra) + nave pirata (derecha, sangra).
          Las seis cajas salen de `figma/spec/inicio-mobile.md`, con la y del
          frame menos los 562 en que arranca la escena. */}
      <MobileScene height={SCENE_H} className="home-m__scene">
        {/* El orden es el del frame: planeta premios → glow → auriculares →
            playstation → nintendo → barco. El glow va ENCIMA del planeta y los
            auriculares DEBAJO de la consola. */}
        <FloatingLayer amplitude={6} duration={6.8} delay={0.9} rotate={1.2}
          className="mabs" style={mbox({ x: -83, y: 8, w: 282, h: 286, sceneH: SCENE_H })}
          data-figma="70:171">
          <img src={planetaPremios} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <img
          src={glow}
          alt=""
          aria-hidden="true"
          className="mabs mlayer-img home-m__glow"
          style={mbox({ x: -65, y: 110, w: 411, h: 261, sceneH: SCENE_H })}
          data-figma="70:173"
        />

        <FloatingLayer amplitude={10} duration={3.6} delay={0.1} rotate={-3}
          className="mabs" style={mbox({ x: 199, y: 197, w: 78, h: 78, sceneH: SCENE_H })}
          data-figma="70:174">
          <img src={auriculares} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <FloatingLayer amplitude={9} duration={4.2} delay={0.6} rotate={-2}
          className="mabs" style={mbox({ x: 36, y: 115, w: 130, h: 130, sceneH: SCENE_H })}
          data-figma="70:175">
          <img src={playstationConsola} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <FloatingLayer amplitude={8} duration={5.4} delay={1.4} drift={4} rotate={2}
          className="mabs" style={mbox({ x: 83, y: 198, w: 129, h: 130, sceneH: SCENE_H })}
          data-figma="70:176">
          <img src={nintendo} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        {/* El halo del barco va en su propia capa, quieta. El `drop-shadow` de
            250 px sobre el barco —que entra navegando y después flota— costaba
            tres de cada cuatro cuadros; acá se rasteriza una vez. No lleva
            marca: el nodo `barco 1` es el barco, que va encima. */}
        <img
          src={barco}
          alt=""
          aria-hidden="true"
          className="mabs home-m__ship-halo"
          style={mbox({ x: 199, y: 0, w: 401, h: 275, sceneH: SCENE_H })}
        />

        <PurosolShip
          variant="enter"
          className="mabs home-m__ship"
          style={mbox({ x: 199, y: 0, w: 401, h: 275, sceneH: SCENE_H })}
          data-figma="70:178"
          /* El resplandor del nodo existe y está con su valor exacto, pero vive
             en `.home-m__ship-halo`, la capa quieta de acá arriba: sobre este
             elemento —que se anima— costaba 40 ms por cuadro. El control de
             pintura mira este elemento, así que hay que sacarlo de ahí. Si
             alguna vez se borra esa capa, el halo desaparece sin que el check
             avise: van juntas. Se omiten SÓLO las sombras: el resto de la
             pintura de esta capa se sigue controlando. */
          data-figma-omitir="sombras"
        />
      </MobileScene>
    </div>
  );
}
