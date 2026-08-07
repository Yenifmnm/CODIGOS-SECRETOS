import type { ReactNode } from 'react';
import { StarField } from './StarField';
import fondoInicio from '../../assets/backgrounds/fondo-inicio.webp';

/**
 * Fondo galáctico compartido: el KV original del Figma ("fondo inicio 1") más
 * la lluvia de estrellas. Ambas capas son decorativas y no capturan el puntero.
 */
export function SpaceBackground({ children }: { children?: ReactNode }) {
  return (
    <>
      <img src={fondoInicio} alt="" aria-hidden="true" className="deco deco--cover"
        style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <StarField />
      {children}
    </>
  );
}

export { fondoInicio };
