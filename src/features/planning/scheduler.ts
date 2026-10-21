import type {
  Task,
  TimeWindow,
  ScheduleBlock,
  Plan,
  UnscheduledTask,
  SchedulingIssue,
  Priority,
} from '../tasks/taskTypes';
import { validateTasks, validateAvailabilityWindows } from '../tasks/taskValidation';
import {
  parseIso,
  addMinutes,
  isBefore,
  isEqualOrBefore,
  normalizeWindows,
  formatDateTimeFriendly,
} from '../../lib/dateTime';

export type SchedulerInput = {
  tasks: Task[];
  availability: TimeWindow[];
  referenceTime?: string; // Explicit baseline ISO timestamp
  planId?: string;
};

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Deterministic comparison function to sort tasks for scheduling:
 * 1. Tasks with deadlines come before tasks without deadlines.
 * 2. Earlier deadline comes first (Earliest Deadline First / EDF).
 * 3. Higher priority comes first ('high' > 'medium' > 'low').
 * 4. Stable tie-breaker: task id alphabetical order.
 */
export function compareTasksForScheduling(a: Task, b: Task): number {
  const aHasDeadline = Boolean(a.deadline);
  const bHasDeadline = Boolean(b.deadline);

  if (aHasDeadline && bHasDeadline) {
    const aTs = parseIso(a.deadline!);
    const bTs = parseIso(b.deadline!);
    if (aTs !== bTs) {
      return aTs - bTs;
    }
  } else if (aHasDeadline && !bHasDeadline) {
    return -1; // a goes first
  } else if (!aHasDeadline && bHasDeadline) {
    return 1;  // b goes first
  }

  // Next tie-breaker: Priority
  const aWeight = PRIORITY_WEIGHTS[a.priority] ?? 0;
  const bWeight = PRIORITY_WEIGHTS[b.priority] ?? 0;
  if (aWeight !== bWeight) {
    return bWeight - aWeight; // Descending weight
  }

  // Final deterministic tie-breaker: Task ID
  return a.id.localeCompare(b.id);
}

type AvailableSlot = {
  start: string;
  end: string;
};

/**
 * Pure, deterministic task scheduling engine.
 *
 * Adheres strictly to the following principles:
 * - Deterministic: Identical inputs always yield identical output.
 * - Non-overlapping: Schedule blocks never collide or overlap.
 * - Respects availability: Blocks only exist within supplied availability windows.
 * - Respects deadlines: Work is never scheduled to end after its deadline.
 * - Non-discarding: Every unscheduled task is preserved with a structured reason.
 * - No implicit clock: Uses explicit referenceTime or window start.
 */
export function scheduleTasks(input: SchedulerInput): Plan {
  // Validate inputs
  const taskValidation = validateTasks(input.tasks);
  if (!taskValidation.success) {
    const errMessages = taskValidation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Invalid tasks supplied to scheduler: ${errMessages}`);
  }

  const windowValidation = validateAvailabilityWindows(input.availability);
  if (!windowValidation.success) {
    const errMessages = windowValidation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Invalid availability windows supplied to scheduler: ${errMessages}`);
  }

  const tasks = taskValidation.data;
  const normalizedWindows = normalizeWindows(windowValidation.data);

  // Determine explicit creation timestamp without implicit system clock
  const referenceTime =
    input.referenceTime ||
    (normalizedWindows.length > 0 ? normalizedWindows[0].start : '1970-01-01T00:00:00.000Z');

  const planId = input.planId || 'plan-deterministic-1';

  const scheduledBlocks: ScheduleBlock[] = [];
  const unscheduledTasks: UnscheduledTask[] = [];
  const issues: SchedulingIssue[] = [];
  const warnings: string[] = [];
  const assumptions: string[] = [
    'Scheduled using Earliest Deadline First (EDF) with priority and task ID tie-breaking.',
    'Tasks are scheduled as single contiguous blocks within availability windows.',
    'Work is never scheduled after a task deadline.',
  ];

  // Separate completed tasks from pending tasks
  const pendingTasks: Task[] = [];
  for (const t of tasks) {
    if (t.completed) {
      assumptions.push(`Task "${t.title}" (${t.id}) is marked completed and excluded from future schedule blocks.`);
    } else {
      pendingTasks.push(t);
    }
  }

  // Sort pending tasks deterministically
  const sortedTasks = [...pendingTasks].sort(compareTasksForScheduling);

  // Initialize available slots from normalized windows
  const freeSlots: AvailableSlot[] = normalizedWindows.map((w) => ({
    start: w.start,
    end: w.end,
  }));

  // Helper to calculate total remaining minutes in all free slots
  const getTotalFreeMinutes = () =>
    freeSlots.reduce((sum, s) => {
      const diff = (parseIso(s.end) - parseIso(s.start)) / (60 * 1000);
      return sum + Math.max(0, diff);
    }, 0);

  // Schedule each task into the earliest feasible slot
  for (const task of sortedTasks) {
    // Check if task deadline is already in the past relative to referenceTime
    if (task.deadline && isBefore(task.deadline, referenceTime)) {
      const formattedDeadline = formatDateTimeFriendly(task.deadline);
      const formattedRef = formatDateTimeFriendly(referenceTime);
      const reason = `Task deadline (${formattedDeadline}) is already past the reference start time (${formattedRef}).`;
      unscheduledTasks.push({ task, reason, code: 'TASK_OVERDUE' });
      issues.push({
        taskId: task.id,
        code: 'TASK_OVERDUE',
        message: reason,
        severity: 'error',
      });
      warnings.push(`Task "${task.title}" is overdue.`);
      continue;
    }

    let placed = false;
    let deadlinePreventedPlacement = false;

    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      const slotDuration = (parseIso(slot.end) - parseIso(slot.start)) / (60 * 1000);

      if (slotDuration >= task.estimatedMinutes) {
        const potentialEnd = addMinutes(slot.start, task.estimatedMinutes);

        // Check if potentialEnd respects deadline
        if (task.deadline && !isEqualOrBefore(potentialEnd, task.deadline)) {
          // This slot ends after the deadline
          deadlinePreventedPlacement = true;
          // Since slots are chronological, later slots will also be after this slot
          continue;
        }

        // Successfully fits into slot!
        const block: ScheduleBlock = {
          taskId: task.id,
          start: slot.start,
          end: potentialEnd,
          status: 'planned',
        };
        scheduledBlocks.push(block);
        placed = true;

        // Update slot start or remove slot if fully consumed
        if (potentialEnd === slot.end) {
          freeSlots.splice(i, 1);
        } else {
          slot.start = potentialEnd;
        }
        break;
      }
    }

    if (!placed) {
      if (deadlinePreventedPlacement) {
        const formattedDeadline = formatDateTimeFriendly(task.deadline);
        const reason = `Task cannot be completed before its deadline (${formattedDeadline}).`;
        unscheduledTasks.push({ task, reason, code: 'DEADLINE_EXCEEDED' });
        issues.push({
          taskId: task.id,
          code: 'DEADLINE_EXCEEDED',
          message: reason,
          severity: 'error',
        });
        warnings.push(`Task "${task.title}" could not fit before its deadline (${formattedDeadline}).`);
      } else {
        const totalFree = getTotalFreeMinutes();
        if (totalFree < task.estimatedMinutes) {
          const reason = `Insufficient total available time (${totalFree}m remaining, needs ${task.estimatedMinutes}m).`;
          unscheduledTasks.push({ task, reason, code: 'INSUFFICIENT_TIME' });
          issues.push({
            taskId: task.id,
            code: 'INSUFFICIENT_TIME',
            message: reason,
            severity: 'error',
          });
          warnings.push(`Insufficient available time to schedule task "${task.title}".`);
        } else {
          const reason = `No single availability window has enough continuous time for task duration (${task.estimatedMinutes}m).`;
          unscheduledTasks.push({ task, reason, code: 'INSUFFICIENT_WINDOW_DURATION' });
          issues.push({
            taskId: task.id,
            code: 'INSUFFICIENT_WINDOW_DURATION',
            message: reason,
            severity: 'warning',
          });
          warnings.push(`Task "${task.title}" (${task.estimatedMinutes}m) exceeds the duration of available time windows.`);
        }
      }
    }
  }

  // Sort scheduled blocks chronologically by start time
  scheduledBlocks.sort((a, b) => parseIso(a.start) - parseIso(b.start));

  return {
    id: planId,
    createdAt: referenceTime,
    tasks,
    blocks: scheduledBlocks,
    unscheduledTasks,
    issues,
    warnings,
    assumptions,
  };
}
