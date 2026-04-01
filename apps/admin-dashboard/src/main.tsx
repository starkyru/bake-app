import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@bake-app/react/api-client';
import { AuthProvider } from '@bake-app/react/auth';
import { Toaster } from 'sonner';
import { App } from './app';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </StrictMode>,
);
