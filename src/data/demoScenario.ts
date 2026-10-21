import type { Task, TimeWindow } from '../features/tasks/taskTypes';

export type DemoScenario = {
  name: string;
  description: string;
  referenceTime: string;
  availability: TimeWindow[];
  tasks: Task[];
};

/**
 * Creates a reliable demo crunch scenario anchored to a given base date (YYYY-MM-DD).
 * If omitted, defaults to the canonical reference date '2026-10-21'.
 * Preserves the exact task order, relative offsets, window durations, priorities,
 * and the 60m capacity deficit demonstrating an infeasible schedule with recovery.
 */
export function createDemoScenario(baseDate?: string): DemoScenario {
  const datePrefix = baseDate ? baseDate.slice(0, 10) : '2026-10-21';

  return {
    name: 'Midterm Crunch Week',
    description: 'Realistic student workload with competing assignment deadlines and a time conflict.',
    referenceTime: `${datePrefix}T08:30:00.000Z`,
    availability: [
      {
        start: `${datePrefix}T09:00:00.000Z`,
        end: `${datePrefix}T12:00:00.000Z`,
      },
      {
        start: `${datePrefix}T13:30:00.000Z`,
        end: `${datePrefix}T16:30:00.000Z`,
      },
    ],
    tasks: [
      {
        id: 'demo-task-1',
        title: 'Algorithms Problem Set (Dynamic Programming)',
        estimatedMinutes: 120,
        priority: 'high',
        deadline: `${datePrefix}T12:00:00.000Z`,
        completed: false,
      },
      {
        id: 'demo-task-2',
        title: 'Physics Lab Report & Error Analysis',
        estimatedMinutes: 90,
        priority: 'medium',
        deadline: `${datePrefix}T16:00:00.000Z`,
        completed: false,
      },
      {
        id: 'demo-task-3',
        title: 'History Reading (Ch. 14 Primary Sources)',
        estimatedMinutes: 60,
        priority: 'low',
        deadline: `${datePrefix}T16:30:00.000Z`,
        completed: false,
      },
      {
        id: 'demo-task-4',
        title: 'Calculus Midterm Review & Practice Exam',
        estimatedMinutes: 150,
        priority: 'high',
        deadline: `${datePrefix}T15:00:00.000Z`,
        completed: false,
      },
    ],
  };
}

export const DEMO_SCENARIO: DemoScenario = createDemoScenario();
