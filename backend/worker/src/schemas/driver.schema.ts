import { oneOf, requiredNumber, requiredString } from '../lib/validate';

export function validateDriverDutyBody(body: any) {
  const busId = requiredString(body?.busId, 'busId');
  if (!busId.ok) return busId;
  const status = oneOf(body?.status, 'status', ['on', 'off']);
  if (!status.ok) return status;

  return { ok: true as const, data: { busId: busId.data, status: status.data } };
}

export function validateLocationBody(body: any) {
  const busId = requiredString(body?.busId, 'busId');
  if (!busId.ok) return busId;
  const lat = requiredNumber(body?.lat, 'lat');
  if (!lat.ok) return lat;
  const lng = requiredNumber(body?.lng, 'lng');
  if (!lng.ok) return lng;

  return {
    ok: true as const,
    data: {
      busId: busId.data,
      lat: lat.data,
      lng: lng.data,
      speed: typeof body?.speed === 'number' ? body.speed : undefined,
    },
  };
}
