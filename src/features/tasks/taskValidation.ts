import type { Task, TimeWindow, Priority } from './taskTypes';
import { isValidIsoDate, parseIso } from '../../lib/dateTime';

export type ValidationError = {
  field: string;
  message: string;
  received?: unknown;
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low'];

/**
 * Validates a single Task object.
 */
export function validateTask(input: unknown): ValidationResult<Task> {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== 'object') {
    return {
      success: false,
      errors: [{ field: 'task', message: 'Task must be an object', received: input }],
    };
  }

  const raw = input as Record<string, unknown>;

  // Validate ID
  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Task id must be a non-empty string',
      received: raw.id,
    });
  }

  // Validate Title
  if (typeof raw.title !== 'string' || raw.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'Task title must be a non-empty string',
      received: raw.title,
    });
  }

  // Validate estimatedMinutes (must be positive integer)
  if (
    typeof raw.estimatedMinutes !== 'number' ||
    !Number.isFinite(raw.estimatedMinutes) ||
    !Number.isInteger(raw.estimatedMinutes) ||
    raw.estimatedMinutes <= 0
  ) {
    errors.push({
      field: 'estimatedMinutes',
      message: 'Task duration must be a positive integer in minutes (> 0)',
      received: raw.estimatedMinutes,
    });
  }

  // Validate Priority
  if (
    typeof raw.priority !== 'string' ||
    !VALID_PRIORITIES.includes(raw.priority as Priority)
  ) {
    errors.push({
      field: 'priority',
      message: `Task priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
      received: raw.priority,
    });
  }

  // Validate Deadline (optional, but if present must be valid ISO)
  if (raw.deadline !== undefined && raw.deadline !== null && raw.deadline !== '') {
    if (!isValidIsoDate(raw.deadline)) {
      errors.push({
        field: 'deadline',
        message: 'Task deadline must be a valid ISO 8601 date-time string',
        received: raw.deadline,
      });
    }
  }

  // Validate completed (boolean)
  if (raw.completed !== undefined && typeof raw.completed !== 'boolean') {
    errors.push({
      field: 'completed',
      message: 'Task completed field must be a boolean',
      received: raw.completed,
    });
  }

  // Validate pinned (optional boolean)
  if (raw.pinned !== undefined && typeof raw.pinned !== 'boolean') {
    errors.push({
      field: 'pinned',
      message: 'Task pinned field must be a boolean if provided',
      received: raw.pinned,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const task: Task = {
    id: (raw.id as string).trim(),
    title: (raw.title as string).trim(),
    estimatedMinutes: raw.estimatedMinutes as number,
    priority: raw.priority as Priority,
    completed: Boolean(raw.completed),
    ...(raw.deadline ? { deadline: (raw.deadline as string).trim() } : {}),
    ...(raw.pinned !== undefined ? { pinned: raw.pinned as boolean } : {}),
  };

  return { success: true, data: task };
}

/**
 * Validates an array of tasks, ensuring each is valid and IDs are unique.
 */
export function validateTasks(input: unknown): ValidationResult<Task[]> {
  if (!Array.isArray(input)) {
    return {
      success: false,
      errors: [{ field: 'tasks', message: 'Tasks input must be an array', received: input }],
    };
  }

  const errors: ValidationError[] = [];
  const validTasks: Task[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const result = validateTask(item);

    if (!result.success) {
      for (const err of result.errors) {
        errors.push({
          field: `tasks[${i}].${err.field}`,
          message: err.message,
          received: err.received,
        });
      }
    } else {
      const task = result.data;
      if (seenIds.has(task.id)) {
        errors.push({
          field: `tasks[${i}].id`,
          message: `Duplicate task ID detected: "${task.id}"`,
          received: task.id,
        });
      } else {
        seenIds.add(task.id);
        validTasks.push(task);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: validTasks };
}

/**
 * Validates a single TimeWindow.
 */
export function validateAvailabilityWindow(input: unknown): ValidationResult<TimeWindow> {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== 'object') {
    return {
      success: false,
      errors: [{ field: 'window', message: 'Window must be an object', received: input }],
    };
  }

  const raw = input as Record<string, unknown>;

  if (!isValidIsoDate(raw.start)) {
    errors.push({
      field: 'start',
      message: 'Window start must be a valid ISO 8601 date-time string',
      received: raw.start,
    });
  }

  if (!isValidIsoDate(raw.end)) {
    errors.push({
      field: 'end',
      message: 'Window end must be a valid ISO 8601 date-time string',
      received: raw.end,
    });
  }

  if (errors.length === 0) {
    const startTs = parseIso(raw.start as string);
    const endTs = parseIso(raw.end as string);
    if (endTs <= startTs) {
      errors.push({
        field: 'end',
        message: 'Window end must be strictly after start',
        received: { start: raw.start, end: raw.end },
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      start: (raw.start as string).trim(),
      end: (raw.end as string).trim(),
    },
  };
}

/**
 * Validates an array of availability windows.
 */
export function validateAvailabilityWindows(input: unknown): ValidationResult<TimeWindow[]> {
  if (!Array.isArray(input)) {
    return {
      success: false,
      errors: [{ field: 'availability', message: 'Availability must be an array', received: input }],
    };
  }

  const errors: ValidationError[] = [];
  const validWindows: TimeWindow[] = [];

  for (let i = 0; i < input.length; i++) {
    const res = validateAvailabilityWindow(input[i]);
    if (!res.success) {
      for (const err of res.errors) {
        errors.push({
          field: `availability[${i}].${err.field}`,
          message: err.message,
          received: err.received,
        });
      }
    } else {
      validWindows.push(res.data);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: validWindows };
}
