/**
 * Cliente Supabase simplificado para scripts
 */

import { createClient } from '@supabase/supabase-js';
import { scriptConfig } from './config.js';

export const supabase = createClient(
  scriptConfig.supabaseUrl!,
  scriptConfig.supabaseAnonKey!
);