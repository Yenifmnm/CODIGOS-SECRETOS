import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { Parchment } from '../../components/promo/Parchment';
import { RibbonButton } from '../../components/buttons/RibbonButton';
import { promoApi } from '../../services/promoApi';
import { useSession } from '../../app/SessionContext';
import { box } from '../../app/stage';
import type { Terms as TermsData } from '../../types/promo';
import './terms.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import destello from '../../assets/effects/destello.webp';
import planetaVit1 from '../../assets/planets/planeta-vit-1.webp';
import ralph from '../../assets/characters/ralph.webp';
import nene from '../../assets/characters/nene.webp';

/** BASES Y CONDICIONES — Figma 22:3021. */
export default function Terms() {
  const navigate = useNavigate();
  const { acceptTerms } = useSession();
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    let alive = true;
    promoApi.getTerms().then((t) => alive && setTerms(t));
    return () => {
      alive = false;
    };
  }, []);

  const accept = () => {
    acceptTerms();
    navigate('/participar');
  };

  /**
   * El backend podrá enviar `termsHtml` (ya sanitizado) o `termsText`.
   * Mientras tanto se renderiza el texto provisorio del adapter mock.
   */
  const body = terms?.termsHtml ? (
    <div className="terms__body" dangerouslySetInnerHTML={{ __html: terms.termsHtml }} />
  ) : (
    <div className="terms__body">
      {(terms?.termsText ?? '').split('\n\n').map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );

  const content = (
    <>
      <p className="terms__heading">Bases y Condiciones</p>
      <div className="terms__scroll" tabIndex={0} role="region" aria-label="Texto de bases y condiciones">
        {body}
      </div>
      <RibbonButton className="terms__cta" width={328} height={58} fontSize={40} onClick={accept}>
        Acepto la misión
      </RibbonButton>
    </>
  );

  return (
    <Stage
      title="Bases y condiciones"
      compactMenu
      mobile={
        <div className="m-stack" id="contenido">
          <img src={logoCodigos} alt="Códigos Secretos 2026" className="m-logo m-logo--sm" />
          <Parchment className="terms__parchment--mobile">{content}</Parchment>
          <div className="m-row" aria-hidden="true">
            <img src={nene} alt="" style={{ width: 120 }} />
            <img src={ralph} alt="" style={{ width: 96 }} />
          </div>
        </div>
      }
    >
      <Deco src={destello} x={67} y={-72} w={745} h={494} opacity={0.85}
        float={{ amplitude: 9, duration: 5.4 }} />
      <Deco src={planetaVit1} x={-130} y={792} w={339} h={166} blur={5} opacity={0.9}
        float={{ amplitude: 6, duration: 6.8, drift: 5 }} />

      <Parchment
        style={{ ...box({ x: 347, y: 253, w: 1226, h: 780 }), zIndex: 3 }}
        onOpened={() => setOpened(true)}
      >
        <div className="terms__inner" id="contenido">{content}</div>
      </Parchment>

      {/* Ralph "lee" con el catalejo cuando el pergamino termina de abrirse. */}
      <div className={`abs terms__ralph${opened ? ' terms__ralph--reading' : ''}`}
        style={{ ...box({ x: 1560, y: 34, w: 360, h: 658 }), zIndex: 4 }} aria-hidden="true">
        <img src={ralph} alt="" className="deco" />
      </div>

      <Deco src={nene} x={24} y={312} w={492} h={820} zIndex={4}
        float={{ amplitude: 7, duration: 5.8, delay: 0.7, rotate: -1 }} />

      <Deco src={logoCodigos} x={749} y={100} w={395} h={294} zIndex={5}
        glow="0 0 2.4cqw #09eaff" float={{ amplitude: 6, duration: 5.2 }} />
    </Stage>
  );
}
