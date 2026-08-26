import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage } from '../layout/Stage';
import { Deco } from '../layout/Deco';
import { PromoButton } from '../buttons/PromoButton';
import { CloseButton } from '../navigation/CloseButton';
import { CodeCounter } from './CodeCounter';
import { box, centeredText, u } from '../../app/stage';
import './result-layout.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import destello from '../../assets/effects/destello.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';

export interface ResultLayoutProps {
  title: string;
  /** Tamaño del titular en px de diseño. */
  titleSize?: number;
  /**
   * Cuerpo del titular en px del lienzo mobile de 402. Sólo hace falta cuando
   * el texto es más largo que el de la pantalla para la que se calibró el tono
   * y necesita entrar igual en un renglón: «¡Código fuera de órbita!» contra
   * «Estuviste cerca».
   */
  mobileTitleSize?: number;
  /**
   * Corrimiento vertical del titular en mobile, en px del lienzo de 402. Va
   * por `position: relative`, no por margen, para que reubicar el titular no
   * arrastre al resto de la columna.
   */
  mobileTitleShift?: number;
  /** `gold` = GANASTE; `outline` = relleno dorado con contorno rojo (PERDISTE y errores). */
  titleTone?: 'gold' | 'outline';
  /** Centro X e Y del titular en coordenadas de diseño. */
  titleX?: number;
  titleY?: number;
  /**
   * Una entrada por renglón. El corte de línea del Figma es intencional, así
   * que se respeta en desktop; en mobile los renglones se unen y fluyen solos.
   */
  message: string[];
  messageSize?: number;
  /** Ancho del bloque de mensaje en px de diseño. */
  messageWidth?: number;
  /** Y del mensaje en coordenadas de diseño. */
  messageY?: number;
  /** Y del botón "Cargar otro código". */
  ctaY?: number;
  /** Escena de la derecha: cofre + premio, en coordenadas de diseño. */
  scene: ReactNode;
  code?: string;
  /** true → "CANJEASTE EL CÓDIGO"; false → "CÓDIGO INGRESADO" (no se consumió). */
  codeRedeemed?: boolean;
  codeCount: number;
  /** Versión mobile de la escena. */
  mobileScene: ReactNode;
  pageTitle: string;
}

const CONTACT_LINES = [
  '*GUARDÁ TUS STICKERS GANADORES PARA CANJEAR TU PREMIO*',
  '¡COMUNICATE AL +595 984 324 335 PARA RETIRARLO!',
];

/**
 * Estructura común de las cuatro pantallas de resultado
 * (23:3081 GANASTE, 23:3159 PERDISTE, 107:297 y 131:131).
 *
 * La navegación queda siempre plegada: el foco es el resultado.
 */
export function ResultLayout({
  title,
  titleSize = 121,
  mobileTitleSize,
  mobileTitleShift,
  titleTone = 'gold',
  titleX = 479,
  titleY = 463,
  message,
  messageSize = 34,
  messageWidth = 760,
  messageY = 613,
  ctaY = 711,
  scene,
  code,
  codeRedeemed = true,
  codeCount,
  mobileScene,
  pageTitle,
}: ResultLayoutProps) {
  const navigate = useNavigate();
  const reload = () => navigate('/participar');

  const codeLabel = codeRedeemed ? 'CANJEASTE EL CÓDIGO' : 'CÓDIGO INGRESADO';

  const note = (
    <>
      {code && (
        <p className="result__note-code">
          {codeLabel}: <strong>{code}</strong>
        </p>
      )}
      {CONTACT_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );

  return (
    <Stage
      title={pageTitle}
      compactMenu
      mobileBg="profundo"
      mobile={
        /* Composición mobile de las cuatro pantallas de resultado
           (ganaste / perdiste / codigo utilizado / codigo utilizado-1, 402x969).
           Orden del Figma: logo → titular → mensaje → botón → píldora con el
           código → escena del cofre → contador.

           Cada `data-figma` de acá abajo lista los CUATRO nodos del mismo
           elemento, uno por frame, siempre en este orden:

             perdiste · ganaste · codigo-utilizado · codigo-inexistente

           `figma:check` usa el que exista en el spec de la pantalla que está
           midiendo y marca los otros «pertenece a otro frame», sin contarlos
           como falla.

           La geometría se calibró contra `perdiste`, que comparte caja con
           codigo-utilizado y codigo-inexistente. `ganaste` se aparta —su
           titular es más alto y corre el botón y la píldora— y por eso sus
           corrimientos NO viven acá: van en su propia clase. */
        <div
          className={`result-m result-m--${titleTone}`}
          id="contenido"
          data-figma="74:1025 73:858 105:260 131:332"
          data-figma-ejes="x,w"
          /* El relleno del frame va debajo de la foto, que lo tapa entera;
             este div no pinta nada. Igual que en landing y registro. */
          data-figma-omitir="pintura"
          style={
            {
              ...(mobileTitleSize
                ? { '--result-m-title': `${(mobileTitleSize / 4.02).toFixed(3)}cqw` }
                : {}),
              ...(mobileTitleShift
                ? { '--result-m-title-shift': `${(mobileTitleShift / 4.02).toFixed(3)}cqw` }
                : {}),
            } as CSSProperties
          }
        >
          {/* Superficie del planeta a nivel de pantalla: en el Figma llega hasta
              el borde inferior y el contador se apoya encima. Dentro de la
              escena del cofre quedaba recortada y aparecía una franja de cielo
              entre el cofre y el contador. */}
          <div className="result-m__planet-clip" aria-hidden="true">
            <div
              className="result-m__planet"
              data-figma="74:1030 73:866 105:265 131:337"
            />
          </div>

          {/* La mecánica (láminas 3 y 6) pide que la X vuelva a la carga de
              código, igual que el botón: el objetivo es seguir participando. */}
          <CloseButton
            to="/participar"
            className="result-m__close"
            data-figma="107:174 107:164 107:182 131:352"
          />

          <img
            src={logoCodigos}
            alt="Códigos Secretos 2026"
            className="result-m__logo"
            data-figma="74:1027 73:860 105:262 131:334"
          />

          <p
            className={`result-m__title result-m__title--${titleTone}`}
            data-figma="74:1107 74:987 105:278 131:350"
          >
            {title}
          </p>

          {/* Cada entrada es un renglón del diseño y se respeta también en
              mobile: los exports cortan justo ahí. Siguen siendo bloques que
              fluyen, así que en un teléfono angosto cada uno se parte solo. */}
          <p className="result-m__msg" data-figma="74:1109 74:988 105:279 131:351">
            {message.map((line) => (
              <span key={line} className="result-m__msg-line">
                {line}
              </span>
            ))}
          </p>

          <div className="result-m__cta">
            <PromoButton
              mobileFontSize={25.4}
              onClick={reload}
              data-figma="74:1034 74:1001 105:267 131:339"
              data-figma-label="74:1035 74:1003 105:268 131:340"
            >
              Cargar otro código
            </PromoButton>
          </div>

          {/* En el diseño la píldora son dos capas: `Rectangle 1`, la superficie
              con su radio, y el texto adentro. Acá también, para que las dos se
              puedan medir.

              DESVÍO CONOCIDO — el texto da Δh -11 contra el nodo, y no es de
              CSS: el mockup dibuja TRES renglones porque incluye la línea
              «CANJEASTE EL CÓDIGO: …», y esa línea sólo existe cuando hay un
              código en la sesión. Abriendo la ruta directamente —que es como
              mide `figma:check`— no lo hay y quedan dos. Con el recorrido real
              son tres y la caja cierra. */}
          <div
            className="result-m__note"
            data-figma="74:1041 74:991 105:270 131:342"
          >
            <div
              className="result-m__note-text"
              data-figma="74:1042 74:992 105:271 131:343"
            >
              {note}
            </div>
          </div>

          {/* La escena es un contenedor del código: en el Figma el cofre y el
              premio cuelgan del frame, sin un grupo que los envuelva. */}
          <div className="result-m__scene">{mobileScene}</div>

          <CodeCounter
            count={codeCount}
            className="result-m__counter"
            data-figma="74:1044 74:1022 105:273 131:345"
            data-figma-label="74:1047 74:1018 105:276 131:348"
          />
        </div>
      }
    >
      {/* Oscurecimiento de la mitad izquierda: en el Figma la columna de texto
          se apoya sobre un cielo mucho más oscuro que el de la derecha (hasta
          66 puntos de luminancia menos sobre el borde izquierdo). Sin esto el
          titular y el mensaje pierden contraste contra el fondo. */}
      <div className="result__vignette abs" style={{ zIndex: 0 }} />

      {/* --- Universo --- */}
      <Deco src={destello} x={1} y={155} w={415} h={275} opacity={0.5}
        float={{ amplitude: 9, duration: 5.2 }} />
      <Deco src={destello} x={713} y={40} w={297} h={197}
        float={{ amplitude: 7, duration: 4.4, delay: 0.7 }} />
      <Deco src={destello} x={1554} y={438} w={385} h={255}
        float={{ amplitude: 10, duration: 6, delay: 1.3 }} />
      <Deco src={planetaVit1} x={842} y={-57} w={253} h={124} blur={5} opacity={0.9}
        float={{ amplitude: 5, duration: 6.6, drift: 4 }} />
      <Deco src={planetaVit2} x={1811} y={146} w={169} h={184} rotate={15.05} blur={5} opacity={0.8}
        float={{ amplitude: 6, duration: 7, delay: 0.9 }} />

      {/* Superficie del planeta sobre la que se apoya el cofre.
          Geometría exacta de la elipse del Figma: nodo 23:3092 en GANASTE y
          23:3161 en PERDISTE, los dos [889, 794, 951, 911]. Antes era una
          circunferencia de 969 ajustada por medición sobre los PNG, 58 px más
          alta y 18 más ancha que el diseño; el PDF lo marca en las páginas 10
          y 11 ("replicar el planeta y el tamaño como en la propuesta"). */}
      <div className="result__planet abs" style={{ ...box({ x: 889, y: 794, w: 951, h: 911 }), zIndex: 1 }} />

      <Deco src={logoCodigos} x={299} y={202} w={329} h={245} zIndex={4}
        glow="0 0 2.4cqw #09eaff" float={{ amplitude: 6, duration: 5 }} />

      {/* --- Columna de texto --- */}
      <p
        className={`t-display result__title result__title--${titleTone} abs`}
        style={{ ...centeredText(titleX, titleY, titleSize), zIndex: 6 }}
      >
        {title}
      </p>

      <p
        className="t-display t-white-glow result__message abs"
        style={{
          left: u(480),
          top: u(messageY),
          fontSize: u(messageSize),
          width: u(messageWidth),
          transform: 'translateX(-50%)',
          zIndex: 6,
        }}
      >
        {message.map((line, i) => (
          <span key={line} className="result__message-line">
            {i > 0 && ' '}
            {line}
          </span>
        ))}
      </p>

      <PromoButton
        id="contenido"
        className="abs"
        style={{ ...box({ x: 276, y: ctaY, w: 375, h: 125 }), zIndex: 7 }}
        fontSize={42}
        onClick={reload}
      >
        Cargar otro código
      </PromoButton>

      {/* --- Escena (cofre / premio) --- */}
      {scene}

      {/* --- Pie: aviso de stickers y contador --- */}
      <div className="result__note abs" style={{ ...box({ x: 150, y: 896, w: 630, h: 97 }), zIndex: 7 }}>
        {note}
      </div>

      <CodeCounter
        className="abs"
        count={codeCount}
        /* Nodo 64:111 / 64:117: la placa arranca en (1168, 940). */
        style={{ left: u(1168), top: u(940), zIndex: 7 }}
      />

      <CloseButton to="/participar" style={{ left: u(1737), top: u(34) }} />
    </Stage>
  );
}
