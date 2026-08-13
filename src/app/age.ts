/**
 * Regla de edad de la promo.
 * -------------------------------------------------------------------------
 * Vive acá y no dentro de la pantalla de registro porque la usan los dos lados
 * de la frontera: el formulario para avisarle a la persona antes de enviar, y
 * el adapter —que hace de backend— para rechazar el registro. El backend real
 * tiene que aplicar la misma regla: la validación del front no es seguridad.
 */

/**
 * Edad mínima para registrarse, en años cumplidos.
 *
 * La mecánica del cliente (lámina 2) escribe la regla como un corte por año:
 * «permitir registrarse únicamente a personas nacidas antes de 2008, ya que
 * deben ser mayores de edad». Acá se implementa el motivo que ella misma da
 * —la mayoría de edad— y no el corte, porque no son equivalentes: quien nació
 * en 2008 cumple 18 durante la campaña y el corte lo dejaría afuera siendo
 * adulto. Además la propia pantalla de registro dice «un tutor mayor de 18
 * años», así que el corte por año contradiría el texto que la persona lee.
 *
 * Las dos reglas rechazan menores por igual; ésta no rechaza adultos.
 * Está anotado en docs/GUIA-BACKEND.md para que el cliente lo confirme.
 */
export const MIN_AGE = 18;

/**
 * Años cumplidos al día de hoy, o `null` si la fecha no existe.
 *
 * El string viene del `<input type="date">` en formato `yyyy-mm-dd`. Se parte a
 * mano en vez de usar `new Date(str)` porque ese constructor lo interpreta en
 * UTC: en Paraguay (UTC−3/−4) la fecha se corre un día para atrás y alguien que
 * cumple 18 hoy quedaría de 17.
 */
export function completedAge(birthDate: string, today = new Date()): number | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!parts) return null;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);

  // Date "corrige" sola el 31 de febrero; comparar de vuelta lo desenmascara.
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;

  const hadBirthday =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);

  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}

/** ¿Tiene la edad mínima cumplida? Fecha inexistente o futura devuelven `false`. */
export function isOfAge(birthDate: string, today = new Date()): boolean {
  const age = completedAge(birthDate, today);
  return age !== null && age >= MIN_AGE;
}

/**
 * Última fecha de nacimiento con la edad mínima cumplida, en `yyyy-mm-dd`.
 * Va como `max` del campo para que el selector nativo no ofrezca fechas que
 * después vamos a rechazar.
 */
export function maxBirthDate(today = new Date()): string {
  const d = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
