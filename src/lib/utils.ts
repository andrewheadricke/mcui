function formatTimeDifference(date1: number): string {
  if (date1 == null || date1 == 0) {
    return ""
  }
  const diffMs = new Date().getTime() - new Date(date1 * 1000).getTime();
  const absDiffMs = Math.abs(diffMs);
  const sign = diffMs < 0 ? 1 : -1; // For 'in X' or 'X ago'

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absDiffMs < 1000 * 60) { // Less than a minute
      const seconds = Math.round(absDiffMs / 1000);
      return rtf.format(sign * seconds, 'second');
  } else if (absDiffMs < 1000 * 60 * 60) { // Less than an hour
      const minutes = Math.round(absDiffMs / (1000 * 60));
      return rtf.format(sign * minutes, 'minute');
  } else if (absDiffMs < 1000 * 60 * 60 * 24) { // Less than a day
      const hours = Math.round(absDiffMs / (1000 * 60 * 60));
      return rtf.format(sign * hours, 'hour');
  } else if (absDiffMs < 1000 * 60 * 60 * 24 * 7) { // Less than a week
      const days = Math.round(absDiffMs / (1000 * 60 * 60 * 24));
      return rtf.format(sign * days, 'day');
  } else if (absDiffMs < 1000 * 60 * 60 * 24 * 30) { // Less than a month (approx)
      const weeks = Math.round(absDiffMs / (1000 * 60 * 60 * 24 * 7));
      return rtf.format(sign * weeks, 'week');
  } else if (absDiffMs < 1000 * 60 * 60 * 24 * 365) { // Less than a year (approx)
      const months = Math.round(absDiffMs / (1000 * 60 * 60 * 24 * 30)); // Using 30 days per month for simplicity
      return rtf.format(sign * months, 'month');
  } else {
      const years = Math.round(absDiffMs / (1000 * 60 * 60 * 24 * 365));
      return rtf.format(sign * years, 'year');
  }
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return rgbFractionToString({ r: f(0), g: f(8), b: f(4) });
};

function rgbFractionToString(rgb) {
  const to255 = x => Math.max(0, Math.min(1, x)); // clamp 0–1
  const R = Math.round(to255(rgb.r) * 255);
  const G = Math.round(to255(rgb.g) * 255);
  const B = Math.round(to255(rgb.b) * 255);
  
  return `rgb(${R}, ${G}, ${B})`;
}

export {
  formatTimeDifference,
  hslToRgb
}