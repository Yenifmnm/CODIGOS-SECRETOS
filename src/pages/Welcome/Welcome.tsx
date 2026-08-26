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
import { MobileScene } from '../../components/layout/MobileStage';
import { FloatingLayer } from '../../components/effects/FloatingLayer';
import { box, centeredText, u } from '../../app/stage';
import { mbox } from '../../app/mobileStage';
import './welcome.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import pergamino2 from '../../assets/ui/pergamino-2.webp';
import planetaPremios from '../../assets/planets/planeta-premios.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';
import portal from '../../assets/planets/portal.webp';
import destello from '../../assets/effects/destello.webp';

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
   Composición mobile — Figma "CI.png" (402x913).

   Medidas del export, descontada la barra de estado de iOS. Esa barra ocupa
   los primeros 64 px del PNG —no 54, como se había asumido en la primera
   pasada—, así que el área útil es (0,64)-(402,913) y todo lo de abajo está
   medido contra esos 849 px de alto:
     logo         246x172 de contenido visible, arriba en y 87
     "¡Bienvenidos a bordo"    271x28 en y 272, blanco
     "Pequeños piratas!"       312x47 en y 307, dorado
     pergamino    cuerpo de 328x265 arrancando en (36, 322)
     nave         312x206 de contenido visible en (218, 602), sangra a la derecha
     portal       arco de 142x199 desde (0, 650), sangra por el borde izquierdo
     campos       ancho 276, alto 31, cápsula con ícono a la izquierda

   PENDIENTE: el export trae además una nebulosa magenta arriba a la izquierda,
   un sol amarillo arriba a la derecha y un cometa verde a media altura. No hay
   assets para eso en el repo (src/assets/effects/ sólo tiene destello y glow),
   así que el fondo mobile queda sin esa capa.
   -------------------------------------------------------------------------- */
const WELCOME_SCENE_H = 230;

function WelcomeMobile({ form, onSubmit, loading, error }: WelcomeMobileProps) {
  return (
    <div className="welcome-m" id="contenido" data-figma="TODO" data-figma-ejes="x,w">
      <img
        src={logoCodigos}
        alt="Códigos Secretos 2026"
        className="welcome-m__logo"
        data-figma="TODO"
      />

      <p className="welcome-m__hi" data-figma="TODO">¡Bienvenidos a bordo</p>
      <p className="welcome-m__title" data-figma="TODO">Pequeños piratas!</p>

      {/* Pergamino real del Figma; el formulario va encima como HTML accesible. */}
      <div className="welcome-m__scroll" data-figma="TODO">
        <img src={pergamino2} alt="" aria-hidden="true" className="welcome-m__scroll-img" />

        <form className="welcome-m__form" onSubmit={onSubmit} noValidate>
          <h2 className="welcome-m__form-title" data-figma="TODO">
            Ingresá tus datos para participar
          </h2>
          <span className="welcome-m__rule" aria-hidden="true" />

          <div className="welcome-m__fields" data-figma="TODO">
            {form}
          </div>

          {error && (
            <p className="welcome__error" role="alert">
              {error}
            </p>
          )}

          <div className="welcome-m__submit">
            <PromoButton type="submit" mobileFontSize={17} loading={loading} data-figma="TODO">
              Participar
            </PromoButton>
          </div>

          <Link className="welcome-m__help" to="/donde-esta-el-codigo" data-figma="TODO">
            ¿Dónde encuentro el código secreto?
          </Link>
        </form>
      </div>

      <MobileScene height={WELCOME_SCENE_H} className="welcome-m__scene" data-figma="TODO">
        <FloatingLayer amplitude={7} duration={6.2} delay={1.2} rotate={1}
          className="mabs" style={mbox({ x: -95, y: 17, w: 296, h: 242, sceneH: WELCOME_SCENE_H })}
          data-figma="TODO">
          <img src={portal} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <PurosolShip
          className="mabs welcome-m__ship"
          style={mbox({ x: 201, y: -31, w: 366, h: 250, sceneH: WELCOME_SCENE_H })}
          data-figma="TODO"
        />
      </MobileScene>
    </div>
  );
}
