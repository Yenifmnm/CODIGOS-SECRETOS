import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Participant, PromoCodeResult, SessionState } from '../types/promo';

/**
 * Estado de sesión SÓLO de UI (para poder navegar la demo).
 * No persiste datos personales: vive en memoria y se pierde al recargar.
 */
interface SessionContextValue extends SessionState {
  setParticipant: (p: Participant | null) => void;
  setLastResult: (r: PromoCodeResult | null) => void;
  setCodeCount: (n: number) => void;
  acceptTerms: () => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [codeCount, setCodeCount] = useState(0);
  const [lastResult, setLastResultState] = useState<PromoCodeResult | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const setLastResult = useCallback((r: PromoCodeResult | null) => {
    setLastResultState(r);
    if (r) setCodeCount(r.codeCount);
  }, []);

  const reset = useCallback(() => {
    setParticipant(null);
    setCodeCount(0);
    setLastResultState(null);
    setAcceptedTerms(false);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      participant,
      codeCount,
      lastResult,
      acceptedTerms,
      setParticipant,
      setLastResult,
      setCodeCount,
      acceptTerms: () => setAcceptedTerms(true),
      reset,
    }),
    [participant, codeCount, lastResult, acceptedTerms, setLastResult, reset],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
