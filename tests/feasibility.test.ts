import { describe, it, expect } from 'vitest';
import { scheduleTasks } from '../src/features/planning/scheduler';
import { checkPlanFeasibility } from '../src/features/planning/feasibility';
import type { Task, TimeWindow } from '../src/features/tasks/taskTypes';

describe('checkPlanFeasibility', () => {
  const availability: TimeWindow[] = [
    { start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T11:00:00.000Z' }, // 120 min
  ];

  it('reports isFeasible = true when all tasks comfortably fit', () => {
    const tasks: Task[] = [
      { id: 't1', title: 'Task 1', estimatedMinutes: 60, priority: 'medium', completed: false },
    ];
    const plan = scheduleTasks({ tasks, availability });
    const report = checkPlanFeasibility(plan, availability);

    expect(report.isFeasible).toBe(true);
    expect(report.metrics.scheduledTasksCount).toBe(1);
    expect(report.metrics.unscheduledTasksCount).toBe(0);
    expect(report.metrics.netDeficitMinutes).toBe(0);
    expect(report.summary).toContain('successfully fit');
  });

  it('detects capacity deficit when total required exceeds total available', () => {
    const tasks: Task[] = [
      { id: 't1', title: 'Long Task 1', estimatedMinutes: 90, priority: 'high', completed: false },
      { id: 't2', title: 'Long Task 2', estimatedMinutes: 60, priority: 'medium', completed: false },
    ]; // 150 min total needed, only 120 available -> 30 min deficit

    const plan = scheduleTasks({ tasks, availability });
    const report = checkPlanFeasibility(plan, availability);

    expect(report.isFeasible).toBe(false);
    expect(report.metrics.netDeficitMinutes).toBe(30);
    expect(report.metrics.unscheduledTasksCount).toBe(1);
    expect(report.risks.some((r) => r.code === 'INSUFFICIENT_TIME')).toBe(true);
  });

  it('warns about imminent deadlines for unscheduled tasks', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'Morning Session',
        estimatedMinutes: 60,
        deadline: '2026-10-21T10:00:00.000Z',
        priority: 'high',
        completed: false,
      },
      {
        id: 't-urgent',
        title: 'Urgent Unscheduled',
        estimatedMinutes: 90, // Needs 90 min, but only 60 min left (10:00-11:00)
        deadline: '2026-10-21T11:30:00.000Z', // 2.5 hours from reference 09:00
        priority: 'medium',
        completed: false,
      },
    ];

    const plan = scheduleTasks({ tasks, availability, referenceTime: '2026-10-21T09:00:00.000Z' });
    const report = checkPlanFeasibility(plan, availability, '2026-10-21T09:00:00.000Z');

    expect(report.isFeasible).toBe(false);
    expect(plan.unscheduledTasks.some((u) => u.task.id === 't-urgent')).toBe(true);
    expect(report.risks.some((r) => r.code === 'DEADLINE_CONFLICT' && r.taskId === 't-urgent')).toBe(true);
  });
});
