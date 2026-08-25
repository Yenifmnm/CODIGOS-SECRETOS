import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PromoButton } from '../../components/buttons/PromoButton';
import { CodeCounter } from '../../components/promo/CodeCounter';
import { promoApi } from '../../services/promoApi';
import './code-only-mobile.css';

import logoCodigos from '../../assets/logos/codigos-secretos.webp';
import barco from '../../assets/promo/barco.webp';
import nintendo from '../../assets/prizes/nintendo.webp';
import auriculares from '../../assets/prizes/auriculares.webp';
import playstation from '../../assets/prizes/playstation.webp';
import planetaPremios from '../../assets/planets/planeta-premios.webp';
import botonCarga from '../../assets/ui/boton-carga.webp';

interface Props {
  /** Cédula del participante ya identificado. */
  cedula: string;
  code: string;
  onCodeChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
  error: string | null;
}

/**
 * CARGA DE CÓDIGO CON EL PARTICIPANTE YA IDENTIFICADO — columna central de la
 * página 15 del PDF de ajustes.
 *
 * No es una pantalla aparte ni una ruta nueva: es el estado de `/participar`
 * posterior a la identificación. La persona ya se registró o ya fue reconocida
 * por su cédula, así que sólo carga el Código Secreto y ve cuántos lleva.
 *
 * Geometría medida sobre la columna del PDF normalizada a 402x858. Esa columna
 * NO trae barra de estado de iOS —su relación de aspecto equivale justo al área
 * útil—, así que las cotas de abajo son directamente coordenadas web.
 *
 * El contador NO sale de `submitPromoCode`: acá se muestra ANTES de canjear
 * nada, así que viene de `getCodeCount`, que es el
 * `GET /api/participants/{cedula}/code-count` del contrato.
 */
export function CodeOnlyMobile({ cedula, code, onCodeChange, onSubmit, loading, error }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    void promoApi
      .getCodeCount(cedula)
      .then((r) => {
        if (vivo) setCount(r.count);
      })
      .catch(() => {
        /* Sin contador antes que un número inventado. */
      });
    return () => {
      vivo = false;
    };
  }, [cedula]);

  return (
    <div className="codeonly-m" id="contenido">
      <img src={barco} alt="" aria-hidden="true" className="codeonly-m__ship" />
      <img src={nintendo} alt="" aria-hidden="true" className="codeonly-m__nintendo" />
      <img src={auriculares} alt="" aria-hidden="true" className="codeonly-m__auris" />
      <img src={playstation} alt="" aria-hidden="true" className="codeonly-m__ps" />
      <img src={planetaPremios} alt="" aria-hidden="true" className="codeonly-m__planeta" />

      <img src={logoCodigos} alt="Códigos Secretos 2026" className="codeonly-m__logo" />

      <h1 className="codeonly-m__title">Ingresá tu código</h1>

      <form className="codeonly-m__form" onSubmit={onSubmit} noValidate>
        {/* La cápsula del PDF es la placa de pergamino, sin rótulo a la vista:
            el único texto dentro es el propio código. El nombre del campo va
            en `aria-label` para que los lectores de pantalla lo anuncien. */}
        <div className="codeonly-m__field">
          <img src={botonCarga} alt="" aria-hidden="true" className="codeonly-m__field-plate" />
          <input
            className="codeonly-m__input"
            name="code"
            aria-label="Código secreto"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="A1B2C3D4"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="codeonly-m__error" role="alert">
            {error}
          </p>
        )}

        <div className="codeonly-m__cta">
          <PromoButton type="submit" mobileFontSize={17} loading={loading}>
            Cargar código
          </PromoButton>
        </div>

        <Link className="codeonly-m__help" to="/donde-esta-el-codigo">
          ¿Dónde encuentro mi Código Secreto?
        </Link>
      </form>

      {count !== null && (
        <CodeCounter count={count} className="codeonly-m__counter" />
      )}
    </div>
  );
}
