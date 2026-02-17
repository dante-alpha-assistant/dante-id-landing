import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lessxkxujvcmublgwdaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlc3N4a3h1anZjbXVibGd3ZGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNjE0NjUsImV4cCI6MjA4NjkzNzQ2NX0.HoGHrO4MHc06V1WXYQQTRERHvQaShWOPb3gW4DV7G1A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
