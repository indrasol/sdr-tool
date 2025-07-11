// src/supabase.ts

// Import environment variables
// import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from './.env';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// The browser must only use the public (anon) key. Service keys have admin
// privileges and should never be exposed client-side.
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);