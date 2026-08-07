import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { RibbonButton } from '../../components/buttons/RibbonButton';
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

  const set = (key: keyof RegistrationForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
        <h2
          className="register__title abs"
          style={{ ...centeredText(961, 382, 42), zIndex: 5 }}
        >
          Registrate para que tu pequeño pueda participar
        </h2>

        <div className="abs register__field" style={{ ...box({ x: 606, y: 471, w: 703, h: 40 }), zIndex: 5 }}>
          {fieldEls[0]}
        </div>
        <div className="abs register__field" style={{ ...box({ x: 605, y: 560, w: 313, h: 40 }), zIndex: 5 }}>
          {fieldEls[1]}
        </div>
        <div className="abs register__field" style={{ ...box({ x: 1002, y: 560, w: 313, h: 40 }), zIndex: 5 }}>
          {fieldEls[2]}
        </div>

        <p className="abs register__note" style={{ ...centeredText(948, 636, 25), zIndex: 5 }}>
          Este registro debe ser realizado por un tutor mayor de 18 años*
        </p>

        <div className="abs register__field" style={{ ...box({ x: 606, y: 700, w: 703, h: 40 }), zIndex: 5 }}>
          {fieldEls[3]}
        </div>
        <div className="abs register__field" style={{ ...box({ x: 605, y: 786, w: 313, h: 40 }), zIndex: 5 }}>
          {fieldEls[4]}
        </div>
        <div className="abs register__field" style={{ ...box({ x: 1002, y: 786, w: 313, h: 40 }), zIndex: 5 }}>
          {fieldEls[5]}
        </div>

        <RibbonButton
          type="submit"
          className="abs"
          width={296}
          height={58}
          fontSize={40}
          disabled={submitting}
          style={{ left: u(646), top: u(863), zIndex: 6 }}
        >
          {submitting ? 'Enviando…' : 'Registrarme'}
        </RibbonButton>

        <RibbonButton
          type="button"
          tone="ghost"
          className="abs"
          width={296}
          height={58}
          fontSize={40}
          onClick={() => navigate('/participar')}
          style={{ left: u(955), top: u(863), zIndex: 6 }}
        >
          Cancelar
        </RibbonButton>
      </form>
    </Stage>
  );
}

interface RegisterMobileProps {
  fields: React.ReactNode;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
}

function RegisterMobile({ fields, onSubmit, onCancel, submitting }: RegisterMobileProps) {
  return (
    <div className="m-stack" id="contenido">
      <img src={logoCodigos} alt="Códigos Secretos 2026" className="m-logo m-logo--sm" />

      <form className="register__form register__form--mobile" onSubmit={onSubmit} noValidate>
        <h2 className="register__title">Registrate para que tu pequeño pueda participar</h2>
        <div className="register__grid">{fields}</div>
        <p className="register__note">
          Este registro debe ser realizado por un tutor mayor de 18 años*
        </p>
        <div className="m-row">
          <RibbonButton type="submit" fontSize={40} disabled={submitting}>
            {submitting ? 'Enviando…' : 'Registrarme'}
          </RibbonButton>
          <RibbonButton type="button" tone="ghost" fontSize={40} onClick={onCancel}>
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
