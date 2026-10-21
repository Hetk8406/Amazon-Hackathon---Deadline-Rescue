import { describe, it, expect } from 'vitest';
import {
  isValidIsoDate,
  parseIso,
  formatIso,
  addMinutes,
  diffInMinutes,
  isBefore,
  isAfter,
  isEqualOrBefore,
  normalizeWindows,
  formatTimeOnly,
  formatDateTimeShort,
  formatTimeFriendly,
  formatDateTimeFriendly,
  formatIsoInText,
} from '../src/lib/dateTime';
import { createDemoScenario } from '../src/data/demoScenario';
import { scheduleTasks } from '../src/features/planning/scheduler';
import { checkPlanFeasibility } from '../src/features/planning/feasibility';

describe('dateTime utility', () => {
  it('validates ISO date strings', () => {
    expect(isValidIsoDate('2026-10-21T10:00:00.000Z')).toBe(true);
    expect(isValidIsoDate('2026-10-21T10:00:00Z')).toBe(true);
    expect(isValidIsoDate('2026-10-21')).toBe(true);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate('invalid-date')).toBe(false);
    expect(isValidIsoDate(12345)).toBe(false);
  });

  it('parses and formats ISO timestamps', () => {
    const iso = '2026-10-21T10:00:00.000Z';
    const ts = parseIso(iso);
    expect(formatIso(ts)).toBe(iso);
    expect(() => parseIso('not-a-date')).toThrow(/Invalid ISO date string/);
  });

  it('adds minutes correctly and calculates difference in minutes', () => {
    const start = '2026-10-21T10:00:00.000Z';
    const result = addMinutes(start, 90);
    expect(result).toBe('2026-10-21T11:30:00.000Z');
    expect(diffInMinutes(start, result)).toBe(90);
  });

  it('compares dates accurately', () => {
    const early = '2026-10-21T09:00:00.000Z';
    const late = '2026-10-21T12:00:00.000Z';

    expect(isBefore(early, late)).toBe(true);
    expect(isAfter(late, early)).toBe(true);
    expect(isEqualOrBefore(early, early)).toBe(true);
    expect(isEqualOrBefore(early, late)).toBe(true);
    expect(isEqualOrBefore(late, early)).toBe(false);
  });

  it('normalizes, sorts, and merges overlapping or contiguous availability windows', () => {
    const rawWindows = [
      { start: '2026-10-21T14:00:00.000Z', end: '2026-10-21T16:00:00.000Z' },
      { start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T11:00:00.000Z' },
      { start: '2026-10-21T10:30:00.000Z', end: '2026-10-21T12:00:00.000Z' }, // Overlaps 9-11
    ];

    const normalized = normalizeWindows(rawWindows);
    expect(normalized).toHaveLength(2);
    // Merged window 1: 09:00 to 12:00
    expect(normalized[0]).toEqual({
      start: '2026-10-21T09:00:00.000Z',
      end: '2026-10-21T12:00:00.000Z',
    });
    // Window 2: 14:00 to 16:00
    expect(normalized[1]).toEqual({
      start: '2026-10-21T14:00:00.000Z',
      end: '2026-10-21T16:00:00.000Z',
    });
  });

  it('throws when an availability window has end before or equal to start', () => {
    const invalidWindow = [
      { start: '2026-10-21T12:00:00.000Z', end: '2026-10-21T10:00:00.000Z' },
    ];
    expect(() => normalizeWindows(invalidWindow)).toThrow(/must be strictly after start/);
  });

  describe('friendly date and time formatting', () => {
    it('formats 24-hour time and short date strings correctly', () => {
      expect(formatTimeOnly('2026-10-21T09:00:00.000Z')).toBe('09:00');
      expect(formatTimeOnly('2026-10-21T15:30:00.000Z')).toBe('15:30');
      expect(formatDateTimeShort('2026-10-21T09:00:00.000Z')).toBe('21 Oct, 09:00');
    });

    it('formats time in 12-hour AM/PM format safely', () => {
      expect(formatTimeFriendly('2026-10-21T09:00:00.000Z')).toBe('9:00 AM');
      expect(formatTimeFriendly('2026-10-21T12:00:00.000Z')).toBe('12:00 PM');
      expect(formatTimeFriendly('2026-10-21T15:30:00.000Z')).toBe('3:30 PM');
      expect(formatTimeFriendly('2026-10-21T00:05:00.000Z')).toBe('12:05 AM');
      expect(formatTimeFriendly(undefined)).toBe('');
      expect(formatTimeFriendly('invalid-time')).toBe('');
    });

    it('formats full date and time in friendly format safely', () => {
      expect(formatDateTimeFriendly('2026-10-21T15:00:00.000Z')).toBe('21 Oct, 3:00 PM');
      expect(formatDateTimeFriendly('2026-10-21T09:30:00.000Z')).toBe('21 Oct, 9:30 AM');
      expect(formatDateTimeFriendly(null)).toBe('');
      expect(formatDateTimeFriendly('')).toBe('');
      expect(formatDateTimeFriendly('malformed')).toBe('');
    });

    it('replaces raw embedded ISO timestamps in sentences with friendly formatting', () => {
      const rawText = 'Task cannot be completed before its deadline (2026-10-21T15:00:00.000Z).';
      const formatted = formatIsoInText(rawText);
      expect(formatted).toBe('Task cannot be completed before its deadline (21 Oct, 3:00 PM).');
      expect(formatIsoInText('')).toBe('');
      expect(formatIsoInText('No dates here!')).toBe('No dates here!');
    });
  });

  describe('demo scenario date reliability', () => {
    it('generates coherent demo scenarios for any target date preserving all offsets and deficit', () => {
      const demoDefault = createDemoScenario();
      expect(demoDefault.referenceTime).toBe('2026-10-21T08:30:00.000Z');
      expect(demoDefault.tasks).toHaveLength(4);

      // Generate scenario on another date (e.g. 2026-11-15)
      const demoOtherDate = createDemoScenario('2026-11-15');
      expect(demoOtherDate.referenceTime).toBe('2026-11-15T08:30:00.000Z');
      expect(demoOtherDate.availability[0].start).toBe('2026-11-15T09:00:00.000Z');
      expect(demoOtherDate.availability[0].end).toBe('2026-11-15T12:00:00.000Z');

      // Verify scheduling outcome is identical: exactly 3 tasks scheduled, 1 unscheduled
      const plan = scheduleTasks({
        tasks: demoOtherDate.tasks,
        availability: demoOtherDate.availability,
        referenceTime: demoOtherDate.referenceTime,
      });

      expect(plan.blocks).toHaveLength(3);
      expect(plan.unscheduledTasks).toHaveLength(1);
      expect(plan.unscheduledTasks[0].task.id).toBe('demo-task-4'); // Calculus

      // Feasibility reports identical 60m deficit
      const feasibility = checkPlanFeasibility(plan, demoOtherDate.availability, demoOtherDate.referenceTime);
      expect(feasibility.isFeasible).toBe(false);
      expect(feasibility.metrics.netDeficitMinutes).toBe(60);
    });
  });
});
