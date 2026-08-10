import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Sparkles } from '../effects/Sparkles';
import { box } from '../../app/stage';
import type { Prize } from '../../types/promo';
import './prize-reveal.css';

import cofreAbierto from '../../assets/promo/cofre-abierto.webp';
import cofreCerrado from '../../assets/promo/cofre-cerrado.webp';
import glow from '../../assets/effects/glow.webp';

interface PrizeRevealProps {
  /** Llega por props desde el resultado del backend. Acá no se elige nada. */
  prize: Prize;
}

/* Coordenadas del Figma (23:3136 cofre, 23:3137 premio, 23:3138/9 glows). */
const CHEST = { x: 1032, y: 330, w: 682, h: 682 };
/* Ajustado midiendo la silueta de la Switch en GANASTE.png: la caja anterior la
   dejaba un 15% chica y 49 px a la izquierda. */
const PRIZE = { x: 1270, y: 48, w: 635, h: 653 };
const T = {
  anticipation: 0.28,
  open: 0.34,
  light: 0.3,
  prize: 0.62,
};

/**
 * Secuencia del ganador:
 * anticipación del cofre → apertura → estallido de luz → el premio emerge del
 * cofre con halo holográfico → partículas y glow en idle.
 *
 * El premio llega por props: esta pieza no ejecuta ninguna lógica de sorteo.
 */
export function PrizeReveal({ prize }: PrizeRevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    // Sin movimiento: se muestra el estado final con un fundido simple.
    return (
      <div className="reveal reveal--static">
        <img src={glow} alt="" aria-hidden="true" className="abs reveal__glow"
          style={box({ x: 1000, y: 240, w: 900, h: 620 })} />
        <img src={cofreAbierto} alt="" aria-hidden="true" className="abs reveal__chest" style={box(CHEST)} />
        <img src={prize.image} alt={prize.name} className="abs reveal__prize" style={box(PRIZE)} />
      </div>
    );
  }

  const openAt = T.anticipation;
  const lightAt = openAt + T.open * 0.4;
  const prizeAt = lightAt + 0.12;

  return (
    <div className="reveal">
      {/* Resplandor que sale del cofre al abrirse. */}
      <motion.img
        src={glow}
        alt=""
        aria-hidden="true"
        className="abs reveal__glow"
        style={box({ x: 1000, y: 240, w: 900, h: 620 })}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0.75], scale: [0.5, 1.16, 1] }}
        transition={{ delay: lightAt, duration: 1.1, times: [0, 0.45, 1], ease: 'easeOut' }}
      />

      {/* Cofre: anticipación (se comprime) y luego apertura. */}
      <motion.div
        className="abs reveal__chest-wrap"
        style={box(CHEST)}
        initial={{ scale: 0.86, y: '4%', opacity: 0 }}
        animate={{ scale: [0.86, 0.94, 1.06, 1], y: ['4%', '2%', '-1%', '0%'], opacity: 1 }}
        transition={{ duration: T.anticipation + T.open + 0.3, ease: 'easeOut', times: [0, 0.35, 0.72, 1] }}
      >
        <motion.img
          src={cofreCerrado}
          alt=""
          aria-hidden="true"
          className="reveal__chest reveal__chest--closed"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: openAt, duration: 0.12 }}
        />
        <motion.img
          src={cofreAbierto}
          alt=""
          aria-hidden="true"
          className="reveal__chest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: openAt, duration: 0.12 }}
        />
      </motion.div>

      {/* Premio: emerge desde dentro del cofre hacia su posición final. */}
      <motion.div
        className="abs reveal__prize-wrap"
        style={box(PRIZE)}
        initial={{ opacity: 0, y: '78%', scale: 0.45 }}
        animate={{ opacity: 1, y: '0%', scale: 1 }}
        transition={{ delay: prizeAt, duration: T.prize, ease: [0.16, 0.9, 0.28, 1] }}
      >
        <motion.div
          className="reveal__prize-float"
          animate={{ y: ['0%', '-2.6%', '0%'] }}
          transition={{ delay: prizeAt + T.prize, duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src={prize.image} alt={prize.name} className="reveal__prize" />
          <span
            className="reveal__holo"
            aria-hidden="true"
            style={{ '--holo-mask': `url(${prize.image})` } as React.CSSProperties}
          />
        </motion.div>
        <Sparkles count={20} spread={52} />
      </motion.div>
    </div>
  );
}
