import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import api from './lib/axios'
import { useAuthStore } from './stores/useAuthStore'

declare global {
  interface Window {
    __E2E__?: {
      setAccessToken: (token: string | null) => void;
      runProfileRequests: (count: number) => Promise<Array<{ status: string }>>;
    };
  }
}

if (import.meta.env.MODE === 'test') {
  window.__E2E__ = {
    setAccessToken: (token) => {
      if (token) {
        useAuthStore.getState().setAccessToken(token);
        return;
      }

      useAuthStore.getState().clearState();
    },
    runProfileRequests: async (count) => {
      const jobs = Array.from({ length: count }, () => api.get('/users/profile'));
      return Promise.allSettled(jobs).then((results) =>
        results.map((result) => ({ status: result.status })),
      );
    },
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
