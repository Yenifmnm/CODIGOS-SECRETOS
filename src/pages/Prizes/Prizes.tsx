import { useCallback, useEffect, useState } from 'react';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { PrizeCarousel } from '../../components/promo/PrizeCarousel';
import { promoApi } from '../../services/promoApi';
import { centeredText } from '../../app/stage';
import type { Prize } from '../../types/promo';
import './prizes.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import glow from '../../assets/effects/glow.webp';

/** PREMIOS — Figma 57:86. El catálogo llega de `promoApi.getPrizes()`. */
export default function Prizes() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [activeName, setActiveName] = useState('');

  useEffect(() => {
    let alive = true;
    promoApi.getPrizes().then((list) => {
      if (!alive) return;
      setPrizes(list);
      setActiveName(list[0]?.name ?? '');
    });
    return () => {
      alive = false;
    };
  }, []);

  const onActiveChange = useCallback((prize: Prize) => setActiveName(prize.name), []);

  const carousel = <PrizeCarousel prizes={prizes} onActiveChange={onActiveChange} />;

  return (
    <Stage
      title="Premios"
      mobileBg="halo"
      mobile={
        /* Figma "Premios.png": logo → carrusel con flechas → nombre del premio
           → tira de miniaturas. El carrusel ya trae swipe y flechas. */
        <div className="prizes-m" id="contenido">
          {/* Estela que barre por detrás del premio activo. Es el mismo asset
              que usa el reveal de GANASTE, no una aproximación en CSS. */}
          <img src={glow} alt="" aria-hidden="true" className="prizes-m__arc" />

          <img src={logoCodigos} alt="Códigos Secretos 2026" className="prizes-m__logo" />
          <PrizeCarousel
            prizes={prizes}
            onActiveChange={onActiveChange}
            withThumbs
            caption={activeName}
          />
        </div>
      }
    >
      <Deco src={logoCodigos} x={685} y={117} w={523} h={390} zIndex={4}
        glow="0 0 2.8cqw #09eaff" float={{ amplitude: 7, duration: 5.4 }} />

      <div id="contenido">{carousel}</div>

      <p className="t-display t-white-glow prizes__name abs" style={{ ...centeredText(959, 923, 80), zIndex: 6 }}>
        {activeName}
      </p>
    </Stage>
  );
}
