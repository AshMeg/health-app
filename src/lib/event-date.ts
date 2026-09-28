/**
 * Bloom's universal event-date helpers. Every record stores when it
 * happened (`at`) separately from when it was entered (`loggedAt`).
 * Dates are the user's local calendar day, so 23:30 never slips a day.
 */

export function todayLocal() {
  return localDay(new Date());
}

export function localDay(at: string | Date) {
  const d = typeof at === "string" ? new Date(at) : at;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** ISO timestamp for a local date, at the chosen time — or now for today, midday for other days. */
export function eventAt(date: string, time?: string) {
  if (time) return new Date(`${date}T${time}:00`).toISOString();
  if (date === todayLocal()) return new Date().toISOString();
  return new Date(`${date}T12:00:00`).toISOString();
}

export function isFuture(date: string, time?: string) {
  if (date > todayLocal()) return true;
  if (date === todayLocal() && time) return new Date(`${date}T${time}:00`).getTime() > Date.now() + 60_000;
  return false;
}

export const FUTURE_MESSAGE = "This record needs to be dated today or earlier.";

export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDay(d);
}

export function formatDay(date: string) {
  const today = todayLocal();
  if (date === today) return "Today";
  if (date === shiftDate(today, -1)) return "Yesterday";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: date.slice(0, 4) === today.slice(0, 4) ? undefined : "numeric",
  });
}
