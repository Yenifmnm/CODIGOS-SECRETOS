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
    <Stage title="El Tesoro Galáctico de los Códigos Secretos 2026" mobile={<HomeMobile onStart={goParticipar} />}>
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
const SCENE_H = 360;

function HomeMobile({ onStart }: { onStart: () => void }) {
  return (
    <div className="home-m" id="contenido">
      {/* B3 asomando por la esquina superior derecha, desenfocado y CORTADO por
          el borde. Caja medida sobre `recursos/mobile/pantallas/landing.png`:
          [313, 13, 91, 91], pero sobre el PNG completo; descontada la barra de
          estado de iOS queda en -49 del area util. */}
      <img src={planetaVit2} alt="" aria-hidden="true" className="home-m__b3" />

      <img src={logoCodigos} alt="Códigos Secretos 2026" className="home-m__logo" />

      <div className="mblock">
        <p className="home-m__title">Ganá un viaje al Caribe</p>
        <p className="home-m__sub">¡y cientos de premios más!</p>
      </div>

      <div className="home-m__cta">
        <PromoButton plate="carga" mobileFontSize={25} onClick={onStart}>
          Cargá acá tu código
        </PromoButton>
      </div>

      {/* Cúmulo de premios (izquierda, sangra) + nave pirata (derecha, sangra).
          Las cajas de los tres productos salen de medir su silueta en
          landing.png: son objetos claros y desaturados sobre el planeta, así
          que se aislan por componentes conexas y no por plantilla —el matching
          se enganchaba a detalles sueltos y daba cualquier cosa—.
          En el diseño miden PS5 49x90 en (72,637), Switch 53x43 en (112,745) y
          auriculares 47x46 en (211,712). Estaban entre un 31% y un 36% más
          chicos, y por eso el cúmulo se leía corrido hacia los bordes. */}
      <MobileScene height={SCENE_H} className="home-m__scene">
        <img
          src={glow}
          alt=""
          aria-hidden="true"
          className="mabs mlayer-img home-m__glow"
          style={mbox({ x: -110, y: 90, w: 360, h: 250, sceneH: SCENE_H })}
        />

        <FloatingLayer amplitude={6} duration={6.8} delay={0.9} rotate={1.2}
          className="mabs" style={mbox({ x: -84, y: 28, w: 248, h: 251, sceneH: SCENE_H })}>
          <img src={planetaPremios} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <FloatingLayer amplitude={9} duration={4.2} delay={0.6} rotate={-2}
          className="mabs" style={mbox({ x: 34, y: 132, w: 133, h: 133, sceneH: SCENE_H })}>
          <img src={playstationConsola} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <FloatingLayer amplitude={8} duration={5.4} delay={1.4} drift={4} rotate={2}
          className="mabs" style={mbox({ x: 82, y: 198, w: 135, h: 174, sceneH: SCENE_H })}>
          <img src={nintendo} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <FloatingLayer amplitude={10} duration={3.6} delay={0.1} rotate={-3}
          className="mabs" style={mbox({ x: 197, y: 218, w: 81, h: 81, sceneH: SCENE_H })}>
          <img src={auriculares} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <PurosolShip
          variant="enter"
          className="mabs home-m__ship"
          style={mbox({ x: 195, y: 18, w: 415, h: 285, sceneH: SCENE_H })}
        />
      </MobileScene>
    </div>
  );
}
