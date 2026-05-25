export function formatPhoneBR(value: string, maxDigits = 11): string {
  const digits = value.replace(/\D/g, '').slice(0, Math.max(0, maxDigits));

  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length === 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export default formatPhoneBR;