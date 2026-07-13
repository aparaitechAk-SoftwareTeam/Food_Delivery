import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './config'

const IS_PRODUCTION = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const RENDER_API = 'https://food-delivery-gtq0.onrender.com/api';

// Global Fetch Interceptor for API Requests
// Ensures all fetch() calls use the correct API base URL regardless of how they were written.
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  let newUrl = url;
  if (typeof url === 'string') {
    // Rewrite any local development URLs to the correct base
    if (
      url.startsWith("http://localhost:5000/api") ||
      url.startsWith("http://127.0.0.1:5000/api") ||
      url.includes(":5000/api") ||
      /https?:\/\/192\.168\.\d+\.\d+:5000\/api/.test(url)
    ) {
      newUrl = IS_PRODUCTION
        ? url.replace(/^https?:\/\/[^/]+:5000\/api/, '/api')   // use Vercel proxy in production
        : url.replace(/^https?:\/\/[^/]+:5000\/api/, API_BASE_URL);
    }
    // In production, also rewrite absolute Render URLs to relative /api (avoids CORS)
    if (IS_PRODUCTION && url.startsWith(RENDER_API)) {
      newUrl = url.replace(RENDER_API, '/api');
    }
  }

  // Ensure headers object exists
  const headers = { ...options.headers };

  // Inject Authorization header if token is present
  const token = localStorage.getItem('admin_token');
  if (token && typeof newUrl === 'string' && newUrl.includes('/api/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (newUrl !== url) {
    console.log(`[FetchInterceptor] Rewrote: ${url} → ${newUrl}`);
  }

  return originalFetch(newUrl, { ...options, headers });
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
