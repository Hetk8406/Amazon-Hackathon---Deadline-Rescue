/**
 * Core domain types for Deadline Rescue.
 * Defines models for tasks, availability windows, schedules, plans, and replan proposals.
 */

export type Priority = 'high' | 'medium' | 'low';

export type Task = {
  id: string;
  title: string;
  estimatedMinutes: number;
  deadline?: string; // ISO 8601 date-time string
  priority: Priority;
  completed: boolean;
  pinned?: boolean;
};

export type TimeWindow = {
  start: string; // ISO 8601 date-time string
  end: string;   // ISO 8601 date-time string
};

// Semantic alias for TimeWindow representing user-provided study/work availability
export type AvailabilityWindow = TimeWindow;

export type ScheduleBlockStatus = 'planned' | 'completed' | 'at-risk';

export type ScheduleBlock = {
  taskId: string;
  start: string; // ISO 8601 date-time string
  end: string;   // ISO 8601 date-time string
  status: ScheduleBlockStatus;
};

export type SchedulingIssueCode =
  | 'TASK_OVERDUE'
  | 'INSUFFICIENT_TIME'
  | 'INSUFFICIENT_WINDOW_DURATION'
  | 'DEADLINE_CONFLICT'
  | 'DEADLINE_EXCEEDED';

export type SchedulingIssue = {
  taskId?: string;
  code: SchedulingIssueCode;
  message: string;
  severity: 'warning' | 'error';
};

export type UnscheduledTask = {
  task: Task;
  reason: string;
  code: SchedulingIssueCode;
};

export type Plan = {
  id: string;
  createdAt: string; // ISO 8601 date-time string
  tasks: Task[];
  blocks: ScheduleBlock[];
  unscheduledTasks: UnscheduledTask[];
  issues: SchedulingIssue[];
  warnings: string[];
  assumptions: string[];
};

export type PlanChange = {
  taskId: string;
  reason: string;
  oldStart?: string;
  newStart?: string;
  oldStatus?: ScheduleBlockStatus;
  newStatus?: ScheduleBlockStatus;
};

export type ReplanProposal = {
  previousPlanId: string;
  proposedPlan: Plan;
  changes: PlanChange[];
  tradeoffs: string[];
};
