import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwjsqkemiiuxctyqezqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3anNxa2VtaWl1eGN0eXFlenFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDIxMTEsImV4cCI6MjA5MTA3ODExMX0.bHxdLu5AaeiJW4obv30oBYxrs3rpq7idH3-EPYTlOYg';

export const supabase = createClient(supabaseUrl, supabaseKey);