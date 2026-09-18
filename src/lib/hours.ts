import type { Schedule } from "@/types";

export type OpenStatus = "open" | "closed" | "unknown";

const HOURS = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/;

// Kazakhstan has been on a single UTC+5 zone since March 2024. Using a fixed
// offset keeps "open now" right for Astana whatever the visitor's own timezone.
const ASTANA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

function astanaClock(now: Date) {
  const shifted = new Date(now.getTime() + ASTANA_UTC_OFFSET_MS);
  return {
    day: shifted.getUTCDay(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export function todaysHours(schedule: Schedule | null, now = new Date()): string | null {
  if (!schedule) return null;
  const { day } = astanaClock(now);
  if (day === 0) return schedule.sunday;
  if (day === 6) return schedule.saturday;
  return schedule.weekdays || null;
}

export function openStatus(schedule: Schedule | null, now = new Date()): OpenStatus {
  if (!schedule || (!schedule.weekdays && !schedule.saturday && !schedule.sunday)) {
    return "unknown";
  }

  const hours = todaysHours(schedule, now);
  if (!hours) return "closed";

  const match = HOURS.exec(hours);
  if (!match) return "unknown";

  const [openH, openM, closeH, closeM] = match.slice(1).map(Number);
  const { minutes } = astanaClock(now);
  return openH * 60 + openM <= minutes && minutes < closeH * 60 + closeM ? "open" : "closed";
}
