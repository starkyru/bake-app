import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerAuthProvider } from '@bake-app/react/customer-auth';
import { ErrorBoundary } from '@bake-app/react/ui';
import { ThemeProvider } from './providers/theme-provider';
import { App } from './app';
import { Toaster } from 'sonner';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CustomerAuthProvider>
          <ThemeProvider>
            <App />
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </CustomerAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
