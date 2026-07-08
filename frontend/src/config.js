// Configuration for dynamic API Base URL
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  `https://cloudkitchen.aparaitech.org/api`;
