import { getAnalyticsSummary, logAnalyticsEvent } from '../repositories/analytics';
import type { CreateAnalyticsBody, Env } from '../types';

export async function logEventService(
  env: Env,
  body: CreateAnalyticsBody,
  userId?: string | null,
  userAgent?: string | null,
  ipHint?: string | null,
) {
  return logAnalyticsEvent(env, body, userId, userAgent, ipHint);
}

export async function getAnalyticsSummaryService(env: Env, days?: number) {
  return getAnalyticsSummary(env, days);
}
