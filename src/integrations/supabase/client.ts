// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase: Faltan variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)");
}

// Crear el cliente UNA sola vez
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { "X-Client-Info": "equitylabs-web" },
  },
});

// Helper para usar en cualquier parte
export const getSupabase = () => supabase;

export type { Database } from "./types";

console.log("✅ Supabase client initialized successfully");
