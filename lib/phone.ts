const E164_RE = /^\+[1-9]\d{1,14}$/;

/**
 * Normalizes user-entered digits/punctuation into an E.164 candidate.
 * Assumes US/CA numbers (10 digits -> +1XXXXXXXXXX) when no country code
 * is given, since that matches SIGNALWIRE_PHONE_NUMBER's own format.
 */
export function toE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const candidate = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return E164_RE.test(candidate) ? candidate : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return toE164(`+1${digits}`);
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return toE164(`+${digits}`);
  }
  return null;
}

export function isValidE164(value: string): boolean {
  return E164_RE.test(value);
}
