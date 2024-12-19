import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqtkcyuroulpsksnysll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdGtjeXVyb3VscHNrc255c2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzExODYsImV4cCI6MjA0OTkwNzE4Nn0.Xyvdzkida_LG_QNH9rcyUO8Rn7O6koTzAE6V86kkiIs';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
