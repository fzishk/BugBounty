import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Bug } from 'lucide-react';
import { config } from '../../lib/config';
import { logError } from '../../lib/logger';

type Props = { children: ReactNode; resetKey?: unknown };
type State = { error: Error | null };

/**
 * Catches render/lifecycle errors below it, logs them, and shows a fallback instead of
 * a blank page. `resetKey` (the current route) clears the error when the user navigates away.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, 'react-error-boundary', { componentStack: info.componentStack });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="container-page py-16">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-red-50 text-red-600">
            <Bug className="size-7" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold">We hit an unexpected bug</h1>
          <p className="mt-2 text-sm text-slate-600">
            It has been logged. You can try again, or head back to the shop. Your cart is saved.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              className="bg-brand-600 hover:bg-brand-700 h-10 rounded-lg px-4 text-sm font-semibold text-white"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <a
              href={config.baseUrl}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              Go to home page
            </a>
          </div>
        </div>
      </div>
    );
  }
}
