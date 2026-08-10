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
  const prize: Prize = lastResult?.prize ?? MOCK_PRIZES[0];

  return (
    <ResultLayout
      pageTitle="¡Felicidades! Ganaste"
      title="¡Felicidades"
      titleSize={138}
      titleTone="gold"
      titleY={457}
      message={[`te ganaste ${prize.article ?? 'un'} ${prize.name}!`]}
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
