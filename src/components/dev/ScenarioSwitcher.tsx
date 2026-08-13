import { useEffect, useState } from 'react';
import {
  SCENARIOS,
  SCENARIO_LABELS,
  getForcedPrizeId,
  getScenario,
  setForcedPrizeId,
  setScenario,
  subscribeScenario,
  type Scenario,
} from '../../mocks/scenarios';
import { MOCK_PRIZES } from '../../mocks/prizes';
import './scenario-switcher.css';

/**
 * Panel de desarrollo para forzar la respuesta del adapter mock.
 * Se compila fuera del bundle de producción (`import.meta.env.DEV`).
 */
export function ScenarioSwitcher() {
  const [scenario, setLocal] = useState<Scenario>(getScenario);
  const [prizeId, setPrizeId] = useState<string>(() => getForcedPrizeId() ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeScenario(setLocal), []);

  const choosePrize = (id: string) => {
    setPrizeId(id);
    setForcedPrizeId(id || null);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div className={`dev-switch${open ? ' dev-switch--open' : ''}`}>
      <button
        type="button"
        className="dev-switch__handle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        mock: {SCENARIO_LABELS[scenario]}
      </button>
      {open && (
        <fieldset className="dev-switch__panel">
          <legend>Escenario de prueba</legend>
          {SCENARIOS.map((s) => (
            <label key={s} className="dev-switch__option">
              <input
                type="radio"
                name="promo-scenario"
                value={s}
                checked={scenario === s}
                onChange={() => setScenario(s)}
              />
              <span>{SCENARIO_LABELS[s]}</span>
            </label>
          ))}
          {/* Con WIN forzado se puede elegir cuál de los 19 premios entrega,
              para revisar la pantalla GANASTE una por una. */}
          {(scenario === 'WIN' || scenario === 'AUTO') && (
            <label className="dev-switch__prize">
              <span>Premio</span>
              <select value={prizeId} onChange={(e) => choosePrize(e.target.value)}>
                <option value="">Rotar el catálogo</option>
                {MOCK_PRIZES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <p className="dev-switch__hint">
            También por URL: <code>?scenario=WIN&amp;prize=skate-mediano</code>
          </p>
        </fieldset>
      )}
    </div>
  );
}
