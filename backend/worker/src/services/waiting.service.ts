import { cancelWaiting, createWaiting, listWaiting } from '../repositories/waiting';
import type { CreateWaitingBody, Env } from '../types';

export async function listWaitingService(env: Env, routeId?: string | null) {
  return listWaiting(env, routeId);
}

export async function createWaitingService(env: Env, body: CreateWaitingBody) {
  return createWaiting(env, body);
}

export async function cancelWaitingService(env: Env, waitingId: string) {
  return cancelWaiting(env, waitingId);
}
