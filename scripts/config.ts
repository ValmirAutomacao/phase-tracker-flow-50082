/**
 * Configuração para scripts de diagnóstico
 *
 * Configura ambiente para execução fora do Vite
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

config({ path: join(projectRoot, '.env') });
config({ path: join(projectRoot, '.env.local') });

// Definir variáveis de ambiente padrão se não existirem
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://ibnrtvrxogkksldvxici.supabase.co';
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibklydnJ4b2dra3NsZHZ4aWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2NDk2ODMsImV4cCI6MjA0NjIyNTY4M30.3bqAhErlBP4KNHCwCJAI0BtZUIHQPKEeYGQ4Xn6Tp8s';
}

// Simular import.meta.env para compatibilidade
(globalThis as any).importMeta = {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    MODE: process.env.NODE_ENV || 'development'
  }
};

export const scriptConfig = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  environment: process.env.NODE_ENV || 'development',
  projectRoot
};