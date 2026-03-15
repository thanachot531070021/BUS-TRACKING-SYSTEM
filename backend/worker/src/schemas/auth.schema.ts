import { oneOf, optionalString, requiredString } from '../lib/validate';

export function validateRegisterBody(body: any) {
  const email = requiredString(body?.email, 'email');
  if (!email.ok) return email;
  const password = requiredString(body?.password, 'password');
  if (!password.ok) return password;

  return {
    ok: true as const,
    data: {
      email: email.data,
      password: password.data,
      username: optionalString(body?.username),
      fullName: optionalString(body?.fullName),
      role: typeof body?.role === 'string' ? body.role : undefined,
    },
  };
}

export function validateLoginBody(body: any) {
  const identifier = requiredString(body?.identifier, 'identifier');
  if (!identifier.ok) return identifier;
  const password = requiredString(body?.password, 'password');
  if (!password.ok) return password;

  const expectedRole = body?.expectedRole
    ? oneOf(body.expectedRole, 'expectedRole', ['passenger', 'driver', 'admin'])
    : null;
  if (expectedRole && !expectedRole.ok) return expectedRole;

  return {
    ok: true as const,
    data: {
      identifier: identifier.data,
      password: password.data,
      expectedRole: expectedRole?.ok ? expectedRole.data : undefined,
    },
  };
}
