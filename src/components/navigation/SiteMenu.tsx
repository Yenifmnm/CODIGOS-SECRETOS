import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { u } from '../../app/stage';
import { useIsMobile } from '../../hooks/useIsMobile';
import logoPurosol from '../../assets/logos/purosol.webp';
import './site-menu.css';

/** Ítems de la barra desplegada, en el orden del Figma desktop (13:51). */
const ITEMS = [
  { to: '/participar', label: 'CARGAR CÓDIGO' },
  { to: '/premios', label: 'PREMIOS' },
  { to: '/bases', label: 'BASES Y CONDICIONES' },
];

/**
 * El Figma mobile ordena las píldoras distinto que el desktop: BASES va antes
 * que PREMIOS. Se reordena el arreglo en vez de usar `order` en CSS para que el
 * orden visual y el del DOM —o sea el de lectura y el de tabulación— coincidan.
 */
const ITEMS_MOBILE = [
  { to: '/participar', label: 'CARGAR CÓDIGO' },
  { to: '/bases', label: 'BASES Y CONDICIONES' },
  { to: '/premios', label: 'PREMIOS' },
];

interface SiteMenuProps {
  /**
   * Las pantallas de resultado y de formulario nunca muestran el panel
   * desplegado abierto por defecto: el menú arranca plegado y no distrae.
   */
  compact?: boolean;
}

/**
 * Menú del Figma actual: píldora cian plegada (13:32 "barra menu plegado") que
 * al hacer click se expande a la barra completa (13:51 "barra menu desktop").
 *
 * Permanece siempre accesible durante la navegación (requisito del PPT) y se
 * cierra con ESC o al hacer click fuera.
 */
export function SiteMenu({ compact = false }: SiteMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const panelId = useId();
  const location = useLocation();
  const isMobile = useIsMobile();
  const items = isMobile ? ITEMS_MOBILE : ITEMS;

  // Al cambiar de pantalla el menú vuelve a su estado plegado.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <nav
      ref={rootRef}
      className={`site-menu${open ? ' site-menu--open' : ''}${compact ? ' site-menu--compact' : ''}`}
      /* Sólo el origen va inline; el tamaño lo resuelve el CSS, que distingue
         los dos nodos del Figma: plegada 361x83 en (90,34) — nodo 82:129 — y
         desplegada 1684x109 en (105,34) — nodo 13:51 —. Con el alto inline la
         barra se quedaba en 83 px también abierta y los botones quedaban más
         chicos que en la propuesta. */
      style={{ left: u(90), top: u(34) }}
      aria-label="Navegación principal"
    >
      {/*
        La barra es la píldora del Figma mobile: 162x49 en (24, 79), igual en
        los once frames. Van los once nodos separados por espacio y gana el de
        la pantalla que se esté midiendo, en este orden: landing, registro, CI,
        premios, dónde está el código, bases, ganaste, perdiste, código
        utilizado, código inexistente, menú desplegado.
      */}
      <div
        className="site-menu__bar"
        data-figma="70:192 73:560 70:352 73:674 73:798 73:896 73:863 74:1028 105:263 131:335 79:1128"
        /* El nodo marcado es la instancia, que es transparente: el cian lo
           pinta su hijo `Rectangle 1` con #09EAFF80, que es exactamente lo que
           vale `--c-cyan-50`. Acá es un solo elemento, así que el control de
           pintura no aplica. */
        data-figma-omitir="pintura"
      >
        <NavLink to="/" className="site-menu__brand" aria-label="PuroSol — Inicio">
          <img src={logoPurosol} alt="PuroSol" />
        </NavLink>

        <span className="site-menu__divider" aria-hidden="true" />

        <ul id={panelId} className="site-menu__items" hidden={!open}>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `site-menu__link${isActive ? ' site-menu__link--active' : ''}`
                }
                tabIndex={open ? undefined : -1}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="site-menu__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
          <svg viewBox="0 0 68 68" aria-hidden="true" focusable="false">
            <circle cx="34" cy="34" r="33" className="site-menu__toggle-disc" />
            <g className="site-menu__toggle-bars">
              <rect x="18" y="23" width="32" height="5" rx="2.5" />
              <rect x="18" y="31.5" width="32" height="5" rx="2.5" />
              <rect x="18" y="40" width="32" height="5" rx="2.5" />
            </g>
            <g className="site-menu__toggle-cross">
              <rect x="18" y="31.5" width="32" height="5" rx="2.5" transform="rotate(45 34 34)" />
              <rect x="18" y="31.5" width="32" height="5" rx="2.5" transform="rotate(-45 34 34)" />
            </g>
          </svg>
        </button>
      </div>
    </nav>
  );
}
