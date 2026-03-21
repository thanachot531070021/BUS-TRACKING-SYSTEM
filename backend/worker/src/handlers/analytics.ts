import { badRequest, json, readJson } from '../lib/http';
import { parseBearerToken, decodeJwtPayload, authFromJwtPayload } from '../lib/auth';
import { getUserByAuthUserId } from '../repositories/users';
import { getAnalyticsSummaryService, logEventService } from '../services/analytics.service';
import type { CreateAnalyticsBody, Env } from '../types';

// Detect platform and device type from User-Agent string
function parseUserAgent(ua: string): { platform: string; os: string; deviceType: string } {
  const s = ua.toLowerCase();

  // Device type
  const deviceType =
    /mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/.test(s) ? 'mobile' :
    /ipad|android(?!.*mobile)|tablet/.test(s) ? 'tablet' : 'desktop';

  // OS / Platform
  const platform =
    /iphone|ipad|ipod/.test(s) ? 'iOS' :
    /android/.test(s)           ? 'Android' :
    /windows/.test(s)           ? 'Windows' :
    /macintosh|mac os x/.test(s) ? 'macOS' :
    /linux/.test(s)             ? 'Linux' :
    /dart/.test(s)              ? 'Flutter' : 'Unknown';

  const os = platform; // same for now, can be extended

  return { platform, os, deviceType };
}

// Parse first 3 IP octets for privacy-safe hint
function parseIpHint(request: Request): string {
  const cf = (request as any).cf;
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '';
  if (!ip) return '';
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.*` : ip.slice(0, 8) + '…';
}

export async function handleLogEvent(env: Env, request: Request) {
  const body = await readJson<Partial<CreateAnalyticsBody>>(request);

  if (!body?.source || !['web_admin', 'mobile_app'].includes(body.source)) {
    return badRequest('source must be "web_admin" or "mobile_app"');
  }
  if (!body.eventType) {
    return badRequest('eventType is required');
  }

  const ua = request.headers.get('user-agent') || '';
  const uaParsed = parseUserAgent(body.platform ? ua : ua); // always parse UA
  const ipHint = parseIpHint(request);

  // Merge client-provided platform info with UA-derived info
  const platform    = body.platform    || uaParsed.platform;
  const os          = body.os          || uaParsed.os;
  const deviceType  = body.deviceType  || uaParsed.deviceType;

  // Optionally resolve userId from Bearer token (non-blocking)
  let userId: string | null = null;
  try {
    const token = parseBearerToken(request);
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload) {
        const jwtAuth = authFromJwtPayload(token, payload);
        if (jwtAuth?.userId) {
          const profile = await getUserByAuthUserId(env, jwtAuth.userId);
          userId = profile?.id ?? null;
        }
      }
    }
  } catch { /* ignore auth errors — analytics logging should never fail */ }

  const event = await logEventService(
    env,
    { source: body.source, eventType: body.eventType, page: body.page, platform, os, deviceType, sessionId: body.sessionId },
    userId,
    ua || null,
    ipHint || null,
  );

  return json({ message: 'Event logged', data: event }, 201);
}

export async function handleGetAnalytics(env: Env, request: Request) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '7', 10);
  const summary = await getAnalyticsSummaryService(env, isNaN(days) ? 7 : days);
  return json({ data: summary });
}
