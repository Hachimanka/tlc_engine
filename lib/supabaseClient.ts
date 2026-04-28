import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://eqrastmkwokjebqamtcl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcmFzdG1rd29ramVicWFtdGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Njk3NjgsImV4cCI6MjA4ODI0NTc2OH0.XRhlNHgpuvBGkQwLq9_jK-44lUsp4wOwGEscYh3pg1w";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);