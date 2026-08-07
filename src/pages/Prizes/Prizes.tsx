import { useCallback, useEffect, useState } from 'react';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { PrizeCarousel } from '../../components/promo/PrizeCarousel';
import { promoApi } from '../../services/promoApi';
import { centeredText } from '../../app/stage';
import type { Prize } from '../../types/promo';
import './prizes.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';

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
      mobile={
        <div className="m-stack" id="contenido">
          <img src={logoCodigos} alt="Códigos Secretos 2026" className="m-logo" />
          {carousel}
          <p className="m-title">{activeName}</p>
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
