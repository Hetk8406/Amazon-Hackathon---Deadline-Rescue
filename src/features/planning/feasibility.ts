import type { Plan, TimeWindow, SchedulingIssue } from '../tasks/taskTypes';
import { diffInMinutes } from '../../lib/dateTime';

export type FeasibilityMetrics = {
  totalTasksCount: number;
  completedTasksCount: number;
  scheduledTasksCount: number;
  unscheduledTasksCount: number;
  totalRequiredMinutes: number;
  totalAvailableMinutes: number;
  netDeficitMinutes: number;
  isFeasible: boolean;
};

export type FeasibilityReport = {
  isFeasible: boolean;
  metrics: FeasibilityMetrics;
  risks: SchedulingIssue[];
  summary: string;
};

/**
 * Evaluates the feasibility of a generated plan against available time and deadlines.
 * Distinguishes total capacity issues from individual window or deadline constraints.
 */
export function checkPlanFeasibility(
  plan: Plan,
  availability: TimeWindow[],
  referenceTime?: string,
): FeasibilityReport {
  const refTime = referenceTime || plan.createdAt;

  // Calculate total available minutes across windows
  let totalAvailableMinutes = 0;
  for (const win of availability) {
    totalAvailableMinutes += Math.max(0, diffInMinutes(win.start, win.end));
  }

  // Calculate required minutes for non-completed tasks
  let totalRequiredMinutes = 0;
  let completedTasksCount = 0;

  for (const task of plan.tasks) {
    if (task.completed) {
      completedTasksCount++;
    } else {
      totalRequiredMinutes += task.estimatedMinutes;
    }
  }

  const netDeficitMinutes = Math.max(0, totalRequiredMinutes - totalAvailableMinutes);
  const scheduledTasksCount = plan.blocks.length;
  const unscheduledTasksCount = plan.unscheduledTasks.length;

  const risks: SchedulingIssue[] = [...plan.issues];

  // Check for overarching capacity deficit
  if (netDeficitMinutes > 0) {
    const exists = risks.some((r) => r.code === 'INSUFFICIENT_TIME' && !r.taskId);
    if (!exists) {
      risks.unshift({
        code: 'INSUFFICIENT_TIME',
        message: `Total required work (${totalRequiredMinutes}m) exceeds available time (${totalAvailableMinutes}m) by ${netDeficitMinutes}m.`,
        severity: 'error',
      });
    }
  }

  // Check for approaching deadlines among unscheduled tasks
  for (const unscheduled of plan.unscheduledTasks) {
    const task = unscheduled.task;
    if (task.deadline) {
      const minutesUntilDeadline = diffInMinutes(refTime, task.deadline);
      if (minutesUntilDeadline < 0) {
        // Already overdue
      } else if (minutesUntilDeadline <= 180) {
        // Less than 3 hours away
        risks.push({
          taskId: task.id,
          code: 'DEADLINE_CONFLICT',
          message: `Unscheduled task "${task.title}" has an imminent deadline in ${minutesUntilDeadline}m.`,
          severity: 'warning',
        });
      }
    }
  }

  // Check if any scheduled block finishes tight against its deadline (<= 15m buffer)
  for (const block of plan.blocks) {
    const task = plan.tasks.find((t) => t.id === block.taskId);
    if (task?.deadline) {
      const buffer = diffInMinutes(block.end, task.deadline);
      if (buffer < 0) {
        risks.push({
          taskId: task.id,
          code: 'DEADLINE_EXCEEDED',
          message: `Scheduled block for "${task.title}" exceeds deadline by ${Math.abs(buffer)}m.`,
          severity: 'error',
        });
      } else if (buffer <= 15) {
        risks.push({
          taskId: task.id,
          code: 'DEADLINE_CONFLICT',
          message: `Scheduled block for "${task.title}" completes very close to its deadline (${buffer}m buffer).`,
          severity: 'warning',
        });
      }
    }
  }

  const isFeasible = unscheduledTasksCount === 0 && netDeficitMinutes === 0 && !risks.some((r) => r.severity === 'error');

  let summary = '';
  if (isFeasible) {
    summary = `All ${scheduledTasksCount} tasks successfully fit into available time.`;
  } else if (unscheduledTasksCount > 0) {
    summary = `${unscheduledTasksCount} of ${plan.tasks.length} tasks could not be scheduled. ${risks[0]?.message || ''}`.trim();
  } else {
    summary = `Schedule has high-risk conflicts. ${risks[0]?.message || ''}`.trim();
  }

  const metrics: FeasibilityMetrics = {
    totalTasksCount: plan.tasks.length,
    completedTasksCount,
    scheduledTasksCount,
    unscheduledTasksCount,
    totalRequiredMinutes,
    totalAvailableMinutes,
    netDeficitMinutes,
    isFeasible,
  };

  return {
    isFeasible,
    metrics,
    risks,
    summary,
  };
}
