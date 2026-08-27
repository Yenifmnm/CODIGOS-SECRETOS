import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage } from '../../components/layout/Stage';
import { Deco } from '../../components/layout/Deco';
import { Parchment } from '../../components/promo/Parchment';
import { FloatingLayer } from '../../components/effects/FloatingLayer';
import { RibbonButton } from '../../components/buttons/RibbonButton';
import { RibbonSvg } from '../../components/promo/RibbonSvg';
/* Las dos cintas de esta pantalla, bajadas de sus nodos con
   `figma:pull --export`. Cada una tiene su propia silueta de papel rasgado; el
   catálogo está en `assets/ui/cintas/README.md`. */
import cintaTitulo from '../../assets/ui/cintas/73-934.svg';
import cintaBoton from '../../assets/ui/cintas/73-937.svg';
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

  /* Barra de scroll propia: proporción y posición del pulgar, en % del carril. */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, size: 100 });

  const medirBarra = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setThumb({ top: 0, size: 100 });
      return;
    }
    // El contenido legal es muy largo: su proporción pura dejaría un pulgar de
    // pocos píxeles. Conservamos la proporción, con un mínimo visual de 30 px
    // (aprox. el tamaño de la referencia en mobile y desktop).
    const minSize = Math.min((30 / clientHeight) * 100, 100);
    const size = Math.max((clientHeight / scrollHeight) * 100, minSize);
    const top = (scrollTop / (scrollHeight - clientHeight)) * (100 - size);
    setThumb({ top, size });
  }, []);

  const onScroll = medirBarra;

  // El texto llega del adapter, así que la medida se rehace cuando cambia y
  // cuando la caja cambia de tamaño (rotación, teclado, cambio de viewport).
  useEffect(() => {
    medirBarra();
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(medirBarra);
    ro.observe(el);
    return () => ro.disconnect();
  }, [terms, medirBarra]);

  /**
   * El backend podrá enviar `termsHtml` (ya sanitizado) o `termsText`.
   * Mientras tanto se renderiza la transcripción final del DOCX desde el mock.
   */
  /* El documento legal arranca con su propio encabezado «BASES Y CONDICIONES»,
     que es exactamente lo que ya dice la cinta del pergamino. Al renderlo tal
     cual el titulo aparecia dos veces, una pegada debajo de la otra: es lo que
     el PDF de ajustes marca en la pagina 17. Se descarta ese primer parrafo
     cuando repite el rotulo; el texto de origen no se toca. */
  const parrafos = (terms?.termsText ?? '')
    .split('\n\n')
    .filter((t, k) => !(k === 0 && t.trim().toUpperCase() === 'BASES Y CONDICIONES'));

  const body = terms?.termsHtml ? (
    <div className="terms__body" dangerouslySetInnerHTML={{ __html: terms.termsHtml }} />
  ) : (
    <div className="terms__body">
      {parrafos.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );

  const content = (
    <>
      {/* La cinta y su texto son dos capas del frame: `Vector 1` (73:934) es
          la silueta y `Bases y Condiciones` (73:935) el rótulo de adentro. */}
      <p className="terms__heading">
        {/* `Vector 1` (73:934): la cinta, con el vector del nodo. Antes era un
            rectángulo con `background: #d8831c` recortado por un `clip-path`
            genérico que ni siquiera estaba puesto acá — se heredaba del bloque
            de escritorio, ver `terms.css`. */}
        <RibbonSvg src={cintaTitulo} nodo="73:934" />
        <span className="terms__heading-text" data-figma="73:935">
          Bases y Condiciones
        </span>
      </p>

      {/* El pergamino no crece: el texto —que es largo— scrollea acá dentro.
          La barra es propia y no la nativa porque Safari iOS no dibuja
          scrollbars: sólo las muestra mientras se arrastra, así que no habría
          ninguna señal de que el texto sigue. */}
      {/* `73:939` es el bloque de texto de relleno del diseño, no el alto del
          legal real, que scrollea: sólo deciden la x y el ancho. */}
      <div className="terms__viewport" data-figma="73:939" data-figma-ejes="x,w">
        <div
          className="terms__scroll"
          ref={scrollRef}
          onScroll={onScroll}
          tabIndex={0}
          role="region"
          aria-label="Texto de bases y condiciones"
        >
          {body}
        </div>
        <div className="terms__bar" aria-hidden="true" data-figma="73:942">
          <span
            className="terms__bar-thumb"
            data-figma="73:943"
            data-figma-ejes="x,w"
            style={{ top: `${thumb.top}%`, height: `${thumb.size}%` }}
          />
        </div>
      </div>

      <RibbonButton
        className="terms__cta"
        width={328}
        height={58}
        fontSize={40}
        /* `Vector 1` (73:937): 147x39 en el lienzo mobile. */
        mobileWidth={147}
        mobileHeight={39}
        onClick={accept}
        silueta={cintaBoton}
        data-figma-cinta="73:937"
        data-figma-label="73:938"
      >
        Acepto la misión
      </RibbonButton>
    </>
  );

  return (
    <Stage
      title="Bases y condiciones"
      compactMenu
      mobileCielo={{ nodo: '73:892', x: -22, y: -38, w: 445, h: 965 }}
      mobile={
        /* Figma "bases y condiciones.png": logo montado sobre el pergamino,
           ralph sentado en el planeta B3 arriba a la derecha y nene con el
           catalejo abajo a la izquierda. El pergamino se despliega al entrar. */
        <div
          className="terms-m"
          id="contenido"
          data-figma="73:891"
          data-figma-ejes="x,w"
          data-figma-omitir="pintura"
        >
          <img
            src={logoCodigos}
            alt="Códigos Secretos 2026"
            className="terms-m__logo"
            data-figma="73:925"
          />

          <img
            src={destello}
            alt=""
            aria-hidden="true"
            className="terms-m__destello"
            data-figma="73:895"
          />
          <img
            src={planetaVit1}
            alt=""
            aria-hidden="true"
            className="terms-m__planeta"
            data-figma="73:929"
          />

          {/* Sin nodo: en el frame el pergamino, el nene y el personaje de
              arriba cuelgan sueltos. */}
          <div className="terms-m__sheet">
            <FloatingLayer amplitude={5} duration={6.6} delay={0.4}
              className="terms-m__ralph" style={{ position: 'absolute' }} data-figma="73:931">
              <img src={ralph} alt="" aria-hidden="true" className="mlayer-img" />
            </FloatingLayer>

            <FloatingLayer amplitude={4} duration={7.4} delay={1.2}
              className="terms-m__nene" style={{ position: 'absolute' }} data-figma="73:927">
              <img src={nene} alt="" aria-hidden="true" className="mlayer-img" />
            </FloatingLayer>

            {/* La marca del pergamino va en la IMAGEN, no acá: el nodo está
                girado -90° y el control sólo puede verificar el ancho y el alto
                si el giro lo aplica el CSS sobre el elemento marcado. */}
            <Parchment className="terms-m__parchment" imgFigma="73:924">
              {content}
            </Parchment>
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
