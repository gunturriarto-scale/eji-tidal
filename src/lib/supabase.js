import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZHhpZGZ1d253ZXFwbHFrenFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5ODgyNjcsImV4cCI6MjA1ODU2NDI2N30.sQ4PQk0Unwxd-T2B1sh8HWmvwZvfARCVELmuhLElf1E'; // Valid JWT Anon Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
