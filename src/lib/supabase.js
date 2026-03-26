import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZHhpZGZ1d253ZXFwbHFrenFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTk0NDIsImV4cCI6MjA4OTczNTQ0Mn0.sQ4PQk0Unwxd-T2B1sh8HWmvwZvfARCVELmuhLEIf1E'; // Valid JWT Anon Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
