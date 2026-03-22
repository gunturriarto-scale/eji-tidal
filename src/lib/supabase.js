import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const supabaseAnonKey = 'sb_publishable__O5l9yeFqb36QOOhPjozcw_QsqMCKCd'; // This is a public publishable key, safe for frontend

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
