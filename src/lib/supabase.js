import { createClient } from '@supabase/supabase-js';

// Project credentials from environment
const SUPABASE_URL = 'https://awzmtrsyinzgxrcrfdez.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3em10cnN5aW56Z3hyY3JmZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDUzMzUsImV4cCI6MjA2ODYyMTMzNX0.5r4fDsqW8KYnVcy8FzR-2gNrmLCRqZP_Clr4pFft0r8';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with optimized configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection
console.log('🔄 Initializing Supabase connection...');
supabase.from('profiles_mgg_2024').select('count').limit(1).
then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection test failed:', error.message);
  } else {
    console.log('✅ Supabase connection test successful');
  }
}).
catch((err) => {
  console.error('❌ Supabase connection error:', err);
});

export default supabase;