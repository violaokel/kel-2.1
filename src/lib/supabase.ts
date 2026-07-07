import { createClient } from "@supabase/supabase-js";

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://placeholder-project-not-configured.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4ODg4MDAsImV4cCI6MTkwNDQ0NDgwMH0.placeholder";

if (!metaEnv.VITE_SUPABASE_URL || !metaEnv.VITE_SUPABASE_ANON_KEY) {
  console.warn("Supabase URL or Anon Key is missing in environment variables. Running in offline/local-fallback mode.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

