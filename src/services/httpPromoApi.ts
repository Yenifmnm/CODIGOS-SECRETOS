import type { PromoApi } from './promoApi';
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
import { MOCK_PRIZES, prizeByAvimovilId } from '../mocks/prizes';
import { getTermsText } from '../mocks/terms';
import { MIN_AGE, isOfAge } from '../app/age';

/**
 * Adapter real: habla con codigos-secretos-backend.
 * ---------------------------------------------------------------------------
 * El backend no tiene base de datos propia: reenvía cada canje a Avimovil con
 * los datos del participante como variables (nombre, telefono, email, cedula,
 * dob, localidad). Por eso este adapter guarda el registro en localStorage
 * —igual que la promo anterior— y lo manda completo en cada canje.
 *
 * Qué resuelve cada método:
 *   checkParticipant   localStorage (¿ya se registró en este navegador?)
 *   registerParticipant localStorage (no existe endpoint de registro; la regla
 *                       de edad mínima se valida acá, igual que en el mock)
 *   submitPromoCode    POST /api/codes/redeem con todos los datos
 *   getCodeCount       último contador conocido (viaja en cada respuesta)
 *   getPrizes/getTerms catálogo estático del bundle, igual que el mock
 */
export class HttpPromoApi implements PromoApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  // ------------------------------------------------------------------ HTTP

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // 403 = reCAPTCHA rechazado; el resto, errores del servidor. En ambos
      // casos se lanza: useCodeFlow ya muestra el mensaje de error genérico.
      throw new Error(`API ${path} respondió ${response.status}`);
    }
    return (await response.json()) as T;
  }

  // ------------------------------------------------- registro (localStorage)

  private storageKey(cedula: string): string {
    return `codigos-secretos:participant:${this.normalizeCedula(cedula)}`;
  }

  private normalizeCedula(cedula: string): string {
    return cedula.replace(/[.\-\s]/g, '');
  }

  private readStored(cedula: string): { form: RegistrationForm; codeCount: number } | null {
    try {
      const raw = localStorage.getItem(this.storageKey(cedula));
      if (!raw) return null;
      const data = JSON.parse(raw) as { form?: RegistrationForm; codeCount?: number };
      if (!data.form?.cedula) return null;
      return { form: data.form, codeCount: data.codeCount ?? 0 };
    } catch {
      return null;
    }
  }

  private writeStored(form: RegistrationForm, codeCount: number): void {
    try {
      localStorage.setItem(
        this.storageKey(form.cedula),
        JSON.stringify({ form, codeCount, savedAt: new Date().toISOString() }),
      );
    } catch {
      // Sin localStorage (modo privado, etc.) el flujo sigue: sólo se pierde
      // el recuerdo del registro y la persona vuelve a pasar por REGISTRO.
    }
  }

  // -------------------------------------------------------------- PromoApi

  async checkParticipant(cedula: string): Promise<ParticipantCheckResult> {
    const stored = this.readStored(cedula);
    if (!stored) return { registered: false };
    return {
      registered: true,
      participant: {
        cedula: stored.form.cedula,
        fullName: stored.form.fullName,
        city: stored.form.city,
      },
    };
  }

  async registerParticipant(form: RegistrationForm): Promise<RegistrationResult> {
    // Regla de la promo, no de la pantalla: sin backend de registro, la edad
    // mínima se valida acá para que el flujo se comporte igual que con el mock.
    if (!isOfAge(form.birthDate)) {
      return {
        ok: false,
        fieldErrors: {
          birthDate: `El registro lo hace un tutor de ${MIN_AGE} años cumplidos.`,
        },
      };
    }

    const previous = this.readStored(form.cedula);
    this.writeStored(form, previous?.codeCount ?? 0);
    return {
      ok: true,
      participant: { cedula: form.cedula, fullName: form.fullName, city: form.city },
    };
  }

  async submitPromoCode({ cedula, code, recaptchaToken }: PromoCode): Promise<PromoCodeResult> {
    const stored = this.readStored(cedula);
    if (!stored) {
      // Sin datos no hay canje: Avimovil los necesita en cada envío.
      return { status: 'REGISTER_REQUIRED', code, codeCount: 0 };
    }

    const { form } = stored;
    const result = await this.post<PromoCodeResult>('/api/codes/redeem', {
      cedula: form.cedula,
      code,
      recaptchaToken,
      nombre: form.fullName,
      telefono: form.phone,
      email: form.email,
      dob: form.birthDate,
      localidad: form.city,
    });

    if (typeof result.codeCount === 'number') {
      this.writeStored(form, result.codeCount);
    }
    return result.prize ? { ...result, prize: this.enrichPrize(result.prize) } : result;
  }

  /**
   * El backend devuelve el premio con el id de Avimovil y el nombre en crudo
   * (`{ id: '3', name: 'BICICLETA MILANO ARO 16' }`). Acá se cruza con el
   * catálogo local para resolver imagen, artículo y nombre comercial —los
   * assets viven en el bundle, no en el backend—.
   *
   * Si el id no está en el catálogo (p. ej. el premio de prueba, id 0), se
   * devuelve lo que vino: se muestra el nombre sin imagen, antes que un premio
   * equivocado.
   */
  private enrichPrize(prize: Prize): Prize {
    const avimovilId = Number(prize.id);
    if (Number.isInteger(avimovilId)) {
      const catalogPrize = prizeByAvimovilId(avimovilId);
      if (catalogPrize) return catalogPrize;
    }
    return prize;
  }

  async getCodeCount(cedula: string): Promise<UserCodeCount> {
    return { cedula, count: this.readStored(cedula)?.codeCount ?? 0 };
  }

  /** El catálogo y las bases siguen siendo estáticos del bundle, como el mock. */
  async getPrizes(): Promise<Prize[]> {
    return MOCK_PRIZES;
  }

  async getTerms(): Promise<Terms> {
    return { termsText: getTermsText() };
  }
}
