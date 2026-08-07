import type { PromoApi } from './promoApi';
import type {
  ParticipantCheckResult,
  Prize,
  PromoCode,
  PromoCodeResult,
  PromoCodeStatus,
  RegistrationForm,
  RegistrationResult,
  Terms,
  UserCodeCount,
} from '../types/promo';
import { MOCK_LATENCY_MS, getScenario } from '../mocks/scenarios';
import { MOCK_PRIZES } from '../mocks/prizes';

const delay = (ms = MOCK_LATENCY_MS) => new Promise<void>((r) => setTimeout(r, ms));

/** Rotación usada por el escenario AUTO para recorrer todos los estados. */
const AUTO_CYCLE: PromoCodeStatus[] = ['WIN', 'LOSE', 'CODE_ALREADY_USED', 'CODE_NOT_FOUND'];

/**
 * Adapter de desarrollo. No implementa ninguna regla de negocio real:
 * el estado devuelto lo decide `mocks/scenarios.ts`, no el contenido del código.
 */
export class MockPromoApi implements PromoApi {
  private registered = new Set<string>();
  private counts = new Map<string, number>();
  private autoIndex = 0;

  async checkParticipant(cedula: string): Promise<ParticipantCheckResult> {
    await delay(400);
    if (getScenario() === 'REGISTER_REQUIRED') return { registered: false };
    if (!this.registered.has(cedula)) return { registered: false };
    return {
      registered: true,
      participant: { cedula, fullName: 'Pequeño pirata' },
    };
  }

  async registerParticipant(form: RegistrationForm): Promise<RegistrationResult> {
    await delay();
    this.registered.add(form.cedula);
    this.counts.set(form.cedula, this.counts.get(form.cedula) ?? 0);
    return {
      ok: true,
      participant: { cedula: form.cedula, fullName: form.fullName, city: form.city },
    };
  }

  async submitPromoCode({ cedula, code }: PromoCode): Promise<PromoCodeResult> {
    await delay();

    const scenario = getScenario();
    const status: PromoCodeStatus =
      scenario === 'AUTO' ? AUTO_CYCLE[this.autoIndex++ % AUTO_CYCLE.length] : scenario;

    // Sólo los códigos efectivamente consumidos suman al contador.
    const consumed = status === 'WIN' || status === 'LOSE';
    const next = (this.counts.get(cedula) ?? 0) + (consumed ? 1 : 0);
    this.counts.set(cedula, next);

    return {
      status,
      code,
      codeCount: next,
      prize: status === 'WIN' ? this.pickPreviewPrize() : undefined,
    };
  }

  async getCodeCount(cedula: string): Promise<UserCodeCount> {
    await delay(200);
    return { cedula, count: this.counts.get(cedula) ?? 0 };
  }

  async getPrizes(): Promise<Prize[]> {
    await delay(200);
    return MOCK_PRIZES;
  }

  async getTerms(): Promise<Terms> {
    await delay(200);
    return {
      termsText: [
        'Promoción “El Tesoro Galáctico de los Códigos Secretos 2026” válida en todo el territorio nacional.',
        'Participan los productos PuroSol identificados con sticker promocional. Cada sticker contiene un código secreto de un único uso.',
        'El registro debe ser realizado por un tutor mayor de 18 años, quien será responsable de la participación del menor.',
        'Los códigos ganadores deberán conservarse físicamente: el sticker original es el comprobante para el canje del premio.',
        'Para retirar el premio, comunicarse al +595 984 324 335 dentro de los plazos establecidos por la organización.',
        'La participación implica la aceptación total de estas bases y condiciones.',
        // TEXTO PROVISORIO — el backend enviará `termsHtml` / `termsText` definitivo.
      ].join('\n\n'),
    };
  }

  /** Elige un premio del catálogo mock. NO representa una regla de sorteo. */
  private pickPreviewPrize(): Prize {
    return MOCK_PRIZES[Math.floor(Math.random() * MOCK_PRIZES.length)];
  }
}
