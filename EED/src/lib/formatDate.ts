export function formatDateBR(value?: string | null): string {
  if (!value) return '—';

  // Try ISO / RFC date parsing first
  let d: Date | null = null;
  try {
    // If already contains slash, try to parse d/m/Y or d/m/y
    if (value.indexOf('/') >= 0) {
      const parts = value.split('/').map(p => p.trim());
      if (parts.length >= 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];
        // normalize two-digit year to 20YY if reasonable
        if (year.length === 2) {
          const y = parseInt(year, 10);
          year = (y > 50 ? 1900 + y : 2000 + y).toString();
        }
        const iso = `${year.padStart(4,'0')}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
        d = new Date(iso);
      }
    } else {
      d = new Date(value);
    }
  } catch (e) {
    d = null;
  }

  if (!d || Number.isNaN(d.getTime())) return String(value);

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

export default formatDateBR;
