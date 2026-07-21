/** Indian mobile helpers — UI collects 10-digit local; Auth uses E.164. */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidIndiaMobile(local: string): boolean {
  const d = digitsOnly(local);
  return d.length === 10 && /^[6-9]/.test(d);
}

export function toE164India(local: string): string {
  const d = digitsOnly(local);
  if (!isValidIndiaMobile(d)) {
    throw new Error('Enter a valid 10-digit Indian mobile number');
  }
  return `+91${d}`;
}
