import { ResultLayout } from '../../components/promo/ResultLayout';
import { ClosedChestMobile } from '../../components/promo/ClosedChestMobile';
import { TreasureChest } from '../../components/promo/TreasureChest';
import { useSession } from '../../app/SessionContext';
import { box } from '../../app/stage';

/** CÓDIGO INEXISTENTE — Figma 131:131. */
export default function CodeNotFound() {
  const { lastResult, codeCount } = useSession();

  return (
    <ResultLayout
      pageTitle="Código fuera de órbita"
      title="¡Código fuera de órbita!"
      titleSize={86}
      /* El nodo dice 40 px; a ese cuerpo Chewy mide 376.3 contra los 341 de la
         caja. 36.2 dan los 341 exactos. El corrimiento vertical ahora sale del
         margen de la variante, no de un `top` relativo. */
      mobileTitleSize={36.2}
      mobileVariante="orbita"
      titleTone="outline"
      titleX={499}
      titleY={484}
      message={['Este código secreto no existe.', 'Ingresá uno nuevo para seguir avanzando.']}
      messageSize={34}
      messageWidth={620}
      messageY={616}
      ctaY={730}
      code={lastResult?.code}
      codeRedeemed={false}
      codeCount={codeCount}
      scene={
        <TreasureChest
          mode="idle"
          style={{ ...box({ x: 1161, y: 490, w: 444, h: 444 }), zIndex: 5 }}
        />
      }
      mobileScene={<ClosedChestMobile />}
    />
  );
}
