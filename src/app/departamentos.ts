/** Opciones solicitadas para el registro, incluida Asunción. Sin códigos numéricos. */
export const DEPARTAMENTOS = [
  'Asunción',
  'Concepción',
  'San Pedro',
  'Cordillera',
  'Guairá',
  'Caaguazú',
  'Caazapá',
  'Itapúa',
  'Misiones',
  'Paraguarí',
  'Alto Paraná',
  'Central',
  'Ñeembucú',
  'Amambay',
  'Canindeyú',
  'Presidente Hayes',
  'Boquerón',
  'Alto Paraguay',
] as const;

export function esDepartamento(value: string): boolean {
  return DEPARTAMENTOS.some(departamento => departamento === value);
}
