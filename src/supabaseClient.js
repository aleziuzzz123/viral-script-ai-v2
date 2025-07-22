import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your actual Supabase Project URL and Anon Key
const supabaseUrl = 'https://ntjeneyztmkpezulrrua.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50amVuZXl6dG1rcGV6dWxycnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTE4OTIsImV4cCI6MjA2ODc4Nzg5Mn0.CdKZkl7KTgaCAsCyNH3vRvuUT7KmL9ccz_8rXdtDX4U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)