import { optionalString, requiredString } from '../lib/validate';

export function validateCreateRouteBody(body: any) {
  const routeName = requiredString(body?.routeName, 'routeName');
  if (!routeName.ok) return routeName;

  return {
    ok: true as const,
    data: {
      routeCode:     optionalString(body?.routeCode),
      routeName:     routeName.data,
      startLocation: optionalString(body?.startLocation),
      endLocation:   optionalString(body?.endLocation),
      startCoords:   optionalString(body?.startCoords),
      endCoords:     optionalString(body?.endCoords),
      routePolyline: optionalString(body?.routePolyline),
      zoneId:        optionalString(body?.zoneId),
      status:        optionalString(body?.status),
    },
  };
}
