import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Star {
  x: number;
  y: number;
  r: number;
  speed: number;
  alpha: number;
  twinkle: number;
  phase: number;
}

/** Tres profundidades: lejana lenta y tenue, cercana rápida y brillante. */
const LAYERS = [
  { count: 90, speed: 4, radius: [0.6, 1.2], alpha: [0.25, 0.5] },
  { count: 55, speed: 11, radius: [0.9, 1.8], alpha: [0.4, 0.75] },
  { count: 28, speed: 22, radius: [1.3, 2.6], alpha: [0.6, 1] },
] as const;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Lluvia de estrellas continua sobre un único <canvas>.
 *
 * Un canvas y un solo requestAnimationFrame en lugar de decenas de nodos
 * animados: no bloquea el puntero, no genera listeners por estrella y se
 * detiene limpiamente al desmontar.
 */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let frame = 0;
    let last = performance.now();
    let running = true;

    const seed = () => {
      stars = [];
      LAYERS.forEach((layer) => {
        for (let i = 0; i < layer.count; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: rand(layer.radius[0], layer.radius[1]),
            speed: layer.speed,
            alpha: rand(layer.alpha[0], layer.alpha[1]),
            twinkle: rand(0.6, 1.8),
            phase: Math.random() * Math.PI * 2,
          });
        }
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        // Deriva diagonal suave: descienden y corren hacia la izquierda.
        s.x -= s.speed * dt;
        s.y += s.speed * 0.35 * dt;
        if (s.x < -4) {
          s.x = width + 4;
          s.y = Math.random() * height;
        }
        if (s.y > height + 4) {
          s.y = -4;
          s.x = Math.random() * width;
        }
        const flicker = 0.75 + 0.25 * Math.sin(now / 1000 * s.twinkle + s.phase);
        ctx.globalAlpha = s.alpha * flicker;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const onResize = () => {
      resize();
      if (reduced) drawStatic();
    };
    window.addEventListener('resize', onResize);

    if (reduced) {
      // Con reduced-motion las estrellas existen pero no se desplazan.
      drawStatic();
    } else {
      frame = requestAnimationFrame(draw);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
