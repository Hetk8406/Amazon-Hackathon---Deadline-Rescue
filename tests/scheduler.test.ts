import { describe, it, expect } from 'vitest';
import { scheduleTasks } from '../src/features/planning/scheduler';
import type { Task, TimeWindow } from '../src/features/tasks/taskTypes';

describe('scheduleTasks (deterministic scheduling engine)', () => {
  const baseAvailability: TimeWindow[] = [
    { start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T12:00:00.000Z' }, // 180 min
  ];

  it('schedules a single task cleanly into one availability window', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'Study Physics',
        estimatedMinutes: 60,
        priority: 'high',
        completed: false,
      },
    ];

    const plan = scheduleTasks({
      tasks,
      availability: baseAvailability,
      referenceTime: '2026-10-21T09:00:00.000Z',
    });

    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0]).toEqual({
      taskId: 't1',
      start: '2026-10-21T09:00:00.000Z',
      end: '2026-10-21T10:00:00.000Z',
      status: 'planned',
    });
    expect(plan.unscheduledTasks).toHaveLength(0);
  });

  it('schedules multiple tasks in order of earliest deadline first (EDF)', () => {
    const tasks: Task[] = [
      {
        id: 't-late',
        title: 'Late Task',
        estimatedMinutes: 60,
        deadline: '2026-10-21T15:00:00.000Z',
        priority: 'high',
        completed: false,
      },
      {
        id: 't-early',
        title: 'Urgent Early Task',
        estimatedMinutes: 60,
        deadline: '2026-10-21T10:30:00.000Z',
        priority: 'low',
        completed: false,
      },
    ];

    const plan = scheduleTasks({
      tasks,
      availability: baseAvailability,
      referenceTime: '2026-10-21T09:00:00.000Z',
    });

    expect(plan.blocks).toHaveLength(2);
    // t-early must be scheduled first because deadline is earlier (10:30 < 15:00)
    expect(plan.blocks[0].taskId).toBe('t-early');
    expect(plan.blocks[0].start).toBe('2026-10-21T09:00:00.000Z');
    expect(plan.blocks[0].end).toBe('2026-10-21T10:00:00.000Z');

    expect(plan.blocks[1].taskId).toBe('t-late');
    expect(plan.blocks[1].start).toBe('2026-10-21T10:00:00.000Z');
    expect(plan.blocks[1].end).toBe('2026-10-21T11:00:00.000Z');
  });

  it('schedules a task that ends exactly at its deadline', () => {
    const tasks: Task[] = [
      {
        id: 't1',
        title: 'Exact Deadline Task',
        estimatedMinutes: 60,
        deadline: '2026-10-21T10:00:00.000Z',
        priority: 'medium',
        completed: false,
      },
    ];

    const plan = scheduleTasks({
      tasks,
      availability: baseAvailability,
      referenceTime: '2026-10-21T09:00:00.000Z',
    });

    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].end).toBe('2026-10-21T10:00:00.000Z');
    expect(plan.unscheduledTasks).toHaveLength(0);
  });

  it('does not schedule a task that would end after its deadline', () => {
    const tasks: Task[] = [
      {
        id: 't-impossible',
        title: 'Too Long For Deadline',
        estimatedMinutes: 120, // 2 hours
        deadline: '2026-10-21T10:00:00.000Z', // Only 1 hour after window start!
        priority: 'high',
        completed: false,
      },
    ];

    const plan = scheduleTasks({
      tasks,
      availability: baseAvailability,
      referenceTime: '2026-10-21T09:00:00.000Z',
    });

    expect(plan.blocks).toHaveLength(0);
    expect(plan.unscheduledTasks).toHaveLength(1);
    expect(plan.unscheduledTasks[0].code).toBe('DEADLINE_EXCEEDED');
    expect(plan.unscheduledTasks[0].reason).toContain('deadline');
  });

  it('correctly schedules tasks across multiple separate availability windows', () => {
    const windows: TimeWindow[] = [
      { start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T10:00:00.000Z' }, // 60 min
      { start: '2026-10-21T13:00:00.000Z', end: '2026-10-21T15:00:00.000Z' }, // 120 min
    ];

    const tasks: Task[] = [
      { id: 't1', title: 'Morning Task', estimatedMinutes: 60, priority: 'medium', completed: false },
      { id: 't2', title: 'Afternoon Task', estimatedMinutes: 90, priority: 'medium', completed: false },
    ];

    const plan = scheduleTasks({ tasks, availability: windows });

    expect(plan.blocks).toHaveLength(2);
    expect(plan.blocks[0]).toEqual({
      taskId: 't1',
      start: '2026-10-21T09:00:00.000Z',
      end: '2026-10-21T10:00:00.000Z',
      status: 'planned',
    });
    expect(plan.blocks[1]).toEqual({
      taskId: 't2',
      start: '2026-10-21T13:00:00.000Z',
      end: '2026-10-21T14:30:00.000Z',
      status: 'planned',
    });
  });

  it('guarantees no schedule blocks overlap and no block falls outside windows', () => {
    const tasks: Task[] = [
      { id: 't1', title: 'Task 1', estimatedMinutes: 45, priority: 'high', completed: false },
      { id: 't2', title: 'Task 2', estimatedMinutes: 50, priority: 'medium', completed: false },
      { id: 't3', title: 'Task 3', estimatedMinutes: 60, priority: 'low', completed: false },
    ];

    const plan = scheduleTasks({ tasks, availability: baseAvailability });
    expect(plan.blocks).toHaveLength(3);

    for (let i = 0; i < plan.blocks.length; i++) {
      const b = plan.blocks[i];
      // Start is before end
      expect(Date.parse(b.start)).toBeLessThan(Date.parse(b.end));

      // Falls within window 09:00 - 12:00
      expect(Date.parse(b.start)).toBeGreaterThanOrEqual(Date.parse('2026-10-21T09:00:00.000Z'));
      expect(Date.parse(b.end)).toBeLessThanOrEqual(Date.parse('2026-10-21T12:00:00.000Z'));

      // No overlap with next block
      if (i < plan.blocks.length - 1) {
        const next = plan.blocks[i + 1];
        expect(Date.parse(b.end)).toBeLessThanOrEqual(Date.parse(next.start));
      }
    }
  });

  it('marks tasks unscheduled when available time is insufficient without discarding them', () => {
    const tasks: Task[] = [
      { id: 't1', title: 'Task 1', estimatedMinutes: 120, priority: 'high', completed: false },
      { id: 't2', title: 'Task 2', estimatedMinutes: 120, priority: 'low', completed: false },
    ];
    // Total window is only 180 min (3 hours) for 240 min of work
    const plan = scheduleTasks({ tasks, availability: baseAvailability });

    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].taskId).toBe('t1');

    expect(plan.unscheduledTasks).toHaveLength(1);
    expect(plan.unscheduledTasks[0].task.id).toBe('t2');
    expect(plan.unscheduledTasks[0].code).toBe('INSUFFICIENT_TIME');
    expect(plan.warnings.some((w) => w.includes('Insufficient available time'))).toBe(true);
  });

  it('excludes completed tasks from future schedule blocks', () => {
    const tasks: Task[] = [
      { id: 'done', title: 'Finished Lab', estimatedMinutes: 60, priority: 'high', completed: true },
      { id: 'pending', title: 'Pending Report', estimatedMinutes: 60, priority: 'high', completed: false },
    ];

    const plan = scheduleTasks({ tasks, availability: baseAvailability });
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].taskId).toBe('pending');
  });

  it('uses stable tie-breaking for equal priority and equal deadline tasks', () => {
    const tasksA: Task[] = [
      { id: 'task-b', title: 'Task B', estimatedMinutes: 30, priority: 'high', completed: false },
      { id: 'task-a', title: 'Task A', estimatedMinutes: 30, priority: 'high', completed: false },
    ];

    const planA = scheduleTasks({ tasks: tasksA, availability: baseAvailability });

    // Alphabetical tie-breaker: task-a first, then task-b
    expect(planA.blocks[0].taskId).toBe('task-a');
    expect(planA.blocks[1].taskId).toBe('task-b');

    // Deterministic check: reverse input order gives same scheduling outcome
    const tasksB = [tasksA[1], tasksA[0]];
    const planB = scheduleTasks({ tasks: tasksB, availability: baseAvailability });
    expect(planB.blocks[0].taskId).toBe('task-a');
    expect(planB.blocks[1].taskId).toBe('task-b');
  });

  it('guarantees identical output for identical inputs (determinism)', () => {
    const tasks: Task[] = [
      { id: 't1', title: 'T1', estimatedMinutes: 45, priority: 'medium', deadline: '2026-10-21T11:00:00.000Z', completed: false },
      { id: 't2', title: 'T2', estimatedMinutes: 60, priority: 'high', completed: false },
    ];

    const run1 = scheduleTasks({ tasks, availability: baseAvailability, referenceTime: '2026-10-21T09:00:00.000Z' });
    const run2 = scheduleTasks({ tasks, availability: baseAvailability, referenceTime: '2026-10-21T09:00:00.000Z' });

    expect(run1).toEqual(run2);
  });

  it('flags tasks with deadlines in the past relative to referenceTime as TASK_OVERDUE', () => {
    const tasks: Task[] = [
      {
        id: 't-overdue',
        title: 'Yesterday Task',
        estimatedMinutes: 30,
        deadline: '2026-10-20T12:00:00.000Z', // Yesterday
        priority: 'high',
        completed: false,
      },
    ];

    const plan = scheduleTasks({
      tasks,
      availability: baseAvailability,
      referenceTime: '2026-10-21T09:00:00.000Z',
    });

    expect(plan.blocks).toHaveLength(0);
    expect(plan.unscheduledTasks).toHaveLength(1);
    expect(plan.unscheduledTasks[0].code).toBe('TASK_OVERDUE');
  });
});
