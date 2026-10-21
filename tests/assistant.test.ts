import { describe, it, expect, vi } from 'vitest';
import { extractDurationMinutes, parseIntent, cleanQuery } from '../src/features/assistant/intentParser';
import { processAssistantMessage, findMatchingTasks } from '../src/features/assistant/assistantService';
import type { AssistantContext } from '../src/features/assistant/assistantTypes';
import type { Task, Plan } from '../src/features/tasks/taskTypes';
import type { Proposal } from '../src/features/planning/replan';

describe('Conversational Intent Parser & Duration Extractor', () => {
  describe('extractDurationMinutes', () => {
    it('extracts minutes in various representations', () => {
      expect(extractDurationMinutes('30 minutes')).toBe(30);
      expect(extractDurationMinutes('running 45m late')).toBe(45);
      expect(extractDurationMinutes('need 15 mins more')).toBe(15);
      expect(extractDurationMinutes('took 20 min')).toBe(20);
    });

    it('extracts hours and conversions to minutes', () => {
      expect(extractDurationMinutes('an hour')).toBe(60);
      expect(extractDurationMinutes('1 hour')).toBe(60);
      expect(extractDurationMinutes('2 hours')).toBe(120);
      expect(extractDurationMinutes('1.5 hours')).toBe(90);
      expect(extractDurationMinutes('half an hour')).toBe(30);
      expect(extractDurationMinutes('1 hr')).toBe(60);
    });

    it('extracts combined hours and minutes', () => {
      expect(extractDurationMinutes('1 hour 30 minutes')).toBe(90);
      expect(extractDurationMinutes('1 hour and 15 mins')).toBe(75);
    });

    it('returns null when no duration is found', () => {
      expect(extractDurationMinutes('what should I work on next?')).toBeNull();
      expect(extractDurationMinutes('hello assistant')).toBeNull();
    });
  });

  describe('cleanQuery', () => {
    it('normalizes punctuation and lowercase', () => {
      expect(cleanQuery("I'm running 30m late!")).toBe("i'm running 30m late");
    });
  });

  describe('parseIntent', () => {
    it('parses delay reports', () => {
      const intent1 = parseIntent("I'm running 30 minutes late");
      expect(intent1.type).toBe('REPORT_DELAY');
      if (intent1.type === 'REPORT_DELAY') {
        expect(intent1.delayMinutes).toBe(30);
      }

      const intent2 = parseIntent('I am delayed by an hour');
      expect(intent2.type).toBe('REPORT_DELAY');
      if (intent2.type === 'REPORT_DELAY') {
        expect(intent2.delayMinutes).toBe(60);
      }
    });

    it('parses task extension requests', () => {
      const intent = parseIntent('My physics report will take another 45 minutes');
      expect(intent.type).toBe('EXTEND_TASK');
      if (intent.type === 'EXTEND_TASK') {
        expect(intent.additionalMinutes).toBe(45);
        expect(intent.taskQuery.toLowerCase()).toContain('physics');
      }
    });

    it('parses urgent task additions', () => {
      const intent = parseIntent('Add an urgent DMT viva tomorrow at 2 PM. It should take an hour');
      expect(intent.type).toBe('ADD_TASK');
      if (intent.type === 'ADD_TASK') {
        expect(intent.priority).toBe('high');
        expect(intent.estimatedMinutes).toBe(60);
        expect(intent.title.toLowerCase()).toContain('dmt viva');
      }
    });

    it('parses what next queries', () => {
      expect(parseIntent('What should I work on next?').type).toBe('WHAT_NEXT');
      expect(parseIntent('what next').type).toBe('WHAT_NEXT');
      expect(parseIntent('what is my next task?').type).toBe('WHAT_NEXT');
    });

    it('parses unscheduled task explanation queries', () => {
      const intent1 = parseIntent("Why couldn't my calculus midterm review be scheduled?");
      expect(intent1.type).toBe('EXPLAIN_UNSCHEDULED');
      if (intent1.type === 'EXPLAIN_UNSCHEDULED') {
        expect(intent1.taskQuery).toBeDefined();
        expect(intent1.taskQuery!.toLowerCase()).toContain('calculus');
      }

      const intent2 = parseIntent("Why didn't calculus fit?");
      expect(intent2.type).toBe('EXPLAIN_UNSCHEDULED');
    });

    it('parses proposal summary requests', () => {
      expect(parseIntent('What changed in the revised plan?').type).toBe('SUMMARIZE_PROPOSAL');
      expect(parseIntent('Summarize the proposal').type).toBe('SUMMARIZE_PROPOSAL');
      expect(parseIntent('What are the trade-offs?').type).toBe('SUMMARIZE_PROPOSAL');
    });

    it('parses proposal approval and rejection', () => {
      expect(parseIntent('Approve the revised plan').type).toBe('APPROVE_PROPOSAL');
      expect(parseIntent('Yes, apply changes').type).toBe('APPROVE_PROPOSAL');
      expect(parseIntent('Keep my current plan').type).toBe('REJECT_PROPOSAL');
      expect(parseIntent('Reject proposal').type).toBe('REJECT_PROPOSAL');
    });

    it('parses help requests', () => {
      expect(parseIntent('help').type).toBe('HELP');
      expect(parseIntent('what can you do?').type).toBe('HELP');
    });

    it('falls back to unknown for unrecognised queries', () => {
      const intent = parseIntent('order pizza for dinner');
      expect(intent.type).toBe('UNKNOWN');
    });
  });
});

describe('Assistant Service (processAssistantMessage)', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-algo',
      title: 'Algorithms Problem Set',
      estimatedMinutes: 90,
      priority: 'high',
      deadline: '2026-10-21T17:00:00.000Z',
      completed: false,
    },
    {
      id: 'task-physics',
      title: 'Physics Lab Report',
      estimatedMinutes: 60,
      priority: 'medium',
      deadline: '2026-10-21T18:00:00.000Z',
      completed: false,
    },
    {
      id: 'task-calc',
      title: 'Calculus Midterm Review',
      estimatedMinutes: 120,
      priority: 'high',
      deadline: '2026-10-21T12:00:00.000Z',
      completed: false,
    },
  ];

  const mockPlan: Plan = {
    id: 'plan-1',
    createdAt: '2026-10-21T08:30:00.000Z',
    tasks: mockTasks,
    blocks: [
      {
        taskId: 'task-algo',
        start: '2026-10-21T09:00:00.000Z',
        end: '2026-10-21T10:30:00.000Z',
        status: 'planned',
      },
      {
        taskId: 'task-physics',
        start: '2026-10-21T10:30:00.000Z',
        end: '2026-10-21T11:30:00.000Z',
        status: 'planned',
      },
    ],
    unscheduledTasks: [
      {
        task: mockTasks[2],
        code: 'INSUFFICIENT_TIME',
        reason: 'Task duration (120m) exceeds remaining window capacity (30m)',
      },
    ],
    issues: [],
    warnings: [],
    assumptions: [],
  };

  const createMockContext = (overrides?: Partial<AssistantContext>): AssistantContext => ({
    tasks: mockTasks,
    availability: [
      {
        start: '2026-10-21T09:00:00.000Z',
        end: '2026-10-21T12:00:00.000Z',
      },
    ],
    acceptedPlan: mockPlan,
    pendingProposal: null,
    referenceTime: '2026-10-21T08:30:00.000Z',
    onGenerateProposal: vi.fn(),
    onApproveProposal: vi.fn(),
    onRejectProposal: vi.fn(),
    ...overrides,
  });

  describe('findMatchingTasks', () => {
    it('matches task by partial title', () => {
      const matches = findMatchingTasks(mockTasks, 'physics');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('task-physics');
    });

    it('matches task by acronym or keyword', () => {
      const matches = findMatchingTasks(mockTasks, 'calculus review');
      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('task-calc');
    });
  });

  describe('query processing', () => {
    it('answers "what should I work on next?" with the top scheduled block', () => {
      const ctx = createMockContext();
      const res = processAssistantMessage('What should I work on next?', ctx);

      expect(res.intent).toBe('WHAT_NEXT');
      expect(res.message).toContain('Algorithms Problem Set');
      expect(res.message).toContain('09:00');
    });

    it('explains why unscheduled task did not fit', () => {
      const ctx = createMockContext();
      const res = processAssistantMessage("Why didn't calculus fit?", ctx);

      expect(res.intent).toBe('EXPLAIN_UNSCHEDULED');
      expect(res.message).toContain('Calculus Midterm Review');
      expect(res.message).toContain('exceeds remaining window capacity');
    });

    it('triggers proposal creation on delay report', () => {
      const ctx = createMockContext();
      const res = processAssistantMessage("I'm running 30 minutes late", ctx);

      expect(res.intent).toBe('REPORT_DELAY');
      expect(ctx.onGenerateProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delay',
          delayMinutes: 30,
        }),
      );
      expect(res.showApprovalActions).toBe(true);
    });

    it('triggers proposal creation on task extension', () => {
      const ctx = createMockContext();
      const res = processAssistantMessage('My physics report will take another 45 minutes', ctx);

      expect(res.intent).toBe('EXTEND_TASK');
      expect(ctx.onGenerateProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_extended',
          taskId: 'task-physics',
          additionalMinutes: 45,
        }),
      );
    });

    it('triggers proposal creation on urgent task addition', () => {
      const ctx = createMockContext();
      const res = processAssistantMessage('Add an urgent DMT viva for 60 minutes', ctx);

      expect(res.intent).toBe('ADD_TASK');
      expect(ctx.onGenerateProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new_task',
          task: expect.objectContaining({
            title: expect.stringMatching(/dmt viva/i),
            estimatedMinutes: 60,
            priority: 'high',
          }),
        }),
      );
    });

    it('handles approve proposal when proposal exists', () => {
      const mockProposal: Proposal = {
        id: 'prop-1',
        createdAt: '2026-10-21T09:00:00.000Z',
        disruption: { type: 'delay', delayMinutes: 30 },
        previousPlan: mockPlan,
        proposedPlan: mockPlan,
        changes: [],
        tradeoffs: ['Schedule shifted by 30 minutes'],
        status: 'pending',
        candidateTasks: mockTasks,
        candidateAvailability: [],
      };

      const ctx = createMockContext({ pendingProposal: mockProposal });
      const res = processAssistantMessage('Approve the revised plan', ctx);

      expect(res.intent).toBe('APPROVE_PROPOSAL');
      expect(ctx.onApproveProposal).toHaveBeenCalledTimes(1);
      expect(res.message).toContain('Revised recovery plan approved');
    });

    it('handles reject proposal when proposal exists', () => {
      const mockProposal: Proposal = {
        id: 'prop-1',
        createdAt: '2026-10-21T09:00:00.000Z',
        disruption: { type: 'delay', delayMinutes: 30 },
        previousPlan: mockPlan,
        proposedPlan: mockPlan,
        changes: [],
        tradeoffs: [],
        status: 'pending',
        candidateTasks: mockTasks,
        candidateAvailability: [],
      };

      const ctx = createMockContext({ pendingProposal: mockProposal });
      const res = processAssistantMessage('Keep my current plan', ctx);

      expect(res.intent).toBe('REJECT_PROPOSAL');
      expect(ctx.onRejectProposal).toHaveBeenCalledTimes(1);
      expect(res.message).toContain('Proposed revision rejected');
    });

    it('summarizes proposal trade-offs on request', () => {
      const mockProposal: Proposal = {
        id: 'prop-1',
        createdAt: '2026-10-21T09:00:00.000Z',
        disruption: { type: 'delay', delayMinutes: 30 },
        previousPlan: mockPlan,
        proposedPlan: mockPlan,
        changes: [
          {
            taskId: 'task-algo',
            oldStart: '2026-10-21T09:00:00.000Z',
            newStart: '2026-10-21T09:30:00.000Z',
            reason: 'Shifted forward by 30m',
          },
        ],
        tradeoffs: ['Calculus remains unscheduled due to capacity constraints'],
        status: 'pending',
        candidateTasks: mockTasks,
        candidateAvailability: [],
      };

      const ctx = createMockContext({ pendingProposal: mockProposal });
      const res = processAssistantMessage('What changed in the revised plan?', ctx);

      expect(res.intent).toBe('SUMMARIZE_PROPOSAL');
      expect(res.message).toContain('Algorithms Problem Set');
      expect(res.message).toContain('Calculus remains unscheduled');
      expect(res.showApprovalActions).toBe(true);
    });

    it('provides clear assistance when asked for help', () => {
      const ctx = createMockContext();
      const res = processAssistantMessage('help', ctx);

      expect(res.intent).toBe('HELP');
      expect(res.message).toContain('Alexa+ simulated experience');
      expect(res.message).toContain('deterministic');
    });
  });
});
