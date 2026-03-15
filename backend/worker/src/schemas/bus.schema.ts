import { optionalString, requiredString } from '../lib/validate';

export function validateCreateBusBody(body: any) {
  const plateNumber = requiredString(body?.plateNumber, 'plateNumber');
  if (!plateNumber.ok) return plateNumber;

  return {
    ok: true as const,
    data: {
      plateNumber: plateNumber.data,
      routeId: optionalString(body?.routeId),
      driverId: optionalString(body?.driverId),
      status: optionalString(body?.status),
    },
  };
}
