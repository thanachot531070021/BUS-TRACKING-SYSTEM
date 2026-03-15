import { cancelWaiting, createWaiting, getWaitingById, getWaitingSummary, listWaiting, markWaitingPickedUp } from '../repositories/waiting';
import type { CreateWaitingBody, Env } from '../types';

export async function listWaitingService(env: Env, routeId?: string | null) {
  return listWaiting(env, routeId);
}

export async function getWaitingByIdService(env: Env, waitingId: string) {
  return getWaitingById(env, waitingId);
}

export async function getWaitingSummaryService(env: Env, routeId?: string | null) {
  return getWaitingSummary(env, routeId);
}

export async function createWaitingService(env: Env, body: CreateWaitingBody) {
  return createWaiting(env, body);
}

export async function cancelWaitingService(env: Env, waitingId: string) {
  return cancelWaiting(env, waitingId);
}

export async function markWaitingPickedUpService(env: Env, waitingId: string) {
  return markWaitingPickedUp(env, waitingId);
}
