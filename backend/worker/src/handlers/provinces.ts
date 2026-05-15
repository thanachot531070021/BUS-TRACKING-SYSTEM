import { json } from '../lib/http';
import { listProvinces } from '../repositories/provinces';
import type { Env } from '../types';

export async function handleListProvinces(env: Env) {
  return json({ data: await listProvinces(env) });
}
