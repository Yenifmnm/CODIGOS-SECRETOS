/**
 * Base de códigos de EJEMPLO.
 * -------------------------------------------------------------------------
 * Sustituye, sólo para la demo, a la tabla que el backend va a cargar en la
 * base de datos (los archivos `OT243586 PARTE 1/2_base.txt` de la mecánica).
 * Sirve para que el resultado dependa del código que se tipea y no de un
 * interruptor: exactamente el comportamiento que tendrá contra la base real.
 *
 * Cuando exista el backend, este archivo se borra: `HttpPromoApi` consultará la
 * tabla real y ninguna pantalla se entera del cambio.
 *
 * Reglas que reproduce:
 *   · el código no está en la base            -> CODE_NOT_FOUND
 *   · está y ya fue canjeado                  -> CODE_ALREADY_USED
 *   · está y es la primera vez, no premiado   -> LOSE
 *   · está y es la primera vez, premiado      -> WIN + premio asignado
 */

export type CodeOutcome = 'WIN' | 'LOSE';

export interface PromoCodeRecord {
  /** Siempre en mayúsculas y sin separadores. */
  code: string;
  outcome: CodeOutcome;
  /** id dentro de MOCK_PRIZES. Sólo para `outcome: 'WIN'`. */
  prizeId?: string;
  /**
   * Marca el código como ya canjeado desde el arranque, para poder mostrar el
   * estado "código utilizado" sin tener que cargarlo dos veces.
   */
  redeemed?: boolean;
}

export const MOCK_CODE_BASE: PromoCodeRecord[] = [
  // --- Premiados: uno por cada premio del catálogo -------------------------
  { code: 'PSNSW7K2M9X', outcome: 'WIN', prizeId: 'nintendo-switch' },
  { code: 'PSPS5B4T8LQ', outcome: 'WIN', prizeId: 'playstation-5' },
  { code: 'PSCAR3J6VN2', outcome: 'WIN', prizeId: 'viaje-caribe' },
  { code: 'PSBIC9D1RZ5', outcome: 'WIN', prizeId: 'bicicleta' },
  { code: 'PSAUR6H4KW8', outcome: 'WIN', prizeId: 'auriculares' },

  // --- Válidos sin premio --------------------------------------------------
  { code: 'QF3B8N6V2W5', outcome: 'LOSE' },
  { code: 'KD7M2P9XA41', outcome: 'LOSE' },
  { code: 'LR5T8W3ZC60', outcome: 'LOSE' },
  { code: 'NB2V6Y9QE73', outcome: 'LOSE' },
  { code: 'HG4K1S7MU82', outcome: 'LOSE' },
  { code: 'JT6R3F8DP49', outcome: 'LOSE' },
  { code: 'WC1X5G2NB76', outcome: 'LOSE' },
  { code: 'VM8L4H6TQ13', outcome: 'LOSE' },
  { code: 'YP9N2C5JK08', outcome: 'LOSE' },
  { code: 'DS3W7A1RF62', outcome: 'LOSE' },

  // --- Ya canjeados de fábrica --------------------------------------------
  { code: 'ABCDG847FR5', outcome: 'LOSE', redeemed: true },
  { code: 'ZX9Q4L2PT60', outcome: 'WIN', prizeId: 'playstation-5', redeemed: true },
];

/**
 * Normaliza como lo hará el backend: sin espacios ni separadores y en
 * mayúsculas, para que "psnsw 7k2-m9x" encuentre "PSNSW7K2M9X".
 */
export function normalizeCode(raw: string): string {
  return raw.replace(/[\s.-]/g, '').toUpperCase();
}

const INDEX = new Map(MOCK_CODE_BASE.map((r) => [r.code, r]));

/** `undefined` = el código no existe en la base. */
export function findCode(raw: string): PromoCodeRecord | undefined {
  return INDEX.get(normalizeCode(raw));
}

/** Códigos marcados como canjeados en la base inicial. */
export function seedRedeemed(): string[] {
  return MOCK_CODE_BASE.filter((r) => r.redeemed).map((r) => r.code);
}
