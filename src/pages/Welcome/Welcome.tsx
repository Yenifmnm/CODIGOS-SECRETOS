import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { PromoButton } from '../../components/buttons/PromoButton';
import { PurosolShip } from '../../components/promo/PurosolShip';
import { IconCode, IconId, ParchmentField } from '../../components/forms/ParchmentField';
import { useCodeFlow } from '../../app/useCodeFlow';
import { useSession } from '../../app/SessionContext';
import { CodeOnlyMobile } from './CodeOnlyMobile';
import { FloatingLayer } from '../../components/effects/FloatingLayer';
import { box, centeredText, u } from '../../app/stage';
import './welcome.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import pergamino2 from '../../assets/ui/pergamino-2.webp';
import planetaPremios from '../../assets/planets/planeta-premios.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';
import portal from '../../assets/planets/portal.webp';
import destello from '../../assets/effects/destello.webp';
import barco from '../../assets/promo/barco.webp';

interface FieldErrors {
  cedula?: string;
  code?: string;
}

/** Validación de forma, no de identidad: eso es responsabilidad del backend. */
function validate(cedula: string, code: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!cedula.trim()) errors.cedula = 'Ingresá tu número de cédula.';
  else if (!/^[0-9.\-\s]{5,15}$/.test(cedula.trim())) errors.cedula = 'Revisá el formato de la cédula.';
  if (!code.trim()) errors.code = 'Ingresá el código secreto del sticker.';
  else if (code.trim().length < 4) errors.code = 'El código secreto es más largo.';
  return errors;
}

/** BIENVENIDOS / carga de código — Figma 70:396. */
export default function Welcome() {
  const location = useLocation();
  /* Si la persona ya está identificada —se registró recién o su cédula ya fue
     reconocida— la composición mobile pasa al estado de la página 15 del PDF:
     sólo el Código Secreto, más el contador de códigos cargados. El flujo de
     primera vez, que pide cédula y código, no cambia. */
  const { participant } = useSession();
  // Al volver de REGISTRO se conserva el código que el usuario venía cargando.
  const prefill = (location.state ?? {}) as { cedula?: string; code?: string };

  const [cedula, setCedula] = useState(prefill.cedula ?? '');
  const [code, setCode] = useState(prefill.code ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const { submit, loading, error } = useCodeFlow();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    /* En el estado posterior a la identificación no hay campo de cédula en
       pantalla: la que vale es la de la sesión. */
    const ci = participant?.cedula ?? cedula;
    const next = validate(ci, code);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    void submit(ci.trim(), code.trim().toUpperCase());
  };

  const form = (
    <>
      <ParchmentField
        label="Cédula"
        icon={IconId}
        data-figma-caja="70:362"
        data-figma="70:363"
        data-figma-icono="70:370"
        inputMode="numeric"
        autoComplete="off"
        name="cedula"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        error={errors.cedula}
        required
      />
      <ParchmentField
        label="Código secreto"
        icon={IconCode}
        data-figma-caja="70:364"
        data-figma="70:365"
        data-figma-icono="70:366"
        autoComplete="off"
        autoCapitalize="characters"
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        error={errors.code}
        required
      />
    </>
  );

  return (
    <Stage
      title="Bienvenidos a bordo, pequeños piratas"
      compactMenu
      mobileCielo={{ nodo: '70:344', x: -46, y: -38, w: 493, h: 1070 }}
      mobile={
        participant ? (
          <CodeOnlyMobile
            cedula={participant.cedula}
            code={code}
            onCodeChange={setCode}
            onSubmit={onSubmit}
            loading={loading}
            error={error ?? errors.code ?? null}
          />
        ) : (
          <WelcomeMobile
            form={form}
            onSubmit={onSubmit}
            loading={loading}
            error={error}
          />
        )
      }
    >
      {/* --- Universo --- */}
      <Deco src={planetaPremios} x={-137} y={-308} w={674} h={683} opacity={0.5}
        float={{ amplitude: 6, duration: 7, delay: 0.5 }} />
      <Deco src={portal} x={-336} y={404} w={873} h={711}
        float={{ amplitude: 9, duration: 6.2, delay: 1.2, rotate: 1 }} />
      <Deco src={destello} x={313} y={187} w={415} h={275} opacity={0.5}
        float={{ amplitude: 10, duration: 4.4 }} />
      <Deco src={destello} x={1041} y={742} w={690} h={457} rotate={180} flipY
        float={{ amplitude: 8, duration: 5.6, delay: 0.8 }} />
      <Deco src={planetaVit1} x={1073} y={-57} w={339} h={166} blur={5} opacity={0.9}
        float={{ amplitude: 5, duration: 6.6, drift: 4 }} />
      <Deco src={planetaVit2} x={643} y={958} w={169} h={184} rotate={15.05} blur={5} opacity={0.8}
        float={{ amplitude: 7, duration: 5.8, delay: 1.5 }} />

      <PurosolShip style={{ ...box({ x: 1287, y: 389, w: 1266, h: 867 }), zIndex: 3 }} />

      <Deco src={logoCodigos} x={1564} y={41} w={295} h={220} glow="0 0 2.4cqw #09eaff" zIndex={4}
        float={{ amplitude: 6, duration: 5 }} />

      {/* --- Titulares --- */}
      <p className="t-display welcome__hi abs" style={{ ...centeredText(947, 201, 60), zIndex: 5 }}>
        ¡Bienvenidos a bordo
      </p>
      <p className="t-display welcome__pirates abs" style={{ ...centeredText(948, 282, 100), zIndex: 5 }}>
        Pequeños piratas!
      </p>

      {/* --- Pergamino con el formulario --- */}
      <div className="welcome__scroll abs" style={{ ...box({ x: 490, y: 434, w: 918, h: 616 }), zIndex: 6 }}>
        <img src={pergamino2} alt="" aria-hidden="true" className="welcome__scroll-img" />

        <form className="welcome__form" onSubmit={onSubmit} noValidate id="contenido">
          <h2 className="welcome__title" style={{ fontSize: u(50) }}>
            Ingresá tus datos para participar
          </h2>
          <span className="welcome__rule" aria-hidden="true" />

          <div className="welcome__fields">{form}</div>

          {error && (
            <p className="welcome__error" role="alert">
              {error}
            </p>
          )}

          <PromoButton
            type="submit"
            className="welcome__submit"
            fontSize={60}
            loading={loading}
          >
            Participar
          </PromoButton>

          <Link className="welcome__help" to="/donde-esta-el-codigo" style={{ fontSize: u(30) }}>
            ¿Dónde encuentro el código secreto?
          </Link>
        </form>
      </div>
    </Stage>
  );
}

interface WelcomeMobileProps {
  form: React.ReactNode;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  error: string | null;
}

/* --------------------------------------------------------------------------
   Composición mobile — frame `CI` 70:343 (402x913).

   Las medidas salen de `figma/spec/participar-mobile.md`, no del PNG: cada
   capa lleva el nodo del que salió y la geometría vive en `welcome.css`, en
   coordenadas del frame.

   Es el PRIMER estado de la pantalla, el de la persona todavía sin
   identificar. El segundo —sólo el Código Secreto, más el contador— es
   `CodeOnlyMobile`, sale de la página 15 del PDF de ajustes y NO tiene frame
   en este spec: sus marcas siguen en TODO a propósito.
   -------------------------------------------------------------------------- */

function WelcomeMobile({ form, onSubmit, loading, error }: WelcomeMobileProps) {
  return (
    <div
      className="welcome-m"
      id="contenido"
      data-figma="70:343"
      data-figma-ejes="x,w"
      data-figma-omitir="pintura"
    >
      {/* El orden de estas capas es el de pintado del frame: logo, planeta de
          premios, barco, los dos titulares, pergamino, destello, planeta vit y
          portal. Como todas son absolutas y ninguna declara `z-index`, el orden
          del DOM es el que manda y no hace falta apilarlas a mano. */}
      <img
        src={logoCodigos}
        alt="Códigos Secretos 2026"
        className="welcome-m__logo"
        data-figma="70:345"
        data-figma-omitir="sombras"
      />

      <FloatingLayer amplitude={6} duration={7} delay={0.5}
        className="welcome-m__planeta" data-figma="70:346">
        <img src={planetaPremios} alt="" aria-hidden="true" className="mlayer-img" />
      </FloatingLayer>

      <img src={barco} alt="" aria-hidden="true" className="welcome-m__ship-halo" />
      <PurosolShip
        className="welcome-m__ship"
        data-figma="70:347"
        /* El resplandor del nodo existe y está con su valor exacto, pero vive
           en `.welcome-m__ship-halo`, la capa quieta de acá arriba. El control
           de pintura mira ESTE elemento, así que hay que sacarlo de ahí. Si
           alguna vez se borra esa capa, el halo desaparece sin que el check
           avise: van juntas. Se omiten SÓLO las sombras. */
        data-figma-omitir="sombras"
      />

      <p className="welcome-m__hi" data-figma="70:348">¡Bienvenidos a bordo</p>
      <p className="welcome-m__title" data-figma="70:349">Pequeños piratas!</p>

      {/* Pergamino real del Figma; el formulario va encima como HTML accesible. */}
      <div className="welcome-m__scroll" data-figma="70:350">
        <img src={pergamino2} alt="" aria-hidden="true" className="welcome-m__scroll-img" />

        <form className="welcome-m__form" onSubmit={onSubmit} noValidate>
          <h2 className="welcome-m__form-title" data-figma="70:357">
            Ingresá tus datos para participar
          </h2>
          <span className="welcome-m__rule" aria-hidden="true" data-figma="70:360" />

          {/* Sin nodo propio: en el frame los dos campos cuelgan sueltos. */}
          <div className="welcome-m__fields">{form}</div>

          {error && (
            <p className="welcome__error" role="alert">
              {error}
            </p>
          )}

          <div className="welcome-m__submit">
            <PromoButton
              type="submit"
              /* `Participar` (70:369) va a 25 px, el cuerpo del nodo. */
              mobileFontSize={25}
              loading={loading}
              data-figma="70:361"
              data-figma-label="70:369"
            >
              Participar
            </PromoButton>
          </div>

          <Link className="welcome-m__help" to="/donde-esta-el-codigo" data-figma="70:358">
            ¿Dónde encuentro el código secreto?
          </Link>
        </form>
      </div>

      <FloatingLayer amplitude={10} duration={4.4}
        className="welcome-m__destello" data-figma="70:351">
        <img src={destello} alt="" aria-hidden="true" className="mlayer-img" />
      </FloatingLayer>

      <FloatingLayer amplitude={5} duration={6.6} drift={4}
        className="welcome-m__planeta-vit" data-figma="70:353">
        <img src={planetaVit1} alt="" aria-hidden="true" className="mlayer-img" />
      </FloatingLayer>

      <FloatingLayer
        amplitude={7}
        duration={6.2}
        delay={1.2}
        rotate={1}
        className="welcome-m__portal"
        data-figma="70:355"
      >
        <img src={portal} alt="" aria-hidden="true" className="mlayer-img" />
      </FloatingLayer>
    </div>
  );
}
