import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SessionWatcher } from '../../features/auth/SessionWatcher';
import { config } from '../../lib/config';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { Toaster } from '../feedback/Toaster';
import { Footer } from './Footer';
import { Header } from './Header';

// Lazy: the panel imports the mock server, which should not weigh down the main bundle.
const DevToolsPanel = lazy(() =>
  import('../../features/devtools/DevToolsPanel').then((m) => ({ default: m.DevToolsPanel })),
);

export function Layout() {
  const { pathname } = useLocation();

  // New page => start at the top (filters only change the query string, so they keep scroll).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* resetKey: navigating to another page clears a crashed page. */}
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <Toaster />
      <SessionWatcher />
      {config.enableMocks && (
        <Suspense fallback={null}>
          <DevToolsPanel />
        </Suspense>
      )}
    </div>
  );
}
