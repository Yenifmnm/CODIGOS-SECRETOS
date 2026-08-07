import { useEffect, useState } from 'react';
import {
  SCENARIOS,
  SCENARIO_LABELS,
  getScenario,
  setScenario,
  subscribeScenario,
  type Scenario,
} from '../../mocks/scenarios';
import './scenario-switcher.css';

/**
 * Panel de desarrollo para forzar la respuesta del adapter mock.
 * Se compila fuera del bundle de producción (`import.meta.env.DEV`).
 */
export function ScenarioSwitcher() {
  const [scenario, setLocal] = useState<Scenario>(getScenario);
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeScenario(setLocal), []);

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
          <p className="dev-switch__hint">
            También por URL: <code>?scenario=WIN</code>
          </p>
        </fieldset>
      )}
    </div>
  );
}
