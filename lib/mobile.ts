export function normalizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");

  if (digits.length < 10) {
    throw new Error("Invalid mobile number");
  }

  if (mobile.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return `+${digits}`;
}

export function isValidMobile(mobile: string): boolean {
  try {
    const normalized = normalizeMobile(mobile);
    return normalized.length >= 12 && normalized.length <= 15;
  } catch {
    return false;
  }
}
