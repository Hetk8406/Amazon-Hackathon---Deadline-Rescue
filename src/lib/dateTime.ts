import type { TimeWindow } from '../features/tasks/taskTypes';

/**
 * Validates if a string is a parseable ISO date string.
 */
export function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  // Basic ISO regex check to avoid accepting arbitrary strings like "2026"
  const isoPattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
  return isoPattern.test(value.trim());
}

/**
 * Parses an ISO string into millisecond epoch timestamp.
 * Throws an Error if invalid.
 */
export function parseIso(iso: string): number {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) {
    throw new Error(`Invalid ISO date string: "${iso}"`);
  }
  return ts;
}

/**
 * Formats a millisecond timestamp into a standard ISO 8601 string.
 */
export function formatIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Adds an integer number of minutes to an ISO string, returning a new ISO string.
 */
export function addMinutes(iso: string, minutes: number): string {
  const ts = parseIso(iso);
  const resultTs = ts + Math.round(minutes) * 60 * 1000;
  return formatIso(resultTs);
}

/**
 * Formats a duration in minutes into a human-friendly string (e.g. "2h", "1h 30m", "45m").
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (hours > 0 && remainingMins > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${remainingMins}m`;
}

/**
 * Formats an ISO string to a 24h time string (e.g. "09:00").
 * Uses UTC methods to guarantee timezone-agnostic deterministic rendering across machines.
 */
export function formatTimeOnly(iso: string): string {
  const date = new Date(parseIso(iso));
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats an ISO string into short date and time (e.g. "21 Oct, 09:00").
 */
export function formatDateTimeShort(iso: string): string {
  const date = new Date(parseIso(iso));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const time = formatTimeOnly(iso);
  return `${day} ${month}, ${time}`;
}

/**
 * Formats an ISO string into friendly 12h time (e.g. "3:00 PM", "9:00 AM").
 * Handles invalid, empty, or missing timestamps safely.
 */
export function formatTimeFriendly(iso?: string | null): string {
  if (!iso || !isValidIsoDate(iso)) {
    return '';
  }
  try {
    const date = new Date(parseIso(iso));
    const rawHours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const period = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;

    return `${hours12}:${minutes} ${period}`;
  } catch {
    return '';
  }
}

/**
 * Formats an ISO string into friendly date and time (e.g. "21 Oct, 3:00 PM").
 * Uses UTC methods to guarantee timezone-agnostic deterministic rendering across machines.
 * Handles invalid, empty, or missing timestamps safely.
 */
export function formatDateTimeFriendly(iso?: string | null): string {
  if (!iso || !isValidIsoDate(iso)) {
    return '';
  }
  try {
    const date = new Date(parseIso(iso));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const timeStr = formatTimeFriendly(iso);

    return `${day} ${month}, ${timeStr}`;
  } catch {
    return '';
  }
}

/**
 * Scans a text string and replaces any embedded raw ISO 8601 timestamps
 * with friendly formatted dates (e.g. "2026-10-21T15:00:00.000Z" -> "21 Oct, 3:00 PM").
 */
export function formatIsoInText(text: string): string {
  if (!text) return '';
  const isoRegex = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?\b/g;
  return text.replace(isoRegex, (match) => {
    const formatted = formatDateTimeFriendly(match);
    return formatted || match;
  });
}

/**
 * Calculates the difference in integer minutes from startIso to endIso (end - start).
 */
export function diffInMinutes(startIso: string, endIso: string): number {
  const startTs = parseIso(startIso);
  const endTs = parseIso(endIso);
  return Math.round((endTs - startTs) / (60 * 1000));
}

/**
 * Returns true if isoA is strictly before isoB.
 */
export function isBefore(isoA: string, isoB: string): boolean {
  return parseIso(isoA) < parseIso(isoB);
}

/**
 * Returns true if isoA is strictly after isoB.
 */
export function isAfter(isoA: string, isoB: string): boolean {
  return parseIso(isoA) > parseIso(isoB);
}

/**
 * Returns true if isoA is less than or equal to isoB.
 */
export function isEqualOrBefore(isoA: string, isoB: string): boolean {
  return parseIso(isoA) <= parseIso(isoB);
}

/**
 * Returns true if isoA is greater than or equal to isoB.
 */
export function isEqualOrAfter(isoA: string, isoB: string): boolean {
  return parseIso(isoA) >= parseIso(isoB);
}

/**
 * Normalizes a list of availability windows:
 * 1. Validates each window (end must be strictly after start).
 * 2. Sorts windows chronologically by start.
 * 3. Merges overlapping or contiguous windows.
 * Returns a new list of disjoint, chronologically sorted TimeWindows.
 */
export function normalizeWindows(windows: TimeWindow[]): TimeWindow[] {
  if (windows.length === 0) {
    return [];
  }

  // Validate each window
  for (const w of windows) {
    const startTs = parseIso(w.start);
    const endTs = parseIso(w.end);
    if (endTs <= startTs) {
      throw new Error(`Availability window end (${w.end}) must be strictly after start (${w.start}).`);
    }
  }

  // Sort by start timestamp ascending, then end timestamp ascending
  const sorted = [...windows].sort((a, b) => {
    const diff = parseIso(a.start) - parseIso(b.start);
    if (diff !== 0) return diff;
    return parseIso(a.end) - parseIso(b.end);
  });

  const merged: TimeWindow[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const currentEndTs = parseIso(current.end);
    const nextStartTs = parseIso(next.start);
    const nextEndTs = parseIso(next.end);

    if (nextStartTs <= currentEndTs) {
      // Overlapping or adjacent: merge them
      if (nextEndTs > currentEndTs) {
        current.end = next.end;
      }
    } else {
      // Disjoint: push current and advance
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  return merged;
}
