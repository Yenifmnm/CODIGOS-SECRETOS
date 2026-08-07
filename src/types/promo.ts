/**
 * Contratos de dominio de la promo.
 * -------------------------------------------------------------------------
 * ESTE ARCHIVO ES LA FRONTERA CON EL BACKEND.
 * El equipo de backend implementa `PromoApi` (ver services/promoApi.ts) contra
 * estos tipos. Las pantallas NUNCA deciden reglas de negocio: sólo consumen
 * `PromoCodeResult` y renderizan.
 */

export type Cedula = string;

export interface Participant {
  cedula: Cedula;
  fullName: string;
  city?: string;
}

export interface RegistrationForm {
  fullName: string;
  birthDate: string; // ISO yyyy-mm-dd
  cedula: Cedula;
  email: string;
  city: string;
  phone: string;
}

export interface PromoCode {
  cedula: Cedula;
  code: string;
}

export interface Prize {
  id: string;
  name: string;
  /** URL del asset ya resuelto por el adapter. */
  image: string;
  /** Copy corto opcional para el carrusel. */
  caption?: string;
}

export interface UserCodeCount {
  cedula: Cedula;
  count: number;
}

/** Estados posibles que el backend puede devolver al cargar un código. */
export type PromoCodeStatus =
  | 'WIN'
  | 'LOSE'
  | 'CODE_ALREADY_USED'
  | 'CODE_NOT_FOUND'
  | 'REGISTER_REQUIRED';

export interface PromoCodeResult {
  status: PromoCodeStatus;
  /** Código tal como fue ingresado; se muestra en la pantalla de resultado. */
  code: string;
  /** Sólo presente cuando status === 'WIN'. */
  prize?: Prize;
  /** Contador de códigos cargados luego de esta operación. */
  codeCount: number;
  /** Mensaje opcional provisto por backend; si falta se usa el copy del diseño. */
  message?: string;
}

export interface ParticipantCheckResult {
  registered: boolean;
  participant?: Participant;
}

export interface RegistrationResult {
  ok: boolean;
  participant?: Participant;
  /** Errores por campo, para pintar feedback sin inventar reglas en el front. */
  fieldErrors?: Partial<Record<keyof RegistrationForm, string>>;
}

export interface Terms {
  /** El backend podrá enviar HTML sanitizado o texto plano. */
  termsHtml?: string;
  termsText?: string;
}

export interface SessionState {
  participant: Participant | null;
  codeCount: number;
  lastResult: PromoCodeResult | null;
  acceptedTerms: boolean;
}
