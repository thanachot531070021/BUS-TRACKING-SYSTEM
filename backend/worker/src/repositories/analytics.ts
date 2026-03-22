import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { AnalyticsEvent, CreateAnalyticsBody, Env } from '../types';

export async function logAnalyticsEvent(
  env: Env,
  body: CreateAnalyticsBody,
  userId?: string | null,
  userAgent?: string | null,
  ipHint?: string | null,
) {
  // Only track 'login' events — deduplicate 1 per user per day
  if (body.eventType !== 'login') {
    return null; // ignore non-login events
  }

  if (usingSupabase(env) && userId) {
    // Check if this user already has a login event today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existing = await supabaseFetch<AnalyticsEvent[]>(
      env,
      `analytics_events?select=id&event_type=eq.login&user_id=eq.${userId}&created_at=gte.${todayStart.toISOString()}&limit=1`,
    );
    if (existing.length > 0) {
      return { skipped: true, reason: 'already logged today', id: existing[0].id };
    }
  }

  const payload = {
    source:      body.source,
    event_type:  'login',
    user_id:     userId ?? null,
    session_id:  body.sessionId ?? null,
    page:        body.page ?? null,
    platform:    body.platform ?? null,
    os:          body.os ?? null,
    device_type: body.deviceType ?? null,
    user_agent:  userAgent ?? null,
    ip_hint:     ipHint ?? null,
  };

  if (!usingSupabase(env)) {
    return { id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() };
  }

  const rows = await supabaseFetch<AnalyticsEvent[]>(env, 'analytics_events', {
    method: 'POST',
    body: JSON.stringify([payload]),
  });
  return rows[0];
}

export async function getAnalyticsSummary(env: Env, days = 7) {
  if (!usingSupabase(env)) {
    return {
      total_today: 0,
      total_week: 0,
      by_source: [],
      by_platform: [],
      by_device_type: [],
      daily_counts: [],
      recent: [],
    };
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Only fetch login events (the only event we track)
  const [allRecent, today] = await Promise.all([
    supabaseFetch<AnalyticsEvent[]>(
      env,
      `analytics_events?select=*&event_type=eq.login&created_at=gte.${since}&order=created_at.desc&limit=200`,
    ),
    supabaseFetch<AnalyticsEvent[]>(
      env,
      `analytics_events?select=id&event_type=eq.login&created_at=gte.${todayStart.toISOString()}`,
    ),
  ]);

  const bySource: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const byDeviceType: Record<string, number> = {};
  const dailyMap: Record<string, number> = {};

  for (const ev of allRecent) {
    bySource[ev.source] = (bySource[ev.source] || 0) + 1;
    if (ev.platform) byPlatform[ev.platform] = (byPlatform[ev.platform] || 0) + 1;
    if (ev.device_type) byDeviceType[ev.device_type] = (byDeviceType[ev.device_type] || 0) + 1;
    const day = (ev.created_at ?? '').slice(0, 10);
    if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
  }

  const daily_counts = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    total_today:     today.length,
    total_week:      allRecent.length,
    by_source:       Object.entries(bySource).map(([name, count]) => ({ name, count })),
    by_platform:     Object.entries(byPlatform).map(([name, count]) => ({ name, count })),
    by_device_type:  Object.entries(byDeviceType).map(([name, count]) => ({ name, count })),
    daily_counts,
    recent:          allRecent.slice(0, 20),
  };
}
