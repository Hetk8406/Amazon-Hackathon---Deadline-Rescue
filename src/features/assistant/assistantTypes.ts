import type { Priority, Task, TimeWindow, Plan } from '../tasks/taskTypes';
import type { Proposal, DisruptionEvent } from '../planning/replan';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO 8601
  intent?: string;
  tradeoffs?: string[];
  suggestions?: string[];
  showApprovalActions?: boolean;
};

export type IntentType =
  | 'REPORT_DELAY'
  | 'EXTEND_TASK'
  | 'ADD_TASK'
  | 'WHAT_NEXT'
  | 'EXPLAIN_UNSCHEDULED'
  | 'SUMMARIZE_PROPOSAL'
  | 'APPROVE_PROPOSAL'
  | 'REJECT_PROPOSAL'
  | 'HELP'
  | 'UNKNOWN';

export type ReportDelayIntent = {
  type: 'REPORT_DELAY';
  delayMinutes: number;
  reason?: string;
};

export type ExtendTaskIntent = {
  type: 'EXTEND_TASK';
  taskQuery: string;
  additionalMinutes: number;
  reason?: string;
};

export type AddTaskIntent = {
  type: 'ADD_TASK';
  title: string;
  estimatedMinutes: number;
  priority: Priority;
  deadline?: string;
  reason?: string;
};

export type WhatNextIntent = {
  type: 'WHAT_NEXT';
};

export type ExplainUnscheduledIntent = {
  type: 'EXPLAIN_UNSCHEDULED';
  taskQuery?: string;
};

export type SummarizeProposalIntent = {
  type: 'SUMMARIZE_PROPOSAL';
};

export type ApproveProposalIntent = {
  type: 'APPROVE_PROPOSAL';
};

export type RejectProposalIntent = {
  type: 'REJECT_PROPOSAL';
};

export type HelpIntent = {
  type: 'HELP';
};

export type UnknownIntent = {
  type: 'UNKNOWN';
  rawQuery: string;
};

export type ParsedIntent =
  | ReportDelayIntent
  | ExtendTaskIntent
  | AddTaskIntent
  | WhatNextIntent
  | ExplainUnscheduledIntent
  | SummarizeProposalIntent
  | ApproveProposalIntent
  | RejectProposalIntent
  | HelpIntent
  | UnknownIntent;

export type AssistantContext = {
  tasks: Task[];
  availability: TimeWindow[];
  acceptedPlan: Plan;
  pendingProposal: Proposal | null;
  referenceTime: string;
  onGenerateProposal: (disruption: DisruptionEvent) => void;
  onApproveProposal: () => void;
  onRejectProposal: () => void;
};
