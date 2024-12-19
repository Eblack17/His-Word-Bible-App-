// Production and development configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Supabase configuration
export const SUPABASE_URL = 'https://fqtkcyuroulpsksnysll.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdGtjeXVyb3VscHNrc255c2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzExODYsImV4cCI6MjA0OTkwNzE4Nn0.Xyvdzkida_LG_QNH9rcyUO8Rn7O6koTzAE6V86kkiIs';

// Backend URL (use Railway in production, localhost in development)
export const BACKEND_URL = isDevelopment 
  ? 'http://localhost:8001'
  : process.env.REACT_APP_BACKEND_URL || 'https://his-word-bible-app-production.up.railway.app';

// OAuth configuration
export const FACEBOOK_APP_ID = '479639331815981';
export const GOOGLE_CLIENT_ID = '138367393575-nsbb0sr690q3ve3d2nmsargomgm6hbq9.apps.googleusercontent.com';
