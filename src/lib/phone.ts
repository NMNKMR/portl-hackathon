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

/** Display +91 XXXXX XXXXX from Auth/DB values with or without +. */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return 'No phone';
  const d = digitsOnly(phone);
  const ten =
    d.length === 12 && d.startsWith('91')
      ? d.slice(2)
      : d.length === 10
        ? d
        : d.length > 10
          ? d.slice(-10)
          : d;
  if (ten.length !== 10) return phone;
  return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}
