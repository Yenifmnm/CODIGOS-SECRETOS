import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { RibbonButton } from '../../components/buttons/RibbonButton';
import { RibbonPlate } from '../../components/promo/RibbonPlate';
import { FloatingLayer } from '../../components/effects/FloatingLayer';
import { ParchmentField } from '../../components/forms/ParchmentField';
import { promoApi } from '../../services/promoApi';
import { useSession } from '../../app/SessionContext';
import { useCodeFlow } from '../../app/useCodeFlow';
import { MIN_AGE, completedAge, isOfAge, maxBirthDate } from '../../app/age';
import { box, centeredText, u } from '../../app/stage';
import type { RegistrationForm } from '../../types/promo';
import './register.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import pergamino1 from '../../assets/ui/pergamino-1.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import planetaVit2 from '../../assets/planets/planeta-vit-2.webp';
import destello from '../../assets/effects/destello.webp';
import dino from '../../assets/characters/dino.webp';
import nena from '../../assets/characters/nena.webp';
import pluma from '../../assets/ui/pluma.webp';
/* Las dos cintas del titular mobile, bajadas de sus nodos con
   `figma:pull --export 73:614,73:643 --formato svg`. Son vectores dibujados a
   mano —cada uno con sus propias muescas y su propio ancho—, no dos instancias
   de una misma silueta: por eso no las puede dibujar `RibbonPlate`. */
import cintaTitulo1 from '../../assets/ui/cinta-titulo-1.svg';
import cintaTitulo2 from '../../assets/ui/cinta-titulo-2.svg';

type Errors = Partial<Record<keyof RegistrationForm, string>>;

/* --------------------------------------------------------------------------
   Grilla del pergamino, en px de diseño (lienzo 1920x1080).
   Las cintas se apoyan en una sola columna: así los campos de ancho completo y
   los de media caña quedan alineados por los dos bordes.
   -------------------------------------------------------------------------- */
const COL_X = 578;
const COL_W = 764;
const COL_GAP = 40;
const HALF_W = (COL_W - COL_GAP) / 2; // 362
const ROW_H = 62;

const FORM = {
  titleY: 373,
  row1: 452,
  row2: 540,
  noteY: 636,
  row3: 681,
  row4: 767,
  buttonsY: 863,
} as const;

/* El mensaje de error cuelga por debajo de su cinta e invade la banda de la
   fila siguiente. Por eso las filas se apilan al revés que en el DOM —la de
   más arriba, más alta— y así el error siempre queda por encima de la cinta
   que le sigue. Las cintas nunca se solapan entre sí, con lo cual invertir el
   orden no tiene contrapartida. */
const Z = { row1: 12, row2: 11, row3: 10, row4: 9, buttons: 8, note: 6, title: 5 } as const;

const rowFull = (y: number) => box({ x: COL_X, y, w: COL_W, h: ROW_H });
const rowLeft = (y: number) => box({ x: COL_X, y, w: HALF_W, h: ROW_H });
const rowRight = (y: number) =>
  box({ x: COL_X + HALF_W + COL_GAP, y, w: HALF_W, h: ROW_H });

const EMPTY: RegistrationForm = {
  fullName: '',
  birthDate: '',
  cedula: '',
  email: '',
  city: '',
  phone: '',
};

/**
 * Validación exclusivamente de formato. No verifica identidad, no consulta
 * padrones y no persiste nada: el backend hará la validación real.
 */
function validate(form: RegistrationForm): Errors {
  const errors: Errors = {};

  if (!form.fullName.trim()) errors.fullName = 'Completá nombre y apellido.';
  else if (form.fullName.trim().length < 3) errors.fullName = 'Nombre demasiado corto.';

  if (!form.birthDate) errors.birthDate = 'Indicá la fecha de nacimiento.';
  else {
    const age = completedAge(form.birthDate);
    if (age === null) errors.birthDate = 'Fecha inválida.';
    else if (age < 0) errors.birthDate = 'La fecha no puede ser futura.';
    else if (!isOfAge(form.birthDate)) {
      errors.birthDate = `El registro lo hace un tutor de ${MIN_AGE} años cumplidos.`;
    }
  }

  if (!form.cedula.trim()) errors.cedula = 'Ingresá el número de cédula.';
  else if (!/^[0-9.\-\s]{5,15}$/.test(form.cedula.trim())) errors.cedula = 'Formato de cédula inválido.';

  if (!form.email.trim()) errors.email = 'Ingresá un email.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Email inválido.';

  if (!form.city.trim()) errors.city = 'Indicá tu ciudad.';

  if (!form.phone.trim()) errors.phone = 'Ingresá un teléfono.';
  else if (!/^[0-9+\-\s()]{6,20}$/.test(form.phone.trim())) errors.phone = 'Teléfono inválido.';

  return errors;
}

/** REGISTRO — Figma 17:2912. */
export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setParticipant } = useSession();
  const { redeem } = useCodeFlow();
  const prefill = (location.state ?? {}) as { cedula?: string; code?: string };

  const [form, setForm] = useState<RegistrationForm>({ ...EMPTY, cedula: prefill.cedula ?? '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof RegistrationForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    // El error se borra apenas el usuario retoca el campo; se vuelve a evaluar
    // al enviar. Si no, queda un cartel rojo contradiciendo lo que ya corrigió.
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await promoApi.registerParticipant(form);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      return;
    }

    setParticipant(result.participant ?? { cedula: form.cedula, fullName: form.fullName });

    /* La mecánica (lámina 2) va del registro derecho al resultado: el código ya
       lo escribió en la pantalla anterior y no se le puede pedir que lo cargue
       de nuevo. Si llegó al registro sin código —entrando por la URL— no hay
       nada que canjear y se lo manda a cargarlo. */
    if (prefill.code) {
      await redeem(form.cedula, prefill.code.trim().toUpperCase());
      return;
    }
    navigate('/participar', { state: { cedula: form.cedula } });
  };

  const fieldEls = [
    <ParchmentField
      key="fullName"
      variant="line"
      fontSize={30}
      label="Nombre y Apellido"
      data-figma="73:626" data-figma-ejes="x,y"
      name="fullName"
      autoComplete="name"
      value={form.fullName}
      onChange={set('fullName')}
      error={errors.fullName}
      required
    />,
    <ParchmentField
      key="birthDate"
      variant="line"
      fontSize={30}
      label="Fecha de nacimiento"
      data-figma="73:627" data-figma-ejes="x,y"
      name="birthDate"
      type="date"
      autoComplete="bday"
      max={maxBirthDate()}
      value={form.birthDate}
      onChange={set('birthDate')}
      error={errors.birthDate}
      required
    />,
    <ParchmentField
      key="cedula"
      variant="line"
      fontSize={30}
      label="Número de cédula"
      data-figma="73:634" data-figma-ejes="x,y"
      name="cedula"
      inputMode="numeric"
      value={form.cedula}
      onChange={set('cedula')}
      error={errors.cedula}
      required
    />,
    <ParchmentField
      key="email"
      variant="line"
      fontSize={30}
      label="Email"
      data-figma="73:630" data-figma-ejes="x,y"
      name="email"
      type="email"
      autoComplete="email"
      value={form.email}
      onChange={set('email')}
      error={errors.email}
      required
    />,
    <ParchmentField
      key="city"
      variant="line"
      fontSize={30}
      label="Ciudad"
      data-figma="73:637" data-figma-ejes="x,y"
      name="city"
      autoComplete="address-level2"
      value={form.city}
      onChange={set('city')}
      error={errors.city}
      required
    />,
    <ParchmentField
      key="phone"
      variant="line"
      fontSize={30}
      label="Teléfono"
      data-figma="73:640" data-figma-ejes="x,y"
      name="phone"
      type="tel"
      autoComplete="tel"
      value={form.phone}
      onChange={set('phone')}
      error={errors.phone}
      required
    />,
  ];

  return (
    <Stage
      title="Registro"
      compactMenu
      /* `CODIGO 1` (73:552): mismo encuadre que el landing. */
      mobileCielo={{ nodo: '73:552', x: -46, y: -38, w: 493, h: 1070 }}
      mobile={
        <RegisterMobile
          fields={fieldEls}
          onSubmit={onSubmit}
          onCancel={() => navigate('/participar')}
          submitting={submitting}
        />
      }
    >
      <Deco src={destello} x={134} y={-50} w={745} h={494} opacity={0.85}
        float={{ amplitude: 9, duration: 5.4 }} />
      <Deco src={planetaVit1} x={-130} y={792} w={339} h={166} blur={5} opacity={0.9}
        float={{ amplitude: 6, duration: 6.8, drift: 5 }} />
      <Deco src={planetaVit2} x={1525} y={-96} w={395} h={428} blur={5} opacity={0.8}
        float={{ amplitude: 7, duration: 7.2, delay: 1 }} />

      <Deco src={pergamino1} x={347} y={253} w={1226} h={780} zIndex={2} />

      <Deco src={dino} x={1492} y={393} w={474} h={798} zIndex={3}
        float={{ amplitude: 8, duration: 4.8, delay: 0.3, rotate: 1.2 }} />
      <Deco src={nena} x={36} y={487} w={359} h={793} zIndex={3}
        float={{ amplitude: 7, duration: 5.6, delay: 0.9, rotate: -1.2 }} />
      <Deco src={pluma} x={1392} y={712} w={287} h={388} zIndex={4}
        float={{ amplitude: 10, duration: 4.2, delay: 1.6, rotate: 3 }} />

      <Deco src={logoCodigos} x={749} y={100} w={395} h={294} zIndex={4}
        glow="0 0 2.4cqw #09eaff" float={{ amplitude: 6, duration: 5.2 }} />

      <form className="register__form" onSubmit={onSubmit} noValidate id="contenido">
        <RibbonPlate
          tone="ochre"
          className="register__title-plate abs"
          style={{
            left: u(960),
            top: u(FORM.titleY),
            width: u(COL_W),
            height: u(ROW_H),
            zIndex: Z.title,
          }}
        >
          <h2 className="register__title" style={{ fontSize: u(42) }}>
            Registrate para que tu pequeño pueda participar
          </h2>
        </RibbonPlate>

        <RibbonPlate className="register__field abs" style={{ ...rowFull(FORM.row1), zIndex: Z.row1 }}>
          {fieldEls[0]}
        </RibbonPlate>
        <RibbonPlate className="register__field abs" style={{ ...rowLeft(FORM.row2), zIndex: Z.row2 }}>
          {fieldEls[1]}
        </RibbonPlate>
        <RibbonPlate className="register__field abs" style={{ ...rowRight(FORM.row2), zIndex: Z.row2 }}>
          {fieldEls[2]}
        </RibbonPlate>

        <p
          className="abs register__note"
          style={{ ...centeredText(960, FORM.noteY, 25), zIndex: Z.note }}
        >
          Este registro debe ser realizado por un tutor mayor de 18 años*
        </p>

        <RibbonPlate className="register__field abs" style={{ ...rowFull(FORM.row3), zIndex: Z.row3 }}>
          {fieldEls[3]}
        </RibbonPlate>
        <RibbonPlate className="register__field abs" style={{ ...rowLeft(FORM.row4), zIndex: Z.row4 }}>
          {fieldEls[4]}
        </RibbonPlate>
        <RibbonPlate className="register__field abs" style={{ ...rowRight(FORM.row4), zIndex: Z.row4 }}>
          {fieldEls[5]}
        </RibbonPlate>

        <RibbonButton
          type="submit"
          tone="ochre"
          className="abs"
          width={296}
          height={58}
          fontSize={40}
          disabled={submitting}
          style={{ left: u(646), top: u(FORM.buttonsY), zIndex: Z.buttons }}
        >
          {submitting ? 'Enviando…' : 'Registrarme'}
        </RibbonButton>

        <RibbonButton
          type="button"
          tone="ochre"
          className="abs"
          width={296}
          height={58}
          fontSize={40}
          onClick={() => navigate('/participar')}
          style={{ left: u(955), top: u(FORM.buttonsY), zIndex: Z.buttons }}
        >
          Cancelar
        </RibbonButton>
      </form>
    </Stage>
  );
}

interface RegisterMobileProps {
  fields: React.ReactElement[];
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
}

/* --------------------------------------------------------------------------
   Composición mobile — Figma "Registro.png" (402x913).

   Medidas del mockup, en coordenadas crudas del frame —el descuento de la
   barra de estado lo hace el contenedor, ver `layout/mobile-stage.css`—:
     pergamino    x 35..368   y 151..661   (333x510)
     logo         montado sobre el borde superior del pergamino
     dino         asomando arriba a la derecha
     nena         asomando abajo a la izquierda
     filas        nombre (entero) · fecha + cédula · nota · email (entero) ·
                  ciudad + teléfono · botones

   La nota va ENTRE la fila de cédula y la de email, igual que en el diseño, así
   que la grilla se parte en dos bloques en vez de recorrer `fields` de corrido.
   -------------------------------------------------------------------------- */
function RegisterMobile({ fields, onSubmit, onCancel, submitting }: RegisterMobileProps) {
  const [fullName, birthDate, cedula, email, city, phone] = fields;

  return (
    <div
      className="register-m"
      id="contenido"
      data-figma="73:551"
      data-figma-ejes="x,w"
      /* Igual que en el landing: el relleno del frame va debajo de la foto. */
      data-figma-omitir="pintura"
    >
      {/* B3 en la esquina superior derecha. Caja medida sobre
          `recursos/mobile/pantallas/Registro.png`: [315, 14, 87, 87]. No se
          copian las coordenadas del Home: cada pantalla usa su propio export. */}
      <img
        src={planetaVit2}
        alt=""
        aria-hidden="true"
        className="register-m__b3"
        data-figma="73:604"
      />

      {/* Decoración de fondo del frame que faltaba en la composición: el
          destello contra el borde izquierdo y el planeta chico, desenfocado,
          abajo a la derecha. */}
      <img
        src={destello}
        alt=""
        aria-hidden="true"
        className="register-m__flare"
        data-figma="73:559"
      />
      <img
        src={planetaVit1}
        alt=""
        aria-hidden="true"
        className="register-m__planeta"
        data-figma="73:561"
      />

      {/* `.register-m__sheet` es la caja de referencia del formulario —todo lo
          de adentro va en porcentaje de ella— y no puede girar. La capa del
          Figma es el papel, así que la marca va en la imagen: ahí el giro lo
          hace el CSS y `figma:check` puede comparar las cuatro medidas. */}
      <div className="register-m__sheet">
        <img
          src={pergamino1}
          alt=""
          aria-hidden="true"
          className="register-m__paper"
          data-figma="73:606"
        />

        <FloatingLayer amplitude={5} duration={6.4} delay={0.3}
          className="register-m__dino" style={{ position: 'absolute' }} data-figma="73:608">
          <img src={dino} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <FloatingLayer amplitude={4} duration={7.2} delay={1.1}
          className="register-m__nena" style={{ position: 'absolute' }} data-figma="73:610">
          <img src={nena} alt="" aria-hidden="true" className="mlayer-img" />
        </FloatingLayer>

        <img
          src={logoCodigos}
          alt="Códigos Secretos 2026"
          className="register-m__logo"
          data-figma="73:553"
        />

        <form className="register-m__form" onSubmit={onSubmit} noValidate>
          {/* El titular son TRES nodos, no uno: una cinta por renglón —`Vector 14`
              (73:614) y `Vector 15` (73:643), en x/y y anchos distintos— y el
              texto encima (73:616). Antes iba en un solo `RibbonPlate`, que las
              fusionaba en una silueta recortada con clip-path: las dos cintas
              del diseño quedaban sin caja que comparar y el reporte no las veía.
              Ahora cada una es su propio SVG, bajado de su nodo, con su marca.

              `data-figma-omitir="fondo"`: el `#D8831C` viaja dentro del SVG, que
              es el export exacto del nodo, así que el color es el del diseño por
              construcción y no hay `background-color` que comparar. */}
          <img
            src={cintaTitulo1}
            alt=""
            aria-hidden="true"
            className="register-m__title-cinta register-m__title-cinta--1"
            data-figma="73:614"
            data-figma-omitir="fondo"
          />
          <img
            src={cintaTitulo2}
            alt=""
            aria-hidden="true"
            className="register-m__title-cinta register-m__title-cinta--2"
            data-figma="73:643"
            data-figma-omitir="fondo"
          />

          {/* Dos renglones, como en el diseño: el nodo 73:616 trae el salto
              explícito («Registrate para que tu pequeño ⏎ pueda participar») y
              cada renglón se apoya en su cinta. */}
          <h2 className="register-m__title" data-figma="73:616">
            Registrate para que tu pequeño
            <br />
            pueda participar
          </h2>

          {/* Cada fila en su coordenada del Figma; el orden del DOM es el de
              lectura, que es también el orden de tabulación. */}
          <RibbonPlate className="register-m__cell register-m__cell--fullname" data-figma="73:613">
            {fullName}
          </RibbonPlate>
          <RibbonPlate className="register-m__cell register-m__cell--birth" data-figma="73:612">
            {birthDate}
          </RibbonPlate>
          <RibbonPlate className="register-m__cell register-m__cell--cedula" data-figma="73:633">
            {cedula}
          </RibbonPlate>

          {/* `data-figma-ejes="x,y,w"`: el aviso va en 11 px y no en los 8 del
              Figma —es el piso de texto legible, ver `register.css`— así que
              corta en dos renglones y mide más alto que su nodo. Los otros tres
              ejes se siguen verificando. */}
          <p className="register-m__note" data-figma="73:617" data-figma-ejes="x,y,w">
            Este registro debe ser realizado por un tutor mayor de 18 años*
          </p>

          <RibbonPlate className="register-m__cell register-m__cell--email" data-figma="73:629">
            {email}
          </RibbonPlate>
          <RibbonPlate className="register-m__cell register-m__cell--city" data-figma="73:636">
            {city}
          </RibbonPlate>
          <RibbonPlate className="register-m__cell register-m__cell--phone" data-figma="73:639">
            {phone}
          </RibbonPlate>

          <div className="register-m__actions">
            <RibbonButton
              type="submit"
              tone="ochre"
              mobileFontSize={14}
              disabled={submitting}
              data-figma="73:620"
            >
              {submitting ? 'Enviando…' : 'Registrarme'}
            </RibbonButton>
            <RibbonButton
              type="button"
              tone="ochre"
              mobileFontSize={14}
              onClick={onCancel}
              data-figma="73:623"
            >
              Cancelar
            </RibbonButton>
          </div>
        </form>
      </div>
    </div>
  );
}
