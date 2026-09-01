import type { PromoCodeStatus } from '../types/promo';

/** Traduce y valida la respuesta real del backend antes de usarla en la UI. */
export type MotivoRespuestaInvalida =
  | 'cuerpo-no-es-objeto'
  | 'falta-resultado'
  | 'shortMessage-no-es-texto'
  | 'shortMessage-vacio'
  | 'coupons-invalido'
  | 'status-invalido'
  | 'codeCount-invalido'
  | 'premio-formato-invalido'
  | 'premio-id-fuera-de-rango'
  | 'estado-desconocido'
  | 'contratos-en-conflicto'
  | 'error-del-backend';

export interface PremioLeido {
  id: string;
  name: string;
}

type EstadoDelBackend = Exclude<PromoCodeStatus, 'REGISTER_REQUIRED'>;

export type LecturaCanje =
  | {
      ok: true;
      status: EstadoDelBackend;
      premio?: PremioLeido;
      coupons?: number;
    }
  | { ok: false; motivo: MotivoRespuestaInvalida; diagnostico: string };

const ESTADOS_SHORT_MESSAGE: Readonly<Record<string, EstadoDelBackend>> = {
  invalido: 'CODE_NOT_FOUND',
  repetido: 'CODE_ALREADY_USED',
  participacion: 'LOSE',
  limite: 'RATE_LIMITED',
};

const ESTADOS_LEGACY = new Set<EstadoDelBackend>([
  'WIN',
  'LOSE',
  'CODE_ALREADY_USED',
  'CODE_NOT_FOUND',
  'RATE_LIMITED',
]);

const FORMATO_PREMIO = /^premio-(\d+)-(.+)$/i;
const ID_PREMIO_MIN = 0;
const ID_PREMIO_MAX = 19;

const fallo = (
  motivo: MotivoRespuestaInvalida,
  diagnostico: string,
): LecturaCanje => ({ ok: false, motivo, diagnostico });

/**
 * El contrato confirmado usa `{ shortMessage, coupons }`. Durante la transición
 * también se admite la respuesta anterior `{ status, codeCount, prize }` para
 * no romper un backend que todavía la exponga. Si llegan las dos y se
 * contradicen, se rechaza la respuesta en vez de mostrar un resultado erróneo.
 */
export function interpretarRespuestaCanje(cuerpo: unknown): LecturaCanje {
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return fallo('cuerpo-no-es-objeto', `se recibió ${describir(cuerpo)}`);
  }

  const datos = cuerpo as Record<string, unknown>;
  const tieneShortMessage = 'shortMessage' in datos;
  const tieneStatus = 'status' in datos;

  if (!tieneShortMessage && !tieneStatus) {
    return fallo('falta-resultado', `campos recibidos: ${Object.keys(datos).join(', ') || '(ninguno)'}`);
  }

  const actual = tieneShortMessage ? interpretarContratoActual(datos) : undefined;
  const anterior = tieneStatus ? interpretarContratoAnterior(datos) : undefined;

  if (actual && !actual.ok) return actual;
  if (anterior && !anterior.ok) return anterior;

  if (actual?.ok && anterior?.ok) {
    const contadorDistinto =
      actual.coupons !== undefined &&
      anterior.coupons !== undefined &&
      actual.coupons !== anterior.coupons;
    const premioDistinto =
      actual.premio?.id !== undefined &&
      anterior.premio?.id !== undefined &&
      actual.premio.id !== anterior.premio.id;

    if (actual.status !== anterior.status || contadorDistinto || premioDistinto) {
      return fallo('contratos-en-conflicto', 'shortMessage y status describen resultados diferentes');
    }

    return {
      ...actual,
      coupons: actual.coupons ?? anterior.coupons,
      premio: actual.premio ?? anterior.premio,
    };
  }

  return actual ?? anterior ?? fallo('falta-resultado', 'respuesta vacía');
}

function interpretarContratoActual(datos: Record<string, unknown>): LecturaCanje {
  if (typeof datos.shortMessage !== 'string') {
    return fallo('shortMessage-no-es-texto', `shortMessage llegó como ${describir(datos.shortMessage)}`);
  }

  const texto = datos.shortMessage.trim();
  if (!texto) return fallo('shortMessage-vacio', 'shortMessage venía vacío');

  const contador = leerContador(datos.coupons, 'coupons-invalido');
  if (!contador.ok) return contador;

  const clave = texto.toLowerCase();
  if (clave === 'error') {
    return fallo('error-del-backend', 'el backend respondió shortMessage="error"');
  }

  if (clave.startsWith('premio-')) {
    const premio = leerPremioDesdeTexto(texto);
    if (!premio.ok) return premio;
    return { ok: true, status: 'WIN', premio: premio.premio, coupons: contador.valor };
  }

  const status = ESTADOS_SHORT_MESSAGE[clave];
  if (!status) return fallo('estado-desconocido', `shortMessage="${texto}" no está en el contrato`);
  return { ok: true, status, coupons: contador.valor };
}

function interpretarContratoAnterior(datos: Record<string, unknown>): LecturaCanje {
  if (typeof datos.status !== 'string' || !ESTADOS_LEGACY.has(datos.status as EstadoDelBackend)) {
    return fallo('status-invalido', `status llegó como ${describir(datos.status)}`);
  }

  const contador = leerContador(datos.codeCount, 'codeCount-invalido');
  if (!contador.ok) return contador;
  const status = datos.status as EstadoDelBackend;

  if (status !== 'WIN') return { ok: true, status, coupons: contador.valor };

  if (typeof datos.prize !== 'object' || datos.prize === null || Array.isArray(datos.prize)) {
    return fallo('premio-formato-invalido', 'WIN llegó sin un objeto prize');
  }
  const prize = datos.prize as Record<string, unknown>;
  const premio = validarPremio(prize.id, prize.name);
  if (!premio.ok) return premio;
  return { ok: true, status, premio: premio.premio, coupons: contador.valor };
}

type LecturaContador =
  | { ok: true; valor?: number }
  | { ok: false; motivo: MotivoRespuestaInvalida; diagnostico: string };

function leerContador(
  valor: unknown,
  motivo: 'coupons-invalido' | 'codeCount-invalido',
): LecturaContador {
  if (valor === undefined || valor === null) return { ok: true };
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    return { ok: false, motivo, diagnostico: `contador inválido: ${String(valor)}` };
  }
  return { ok: true, valor };
}

type LecturaPremio =
  | { ok: true; premio: PremioLeido }
  | { ok: false; motivo: MotivoRespuestaInvalida; diagnostico: string };

function leerPremioDesdeTexto(texto: string): LecturaPremio {
  const partes = FORMATO_PREMIO.exec(texto);
  if (!partes) {
    return { ok: false, motivo: 'premio-formato-invalido', diagnostico: 'se esperaba premio-<id>-<nombre>' };
  }
  return validarPremio(partes[1], partes[2]);
}

function validarPremio(idCrudo: unknown, nombreCrudo: unknown): LecturaPremio {
  const idTexto = typeof idCrudo === 'number' ? String(idCrudo) : idCrudo;
  if (typeof idTexto !== 'string' || typeof nombreCrudo !== 'string' || !nombreCrudo.trim()) {
    return { ok: false, motivo: 'premio-formato-invalido', diagnostico: 'id o nombre de premio inválido' };
  }
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id < ID_PREMIO_MIN || id > ID_PREMIO_MAX) {
    return {
      ok: false,
      motivo: 'premio-id-fuera-de-rango',
      diagnostico: `id ${idTexto} fuera de ${ID_PREMIO_MIN}-${ID_PREMIO_MAX}`,
    };
  }
  return { ok: true, premio: { id: String(id), name: nombreCrudo.trim() } };
}

function describir(valor: unknown): string {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return `un array de ${valor.length}`;
  return typeof valor;
}

export type TipoErrorCanje =
  | 'conectividad'
  | 'recaptcha-rechazado'
  | 'limite-http'
  | 'respuesta-ilegible'
  | 'http'
  | 'backend-reportado'
  | 'contrato';

export class ErrorCanje extends Error {
  readonly tipo: TipoErrorCanje;
  readonly estadoHttp?: number;
  readonly motivo?: MotivoRespuestaInvalida;

  constructor(
    tipo: TipoErrorCanje,
    mensaje: string,
    extra?: { estadoHttp?: number; motivo?: MotivoRespuestaInvalida },
  ) {
    super(mensaje);
    this.name = 'ErrorCanje';
    this.tipo = tipo;
    this.estadoHttp = extra?.estadoHttp;
    this.motivo = extra?.motivo;
  }
}
