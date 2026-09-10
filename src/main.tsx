import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { setupZustandAdapter } from './agent';
import { bootstrapRuntime } from './agent/bootstrap/runtimeBootstrap';

async function init() {
  // 1. Initialize complete Agent OS Runtime (Single Bootstrap)
  await bootstrapRuntime();

  // 2. Setup Application Adapters
  setupZustandAdapter();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });

  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

init().catch(console.error);
