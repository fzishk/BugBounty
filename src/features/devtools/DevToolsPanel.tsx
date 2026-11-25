import { useState, useSyncExternalStore } from 'react';
import { Bug, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bazaarApi } from '../../api/bazaarApi';
import { useAppDispatch } from '../../app/hooks';
import { getLoggedErrors, subscribeToErrors } from '../../lib/logger';
import { chaos, type ForcedFailure, type LatencyMode } from '../../mocks/chaos';
import { revokeAllSessions } from '../../mocks/handlers';
import { dropLiveConnections } from '../../mocks/liveStock';
import { toastShown } from '../toast/toastSlice';

const LATENCY: Array<{ value: LatencyMode; label: string }> = [
  { value: 'instant', label: 'Instant' },
  { value: 'normal', label: 'Normal' },
  { value: 'slow', label: 'Slow (2s)' },
  { value: 'out-of-order', label: 'Out of order' },
];

const sectionTitle = 'text-xs font-semibold tracking-wide text-slate-600 uppercase';
const actionButton =
  'rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50';

/**
 * Demo-only panel that drives the mock server, so every UI state and error in the brief
 * can be triggered on purpose: 400/401/404/409/500, slow and out-of-order responses,
 * a dropped WebSocket, and a crash caught by the error boundary.
 */
export function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const settings = useSyncExternalStore(chaos.subscribe, chaos.get);
  const errors = useSyncExternalStore(subscribeToErrors, getLoggedErrors);

  const expireSession = () => {
    revokeAllSessions();
    // Make one authenticated call right away so the 401 is visible immediately.
    dispatch(bazaarApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unsubscribe();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="devtools-panel"
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50"
      >
        <Bug className="text-brand-600 size-4" aria-hidden="true" />
        Dev tools
      </button>

      {open && (
        <section
          id="devtools-panel"
          aria-label="Developer tools"
          className="fixed bottom-20 left-5 z-40 max-h-[75vh] w-[22rem] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Dev tools (mock server)</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dev tools"
              className="rounded p-1 hover:bg-slate-100"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <fieldset className="mt-4">
            <legend className={sectionTitle}>Network latency</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LATENCY.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="latency"
                    className="accent-brand-600"
                    checked={settings.latency === option.value}
                    onChange={() => chaos.set({ latency: option.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5 space-y-2">
            <legend className={sectionTitle}>Force errors</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={settings.productsFail}
                onChange={(e) => chaos.set({ productsFail: e.target.checked })}
              />
              Product list returns 500
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={settings.productDetailFail}
                onChange={(e) => chaos.set({ productDetailFail: e.target.checked })}
              />
              Product details return 500
            </label>
            <label className="flex items-center justify-between gap-2 text-sm">
              Place order returns
              <select
                value={settings.orderFailure}
                onChange={(e) => chaos.set({ orderFailure: e.target.value as ForcedFailure })}
                className="rounded-md px-2 py-1 ring-1 ring-slate-300"
              >
                <option value="none">Normal</option>
                <option value="400">400 Bad request</option>
                <option value="409">409 Out of stock</option>
                <option value="500">500 Server error</option>
              </select>
            </label>
          </fieldset>

          <div className="mt-5">
            <h3 className={sectionTitle}>Actions</h3>
            <div className="mt-2 grid gap-2">
              <button type="button" className={actionButton} onClick={expireSession}>
                Expire my session (401)
              </button>
              <button
                type="button"
                className={actionButton}
                onClick={() => {
                  dropLiveConnections();
                  dispatch(
                    toastShown('info', 'Live stock connection dropped. Watch it reconnect.'),
                  );
                }}
              >
                Drop live stock connection
              </button>
              <Link to="/debug/crash" className={actionButton}>
                Throw a render error
              </Link>
              <Link to="/products/prod-9999" className={actionButton}>
                Open a missing product (404)
              </Link>
              <button type="button" className={actionButton} onClick={() => chaos.reset()}>
                Reset all to normal
              </button>
            </div>
          </div>

          <div className="mt-5">
            <h3 className={sectionTitle}>Logged errors ({errors.length})</h3>
            <ul className="mt-2 space-y-1 font-mono text-xs text-slate-700">
              {errors.length === 0 && <li>None yet.</li>}
              {errors.slice(0, 5).map((entry) => (
                <li key={entry.id} className="truncate">
                  {entry.source}: {entry.message}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
