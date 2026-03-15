import { requiredNumber, requiredString } from '../lib/validate';

export function validateCreateWaitingBody(body: any) {
  const routeId = requiredString(body?.routeId, 'routeId');
  if (!routeId.ok) return routeId;
  const lat = requiredNumber(body?.lat, 'lat');
  if (!lat.ok) return lat;
  const lng = requiredNumber(body?.lng, 'lng');
  if (!lng.ok) return lng;

  return {
    ok: true as const,
    data: {
      routeId: routeId.data,
      lat: lat.data,
      lng: lng.data,
      userId: typeof body?.userId === 'string' ? body.userId : undefined,
    },
  };
}
