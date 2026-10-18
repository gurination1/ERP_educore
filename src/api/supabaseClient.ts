import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://uejeoznlhfqsyknoleib.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlamVvem5saGZxc3lrbm9sZWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjYwMjgsImV4cCI6MjEwNzMwMjAyOH0.lWwJCWzYVU-JXqhPXiRVqTbbSEWwdQawLzzOCDJQ1Bo';

export const isGitHubPages = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.pathname.toLowerCase().includes('/erp_educore') ||
  metaEnv.VITE_USE_SUPABASE === 'true'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

