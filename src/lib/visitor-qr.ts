const GUEST_PREFIX = 'portl:guest:';
const STAFF_PREFIX = 'portl:staff:';

export function buildGuestQrPayload(qrToken: string): string {
  return `${GUEST_PREFIX}${qrToken}`;
}

export function buildStaffQrPayload(passToken: string): string {
  return `${STAFF_PREFIX}${passToken}`;
}

export function parseQrPayload(
  raw: string,
): { kind: 'guest'; token: string } | { kind: 'staff'; token: string } | null {
  const value = raw.trim();
  if (value.startsWith(GUEST_PREFIX)) {
    const token = value.slice(GUEST_PREFIX.length).trim();
    return token ? { kind: 'guest', token } : null;
  }
  if (value.startsWith(STAFF_PREFIX)) {
    const token = value.slice(STAFF_PREFIX.length).trim();
    return token ? { kind: 'staff', token } : null;
  }
  // Bare UUID — treat as guest token (manual entry)
  if (/^[0-9a-f-]{36}$/i.test(value)) {
    return { kind: 'guest', token: value };
  }
  return null;
}

export function guestQrExpiresAt(hours = 24): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function isGuestQrExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function remainingScans(visitor: {
  max_scans: number;
  scan_count: number;
}): number {
  return Math.max(0, visitor.max_scans - visitor.scan_count);
}
