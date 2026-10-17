import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uejeoznlhfqsyknoleib.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlamVvem5saGZxc3lrbm9sZWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MjYwMjgsImV4cCI6MjEwNzMwMjAyOH0.lWwJCWzYVU-JXqhPXiRVqTbbSEWwdQawLzzOCDJQ1Bo';

export const isGitHubPages = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.pathname.includes('/ERP_educore') ||
  import.meta.env.VITE_USE_SUPABASE === 'true'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

