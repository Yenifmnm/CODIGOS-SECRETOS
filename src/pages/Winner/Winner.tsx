import { ResultLayout } from '../../components/promo/ResultLayout';
import { PrizeReveal } from '../../components/promo/PrizeReveal';
import { PrizeRevealMobile } from '../../components/promo/PrizeRevealMobile';
import { useSession } from '../../app/SessionContext';
import { MOCK_PRIZES } from '../../mocks/prizes';
import type { Prize } from '../../types/promo';

/**
 * GANASTE — Figma 23:3081 (desktop) y "ganaste.png" (mobile).
 * El premio y el código llegan del resultado devuelto por el adapter.
 */
export default function Winner() {
  const { lastResult, codeCount } = useSession();

  /* Dos situaciones distintas, y se resuelven distinto:
     - Sin resultado en sesión: nadie jugó, entraron directo a la URL (así la
       enlaza el recorrido del demo). Se muestra un premio del catálogo como
       muestra de la pantalla.
     - Con resultado pero sin `prize`: el backend devolvió WIN incompleto. Ahí
       NO se inventa un premio —mostrar el equivocado es peor que no mostrar
       ninguno—: se felicita sin nombrarlo y el panel ya trae el teléfono. */
  const prize: Prize | undefined = lastResult ? lastResult.prize : MOCK_PRIZES[0];

  return (
    <ResultLayout
      pageTitle="¡Felicidades! Ganaste"
      title="¡Felicidades"
      titleSize={138}
      titleTone="gold"
      titleY={457}
      message={[prize ? `te ganaste ${prize.article ?? 'un'} ${prize.name}!` : 'te ganaste un premio!']}
      messageSize={52}
      messageWidth={820}
      messageY={616}
      ctaY={711}
      code={lastResult?.code}
      codeRedeemed
      codeCount={codeCount}
      scene={<PrizeReveal prize={prize} />}
      mobileScene={<PrizeRevealMobile prize={prize} />}
    />
  );
}
