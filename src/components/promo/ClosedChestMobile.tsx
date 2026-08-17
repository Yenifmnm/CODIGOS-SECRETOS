import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MobileScene } from '../layout/MobileStage';
import { mbox } from '../../app/mobileStage';
import './closed-chest-mobile.css';

import cofreCerrado from '../../assets/promo/cofre-cerrado.webp';

/** Alto de la escena en px del lienzo mobile. */
const SCENE_H = 203;

/**
 * Cofre cerrado de PERDISTE y de las dos pantallas de error, en mobile
 * (Figma "perdiste.png" / "codigo utilizado.png", 402x969).
 *
 * El cofre se apoya sobre la superficie curva del planeta y sólo respira: un
 * balanceo mínimo y un cambio de escala apenas perceptible. Nada de apertura,
 * que es lo que distingue a estas pantallas de GANASTE.
 */
export function ClosedChestMobile() {
  const reduced = useReducedMotion();

  return (
    <MobileScene height={SCENE_H} className="mchest">
      {/* Superficie del planeta: asoma por abajo y sostiene al cofre. */}
      <div className="mchest__planet" aria-hidden="true" />

      <motion.img
        src={cofreCerrado}
        alt=""
        aria-hidden="true"
        className="mabs mlayer-img mchest__img"
        style={mbox({ x: 102, y: 20, w: 198, h: 183, sceneH: SCENE_H })}
        animate={reduced ? undefined : { rotate: [-0.9, 0.9, -0.9], scale: [1, 1.015, 1] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </MobileScene>
  );
}
