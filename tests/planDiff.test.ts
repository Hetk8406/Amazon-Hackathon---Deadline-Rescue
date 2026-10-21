import { describe, it, expect } from 'vitest';
import { comparePlans } from '../src/features/planning/planDiff';
import type { Plan } from '../src/features/tasks/taskTypes';

describe('comparePlans (planDiff)', () => {
  const basePlan: Plan = {
    id: 'plan-1',
    createdAt: '2026-10-21T09:00:00.000Z',
    tasks: [
      { id: 't1', title: 'Calculus Assignment', estimatedMinutes: 60, priority: 'high', completed: false },
      { id: 't2', title: 'Physics Lab', estimatedMinutes: 60, priority: 'medium', completed: false },
    ],
    blocks: [
      { taskId: 't1', start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T10:00:00.000Z', status: 'planned' },
      { taskId: 't2', start: '2026-10-21T10:00:00.000Z', end: '2026-10-21T11:00:00.000Z', status: 'planned' },
    ],
    unscheduledTasks: [],
    issues: [],
    warnings: [],
    assumptions: [],
  };

  it('detects a moved task and produces a clear explanation', () => {
    const proposedPlan: Plan = {
      ...basePlan,
      id: 'plan-2',
      blocks: [
        // t1 took longer, moving t2 by 60 mins
        { taskId: 't1', start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T11:00:00.000Z', status: 'planned' },
        { taskId: 't2', start: '2026-10-21T11:00:00.000Z', end: '2026-10-21T12:00:00.000Z', status: 'planned' },
      ],
    };

    const diff = comparePlans(basePlan, proposedPlan);

    expect(diff.previousPlanId).toBe('plan-1');
    expect(diff.changes).toHaveLength(2);

    const t1Change = diff.changes.find((c) => c.taskId === 't1');
    const t2Change = diff.changes.find((c) => c.taskId === 't2');

    expect(t1Change?.reason).toBe('Extended by 60m');
    expect(t2Change).toEqual({
      taskId: 't2',
      reason: 'Delayed by 60m',
      oldStart: '2026-10-21T10:00:00.000Z',
      newStart: '2026-10-21T11:00:00.000Z',
      oldStatus: 'planned',
      newStatus: 'planned',
    });
    expect(diff.tradeoffs.some((t) => t.includes('"Physics Lab" was moved later by 60m'))).toBe(true);
  });

  it('detects a newly scheduled task', () => {
    const proposedPlan: Plan = {
      ...basePlan,
      id: 'plan-2',
      tasks: [
        ...basePlan.tasks,
        { id: 't3', title: 'English Essay', estimatedMinutes: 45, priority: 'low', completed: false },
      ],
      blocks: [
        ...basePlan.blocks,
        { taskId: 't3', start: '2026-10-21T11:00:00.000Z', end: '2026-10-21T11:45:00.000Z', status: 'planned' },
      ],
    };

    const diff = comparePlans(basePlan, proposedPlan);
    const addedChange = diff.changes.find((c) => c.taskId === 't3');

    expect(addedChange).toBeDefined();
    expect(addedChange?.reason).toBe('Added to schedule');
    expect(diff.tradeoffs.some((t) => t.includes('"English Essay" was added to the schedule'))).toBe(true);
  });

  it('detects a removed / dropped task', () => {
    const proposedPlan: Plan = {
      ...basePlan,
      id: 'plan-2',
      blocks: [basePlan.blocks[0]], // t2 could not fit
      unscheduledTasks: [
        {
          task: basePlan.tasks[1],
          reason: 'Insufficient available time',
          code: 'INSUFFICIENT_TIME',
        },
      ],
    };

    const diff = comparePlans(basePlan, proposedPlan);
    const droppedChange = diff.changes.find((c) => c.taskId === 't2');

    expect(droppedChange).toBeDefined();
    expect(droppedChange?.reason).toContain('Insufficient available time');
    expect(diff.tradeoffs.some((t) => t.includes('"Physics Lab" could no longer be scheduled'))).toBe(true);
  });
});
