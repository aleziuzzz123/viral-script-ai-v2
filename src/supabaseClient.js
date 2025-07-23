import { createClient } from '@supabase/supabase-js'

// These special variables are read securely from your Netlify settings.
// They MUST start with REACT_APP_ to be used in a React app.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
