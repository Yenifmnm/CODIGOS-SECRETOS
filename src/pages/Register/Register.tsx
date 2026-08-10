import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { RibbonButton } from '../../components/buttons/RibbonButton';
import { RibbonPlate } from '../../components/promo/RibbonPlate';
import { ParchmentField } from '../../components/forms/ParchmentField';
import { promoApi } from '../../services/promoApi';
import { useSession } from '../../app/SessionContext';
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
    const d = new Date(form.birthDate);
    if (Number.isNaN(d.getTime())) errors.birthDate = 'Fecha inválida.';
    else if (d > new Date()) errors.birthDate = 'La fecha no puede ser futura.';
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
    // Vuelve a la carga de código conservando el que venía escribiendo.
    navigate('/participar', { state: { cedula: form.cedula, code: prefill.code } });
  };

  const fieldEls = [
    <ParchmentField
      key="fullName"
      variant="line"
      fontSize={30}
      label="Nombre y Apellido"
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
      name="birthDate"
      type="date"
      autoComplete="bday"
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
        {/* El Figma pide 42px, pero está dibujado con "DK Prince Frog", que es
            condensada. Con la sustituta Chewy ese cuerpo no entra en la cinta
            (+15% de ancho), así que se baja a 36 para respetar el ancho de la
            columna. Cuando se incorpore la tipografía licenciada (ver
            public/fonts/README.md) se vuelve a 42. */}
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
          <h2 className="register__title" style={{ fontSize: u(36) }}>
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

function RegisterMobile({ fields, onSubmit, onCancel, submitting }: RegisterMobileProps) {
  return (
    <div className="m-stack" id="contenido">
      <img src={logoCodigos} alt="Códigos Secretos 2026" className="m-logo m-logo--sm" />

      <form className="register__form register__form--mobile" onSubmit={onSubmit} noValidate>
        <RibbonPlate tone="ochre" className="register__title-plate">
          <h2 className="register__title">Registrate para que tu pequeño pueda participar</h2>
        </RibbonPlate>

        <div className="register__grid">
          {fields.map((field) => (
            <RibbonPlate key={field.key} className="register__field">
              {field}
            </RibbonPlate>
          ))}
        </div>

        <p className="register__note">
          Este registro debe ser realizado por un tutor mayor de 18 años*
        </p>
        <div className="m-row">
          <RibbonButton type="submit" tone="ochre" fontSize={40} disabled={submitting}>
            {submitting ? 'Enviando…' : 'Registrarme'}
          </RibbonButton>
          <RibbonButton type="button" tone="ochre" fontSize={40} onClick={onCancel}>
            Cancelar
          </RibbonButton>
        </div>
      </form>

      <div className="m-row" aria-hidden="true">
        <img src={nena} alt="" style={{ width: 108 }} />
        <img src={dino} alt="" style={{ width: 118 }} />
      </div>
    </div>
  );
}
