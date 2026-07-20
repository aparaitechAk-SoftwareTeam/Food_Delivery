// Configuration for dynamic API Base URL
const rawUrl = 
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  `https://food-delivery-ywd0.onrender.com/api`;

export const API_BASE_URL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
