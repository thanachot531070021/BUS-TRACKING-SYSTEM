import { handleDriverDuty, handleDriverLocation, handleDriverLogin, handleDriverWaiting } from '../../handlers/driver';
import { notFound } from '../../lib/http';
import type { Env } from '../../types';

export async function driverRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/auth/driver/login' && request.method === 'POST') return handleDriverLogin(env, request);
  if (pathname === '/drivers/duty' && request.method === 'POST') return handleDriverDuty(env, request);
  if (pathname === '/locations' && request.method === 'POST') return handleDriverLocation(env, request);
  if (pathname === '/driver/waiting' && request.method === 'GET') return handleDriverWaiting(env, request);

  return notFound();
}
