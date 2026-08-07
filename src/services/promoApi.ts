import type {
  ParticipantCheckResult,
  Prize,
  PromoCode,
  PromoCodeResult,
  RegistrationForm,
  RegistrationResult,
  Terms,
  UserCodeCount,
} from '../types/promo';

/**
 * Contrato único entre el frontend y el backend.
 * -------------------------------------------------------------------------
 * Hoy resuelve `MockPromoApi`. Cuando exista el backend real, el otro equipo
 * implementa `HttpPromoApi` con la misma interfaz y sólo cambia la línea del
 * export de abajo. Ninguna pantalla se toca.
 */
export interface PromoApi {
  /** ¿Esta cédula ya está registrada? Define si mandamos a REGISTRO. */
  checkParticipant(cedula: string): Promise<ParticipantCheckResult>;
  registerParticipant(form: RegistrationForm): Promise<RegistrationResult>;
  /** Valida y consume el código. TODA la regla de premio vive del lado servidor. */
  submitPromoCode(input: PromoCode): Promise<PromoCodeResult>;
  getCodeCount(cedula: string): Promise<UserCodeCount>;
  getPrizes(): Promise<Prize[]>;
  getTerms(): Promise<Terms>;
}

export { MockPromoApi } from './mockPromoApi';

import { MockPromoApi } from './mockPromoApi';

/**
 * PUNTO DE SUSTITUCIÓN PARA BACKEND
 * ---------------------------------
 * Reemplazar por:  export const promoApi: PromoApi = new HttpPromoApi(baseUrl);
 */
export const promoApi: PromoApi = new MockPromoApi();
