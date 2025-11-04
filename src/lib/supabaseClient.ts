import { createClient } from '@supabase/supabase-js'

// Tipagem das variáveis de ambiente do Vite
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL é obrigatória')
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY é obrigatória')
}

/**
 * Cliente Supabase configurado para o EngFlow
 * Usado para operações de banco de dados, autenticação e storage
 * durante a migração localStorage → Supabase
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)