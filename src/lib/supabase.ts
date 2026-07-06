import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zvovnbppoxbtdkjdumzr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b3ZuYnBwb3hidGRramR1bXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMDQwNzUsImV4cCI6MjA5ODg4MDA3NX0.idJ1pmeD4jw7f3rLlI11brPBXahvcAveRM_zew8ruNA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** SHA-256 哈希（用于密码存储和比对） */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
