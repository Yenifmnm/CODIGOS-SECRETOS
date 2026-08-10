import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Sparkles } from '../effects/Sparkles';
import { MobileScene } from '../layout/MobileStage';
import { mbox } from '../../app/mobileStage';
import type { Prize } from '../../types/promo';
import './closed-chest-mobile.css';
import './prize-reveal.css';

import cofreAbierto from '../../assets/promo/cofre-abierto.webp';
import cofreCerrado from '../../assets/promo/cofre-cerrado.webp';
import glow from '../../assets/effects/glow.webp';

/** Alto de la escena en px del lienzo mobile. */
const SCENE_H = 300;

/* Misma coreografía que la versión desktop (`PrizeReveal`), con las cajas del
   Figma mobile: anticipación → apertura → estallido de luz → el premio emerge. */
const T = { anticipation: 0.28, open: 0.34, prize: 0.62 };
const openAt = T.anticipation;
const lightAt = openAt + T.open * 0.4;
const prizeAt = lightAt + 0.12;

interface Props {
  /** Llega por props desde el resultado del backend: acá no se elige nada. */
  prize: Prize;
}

/**
 * Reveal del ganador en mobile — Figma "ganaste.png" (402x969).
 *
 * El diseño mobile SÍ incluye el cofre abriéndose con el premio emergiendo; no
 * es una versión reducida que muestre sólo el premio.
 */
export function PrizeRevealMobile({ prize }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <MobileScene height={SCENE_H} className="mchest">
        <div className="mchest__planet" aria-hidden="true" />
        <img src={glow} alt="" aria-hidden="true"
          className="mabs mlayer-img reveal__glow"
          style={mbox({ x: 66, y: 14, w: 280, h: 210, sceneH: SCENE_H })} />
        <img src={cofreAbierto} alt="" aria-hidden="true"
          className="mabs mlayer-img mchest__img"
          style={mbox({ x: 96, y: 112, w: 212, h: 188, sceneH: SCENE_H })} />
        <img src={prize.image} alt={prize.name}
          className="mabs mlayer-img reveal__prize"
          style={mbox({ x: 140, y: 0, w: 216, h: 150, sceneH: SCENE_H })} />
      </MobileScene>
    );
  }

  return (
    <MobileScene height={SCENE_H} className="mchest">
      <div className="mchest__planet" aria-hidden="true" />

      {/* Resplandor que sale del cofre al abrirse. */}
      <motion.img
        src={glow}
        alt=""
        aria-hidden="true"
        className="mabs mlayer-img reveal__glow"
        style={mbox({ x: 66, y: 14, w: 280, h: 210, sceneH: SCENE_H })}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0.75], scale: [0.5, 1.16, 1] }}
        transition={{ delay: lightAt, duration: 1.1, times: [0, 0.45, 1], ease: 'easeOut' }}
      />

      {/* Cofre: se comprime y luego abre. */}
      <motion.div
        className="mabs mchest__img"
        style={mbox({ x: 96, y: 112, w: 212, h: 188, sceneH: SCENE_H })}
        initial={{ scale: 0.86, y: '4%', opacity: 0 }}
        animate={{ scale: [0.86, 0.94, 1.06, 1], y: ['4%', '2%', '-1%', '0%'], opacity: 1 }}
        transition={{ duration: T.anticipation + T.open + 0.3, ease: 'easeOut', times: [0, 0.35, 0.72, 1] }}
      >
        <motion.img
          src={cofreCerrado} alt="" aria-hidden="true" className="mlayer-img mchest__stack"
          initial={{ opacity: 1 }} animate={{ opacity: 0 }}
          transition={{ delay: openAt, duration: 0.12 }}
        />
        <motion.img
          src={cofreAbierto} alt="" aria-hidden="true" className="mlayer-img mchest__stack"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: openAt, duration: 0.12 }}
        />
      </motion.div>

      {/* Premio: emerge desde dentro del cofre. */}
      <motion.div
        className="mabs"
        style={mbox({ x: 140, y: 0, w: 216, h: 150, sceneH: SCENE_H })}
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
        </motion.div>
        <Sparkles count={14} spread={44} />
      </motion.div>
    </MobileScene>
  );
}
