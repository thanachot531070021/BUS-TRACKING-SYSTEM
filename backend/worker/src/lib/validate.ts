export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function requiredString(value: unknown, field: string): ValidationResult<string> {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, error: `${field} is required` };
  }
  return { ok: true, data: value.trim() };
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function requiredNumber(value: unknown, field: string): ValidationResult<number> {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { ok: false, error: `${field} must be a valid number` };
  }
  return { ok: true, data: value };
}

export function oneOf<T extends string>(value: unknown, field: string, allowed: T[]): ValidationResult<T> {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    return { ok: false, error: `${field} must be one of: ${allowed.join(', ')}` };
  }
  return { ok: true, data: value as T };
}
