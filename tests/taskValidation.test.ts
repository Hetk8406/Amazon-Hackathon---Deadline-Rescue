import { describe, it, expect } from 'vitest';
import {
  validateTask,
  validateTasks,
  validateAvailabilityWindow,
  validateAvailabilityWindows,
} from '../src/features/tasks/taskValidation';

describe('taskValidation', () => {
  it('accepts a valid task', () => {
    const input = {
      id: 'task-1',
      title: 'Complete Homework',
      estimatedMinutes: 60,
      priority: 'high',
      deadline: '2026-10-21T18:00:00.000Z',
      completed: false,
    };
    const res = validateTask(input);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.id).toBe('task-1');
      expect(res.data.estimatedMinutes).toBe(60);
    }
  });

  it('rejects missing or empty title', () => {
    const res1 = validateTask({ id: '1', title: '', estimatedMinutes: 30, priority: 'medium' });
    expect(res1.success).toBe(false);

    const res2 = validateTask({ id: '1', title: '   ', estimatedMinutes: 30, priority: 'medium' });
    expect(res2.success).toBe(false);
  });

  it('rejects invalid durations (zero, negative, fractional, NaN, infinity)', () => {
    const testCases = [0, -15, 45.5, Number.NaN, Number.POSITIVE_INFINITY, '60'];

    for (const val of testCases) {
      const res = validateTask({
        id: '1',
        title: 'Task',
        estimatedMinutes: val,
        priority: 'medium',
      });
      expect(res.success).toBe(false);
    }
  });

  it('rejects invalid priorities', () => {
    const res = validateTask({
      id: '1',
      title: 'Task',
      estimatedMinutes: 30,
      priority: 'urgent', // not high/medium/low
    });
    expect(res.success).toBe(false);
  });

  it('rejects malformed deadlines', () => {
    const res = validateTask({
      id: '1',
      title: 'Task',
      estimatedMinutes: 30,
      priority: 'medium',
      deadline: 'tomorrow at 5pm',
    });
    expect(res.success).toBe(false);
  });

  it('detects duplicate task IDs in validateTasks', () => {
    const tasks = [
      { id: 't1', title: 'Task 1', estimatedMinutes: 30, priority: 'high', completed: false },
      { id: 't1', title: 'Task 2 (duplicate)', estimatedMinutes: 45, priority: 'low', completed: false },
    ];
    const res = validateTasks(tasks);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors[0].message).toMatch(/Duplicate task ID/);
    }
  });

  it('validates availability windows and catches reversed start/end', () => {
    const valid = validateAvailabilityWindow({
      start: '2026-10-21T09:00:00.000Z',
      end: '2026-10-21T12:00:00.000Z',
    });
    expect(valid.success).toBe(true);

    const reversed = validateAvailabilityWindow({
      start: '2026-10-21T12:00:00.000Z',
      end: '2026-10-21T09:00:00.000Z',
    });
    expect(reversed.success).toBe(false);

    const equalTimes = validateAvailabilityWindow({
      start: '2026-10-21T12:00:00.000Z',
      end: '2026-10-21T12:00:00.000Z',
    });
    expect(equalTimes.success).toBe(false);
  });

  it('validates an array of availability windows', () => {
    const windows = [
      { start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T11:00:00.000Z' },
      { start: '2026-10-21T13:00:00.000Z', end: '2026-10-21T15:00:00.000Z' },
    ];
    const res = validateAvailabilityWindows(windows);
    expect(res.success).toBe(true);
  });
});
