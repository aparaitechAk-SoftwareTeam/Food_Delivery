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
    if (url.startsWith('http://192.168.137.149:5000/api')) {
      newUrl = url.replace('http://192.168.137.149:5000/api', API_BASE_URL);
    }
  }

  // Ensure headers object exists
  const headers = { ...options.headers };

  // Inject Authorization header if token is present
  const token = localStorage.getItem('admin_token');
  if (token && typeof newUrl === 'string' && newUrl.includes('/api/')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return originalFetch(newUrl, { ...options, headers });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
