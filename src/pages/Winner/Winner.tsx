import { ResultLayout } from '../../components/promo/ResultLayout';
import { PrizeReveal } from '../../components/promo/PrizeReveal';
import { useSession } from '../../app/SessionContext';
import { MOCK_PRIZES } from '../../mocks/prizes';
import type { Prize } from '../../types/promo';
import { Sparkles } from '../../components/effects/Sparkles';

/**
 * GANASTE — Figma 23:3081.
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
      mobileScene={
        <div className="m-chest" style={{ display: 'grid', placeItems: 'center' }}>
          <img
            src={prize.image}
            alt={prize.name}
            style={{
              width: '86%',
              filter: 'drop-shadow(0 0 18px #fff) drop-shadow(0 0 44px var(--c-gold))',
            }}
          />
          <Sparkles count={14} spread={44} />
        </div>
      }
    />
  );
}
