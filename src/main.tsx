import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { makeStore } from './app/store';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';
import { config } from './lib/config';
import { installGlobalErrorHandlers } from './lib/logger';
import './index.css';

async function bootstrap() {
  installGlobalErrorHandlers();

  if (config.enableMocks) {
    // The mock API must be listening before the first request goes out.
    const { startMockServer } = await import('./mocks/browser');
    await startMockServer();
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root element in index.html');

  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <Provider store={makeStore()}>
          {/* basename lets the same build run at "/" and at "/BugBounty/" on GitHub Pages. */}
          <BrowserRouter basename={config.baseUrl.replace(/\/$/, '')}>
            <App />
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
