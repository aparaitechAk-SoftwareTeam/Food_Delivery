import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './config'

// Global Fetch Interceptor for API Requests
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  let newUrl = url;
  if (typeof url === 'string') {
    // Intercept any local backend URLs and map them to the production API_BASE_URL
    if (
      url.startsWith("http://localhost:5000/api") ||
      url.startsWith("http://127.0.0.1:5000/api") ||
      url.includes(":5000/api") ||
      /https?:\/\/192\.168\.\d+\.\d+:5000\/api/.test(url)
    ) {
      newUrl = url.replace(/^https?:\/\/[^/]+:5000\/api/, API_BASE_URL);
    }
  }

  // Ensure headers object exists
  const headers = { ...options.headers };

  // Inject Authorization header if token is present (except for login requests)
  const token = localStorage.getItem('admin_token');
  if (token && typeof newUrl === 'string' && newUrl.includes('/api/') && !newUrl.includes('/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return originalFetch(newUrl, { ...options, headers });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
