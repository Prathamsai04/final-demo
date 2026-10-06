import { DemoRepository } from './demoRepository.js';
import { SupabaseRepository } from './supabaseRepository.js';

let supabaseRepo = null;

export function getDataMode(env = process.env) {
  return env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? 'supabase' : 'demo';
}

/**
 * Returns the repository for the current request. Demo mode builds a fresh, stateless
 * repository from seed data + the client overlay; Supabase mode reuses one client.
 */
export function createRepository({ overlay, env = process.env } = {}) {
  if (getDataMode(env) === 'supabase') {
    supabaseRepo ??= new SupabaseRepository({ url: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY });
    return supabaseRepo;
  }
  return new DemoRepository(overlay);
}
