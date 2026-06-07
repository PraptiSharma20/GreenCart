const INDIAN_PHONE = /^[6-9]\d{9}$/;

export function normalizePhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidIndianPhone(phone) {
  return INDIAN_PHONE.test(normalizePhone(phone));
}

export function isValidEmailOptional(email) {
  if (!email || !String(email).trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}
