import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { promoApi } from '../services/promoApi';
import { useSession } from './SessionContext';
import type { PromoCodeStatus } from '../types/promo';

/** Cada estado que devuelve el backend tiene una pantalla del Figma. */
const ROUTE_BY_STATUS: Record<PromoCodeStatus, string> = {
  WIN: '/ganaste',
  LOSE: '/perdiste',
  CODE_ALREADY_USED: '/codigo-utilizado',
  CODE_NOT_FOUND: '/codigo-inexistente',
  REGISTER_REQUIRED: '/registro',
};

/**
 * Orquesta el flujo de participación.
 *
 * NO contiene ninguna regla de negocio: pregunta al adapter y navega a la
 * pantalla que corresponde al `status` recibido. Cuando exista `HttpPromoApi`
 * este hook no cambia.
 */
export function useCodeFlow() {
  const navigate = useNavigate();
  const { setParticipant, setLastResult } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (cedula: string, code: string) => {
      setLoading(true);
      setError(null);
      try {
        const check = await promoApi.checkParticipant(cedula);

        if (!check.registered) {
          // Aún no está registrado: el diseño manda a REGISTRO conservando el código.
          navigate('/registro', { state: { cedula, code } });
          return;
        }

        setParticipant(check.participant ?? { cedula, fullName: '' });

        const result = await promoApi.submitPromoCode({ cedula, code });
        setLastResult(result);

        if (result.status === 'REGISTER_REQUIRED') {
          navigate('/registro', { state: { cedula, code } });
          return;
        }

        navigate(ROUTE_BY_STATUS[result.status]);
      } catch {
        setError('No pudimos contactar la nave nodriza. Probá de nuevo en un momento.');
      } finally {
        setLoading(false);
      }
    },
    [navigate, setLastResult, setParticipant],
  );

  return { submit, loading, error };
}
