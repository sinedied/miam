/**
 * Formats a duration in minutes for display. Durations under an hour are shown in
 * minutes (e.g. "45 min"); an hour or more is shown in hours, with the remaining
 * minutes zero-padded (e.g. 90 → "1h30", 65 → "1h05", 120 → "2h").
 */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "0 min";
  }

  const whole = Math.round(minutes);
  if (whole < 60) {
    return `${whole} min`;
  }

  const hours = Math.floor(whole / 60);
  const remainder = whole % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h${String(remainder).padStart(2, "0")}`;
}
