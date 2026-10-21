import { describe, it, expect } from 'vitest';
import {
  generateProposal,
  approveProposal,
  rejectProposal,
  shiftAvailabilityForDelay,
} from '../src/features/planning/replan';
import { scheduleTasks } from '../src/features/planning/scheduler';
import type { Task, TimeWindow } from '../src/features/tasks/taskTypes';

describe('replan workflow engine', () => {
  const baseAvailability: TimeWindow[] = [
    { start: '2026-10-21T09:00:00.000Z', end: '2026-10-21T12:00:00.000Z' }, // 180 min
    { start: '2026-10-21T13:30:00.000Z', end: '2026-10-21T16:30:00.000Z' }, // 180 min
  ];

  const baseTasks: Task[] = [
    {
      id: 't1',
      title: 'Math Homework',
      estimatedMinutes: 60,
      priority: 'high',
      deadline: '2026-10-21T11:00:00.000Z',
      completed: false,
    },
    {
      id: 't2',
      title: 'Physics Lab',
      estimatedMinutes: 90,
      priority: 'medium',
      deadline: '2026-10-21T16:00:00.000Z',
      completed: false,
    },
  ];

  const initialPlan = scheduleTasks({
    tasks: baseTasks,
    availability: baseAvailability,
    referenceTime: '2026-10-21T09:00:00.000Z',
  });

  describe('shiftAvailabilityForDelay', () => {
    it('truncates window start when delay falls within a window', () => {
      const { adjustedWindows, effectiveReferenceTime } = shiftAvailabilityForDelay(
        baseAvailability,
        '2026-10-21T09:00:00.000Z',
        60,
      );

      expect(effectiveReferenceTime).toBe('2026-10-21T10:00:00.000Z');
      expect(adjustedWindows[0].start).toBe('2026-10-21T10:00:00.000Z');
      expect(adjustedWindows[0].end).toBe('2026-10-21T12:00:00.000Z');
      expect(adjustedWindows[1]).toEqual(baseAvailability[1]);
    });

    it('removes completely lapsed windows', () => {
      // 200 min delay (09:00 + 200m = 12:20) eliminates window 1 (09:00-12:00)
      const { adjustedWindows, effectiveReferenceTime } = shiftAvailabilityForDelay(
        baseAvailability,
        '2026-10-21T09:00:00.000Z',
        200,
      );

      expect(effectiveReferenceTime).toBe('2026-10-21T12:20:00.000Z');
      expect(adjustedWindows).toHaveLength(1);
      expect(adjustedWindows[0]).toEqual(baseAvailability[1]);
    });

    it('rejects invalid or non-positive delay minutes', () => {
      expect(() => shiftAvailabilityForDelay(baseAvailability, '2026-10-21T09:00:00.000Z', 0)).toThrow();
      expect(() => shiftAvailabilityForDelay(baseAvailability, '2026-10-21T09:00:00.000Z', -30)).toThrow();
    });
  });

  describe('generateProposal', () => {
    it('generates a proposal for a 60m delay without mutating the original accepted plan', () => {
      const proposal = generateProposal({
        currentPlan: initialPlan,
        currentTasks: baseTasks,
        currentAvailability: baseAvailability,
        referenceTime: '2026-10-21T09:00:00.000Z',
        disruption: {
          type: 'delay',
          delayMinutes: 60,
          reason: 'Late bus arrival',
        },
      });

      expect(proposal.status).toBe('pending');
      expect(proposal.previousPlan).toBe(initialPlan);

      // t1 originally scheduled at 09:00; in proposed plan it starts at 10:00
      const oldT1Block = initialPlan.blocks.find((b) => b.taskId === 't1');
      const newT1Block = proposal.proposedPlan.blocks.find((b) => b.taskId === 't1');

      expect(oldT1Block?.start).toBe('2026-10-21T09:00:00.000Z');
      expect(newT1Block?.start).toBe('2026-10-21T10:00:00.000Z');

      // The original plan block remains unchanged
      expect(initialPlan.blocks[0].start).toBe('2026-10-21T09:00:00.000Z');

      // Changes should include moved tasks
      expect(proposal.changes.some((c) => c.taskId === 't1' && c.reason.includes('Delayed by 60m'))).toBe(true);
      expect(proposal.tradeoffs.some((t) => t.includes('Late bus arrival'))).toBe(true);
    });

    it('generates a proposal when a task takes longer than expected', () => {
      const proposal = generateProposal({
        currentPlan: initialPlan,
        currentTasks: baseTasks,
        currentAvailability: baseAvailability,
        referenceTime: '2026-10-21T09:00:00.000Z',
        disruption: {
          type: 'task_extended',
          taskId: 't1',
          additionalMinutes: 60, // t1 goes from 60m to 120m
          reason: 'Calculations required extra derivation',
        },
      });

      // t1 now takes 120 min (09:00 to 11:00)
      const proposedT1 = proposal.proposedPlan.blocks.find((b) => b.taskId === 't1');
      expect(proposedT1?.end).toBe('2026-10-21T11:00:00.000Z');

      // Candidate tasks reflected in proposal
      const extendedTask = proposal.candidateTasks.find((t) => t.id === 't1');
      expect(extendedTask?.estimatedMinutes).toBe(120);

      // Original base tasks unmutated
      expect(baseTasks.find((t) => t.id === 't1')?.estimatedMinutes).toBe(60);
    });

    it('generates a proposal for a new urgent task', () => {
      const newTask: Task = {
        id: 'urgent-quiz',
        title: 'Pop Quiz Prep',
        estimatedMinutes: 30,
        priority: 'high',
        deadline: '2026-10-21T10:00:00.000Z',
        completed: false,
      };

      const proposal = generateProposal({
        currentPlan: initialPlan,
        currentTasks: baseTasks,
        currentAvailability: baseAvailability,
        referenceTime: '2026-10-21T09:00:00.000Z',
        disruption: {
          type: 'new_task',
          task: newTask,
          reason: 'Announced this morning in lecture',
        },
      });

      expect(proposal.proposedPlan.blocks.some((b) => b.taskId === 'urgent-quiz')).toBe(true);
      expect(proposal.candidateTasks.some((t) => t.id === 'urgent-quiz')).toBe(true);
      expect(proposal.changes.some((c) => c.taskId === 'urgent-quiz' && c.reason.includes('Added to schedule'))).toBe(true);
    });
  });

  describe('approveProposal and rejectProposal state transitions', () => {
    it('approves a proposal cleanly and updates accepted plan state', () => {
      const proposal = generateProposal({
        currentPlan: initialPlan,
        currentTasks: baseTasks,
        currentAvailability: baseAvailability,
        referenceTime: '2026-10-21T09:00:00.000Z',
        disruption: { type: 'delay', delayMinutes: 30 },
      });

      const result = approveProposal(proposal);

      expect(result.finalizedProposal.status).toBe('approved');
      expect(result.acceptedPlan).toBe(proposal.proposedPlan);
      expect(result.availability).toBe(proposal.candidateAvailability);
      expect(result.tasks).toBe(proposal.candidateTasks);

      // Cannot re-approve an already approved proposal
      expect(() => approveProposal(result.finalizedProposal)).toThrow(/already approved/);
    });

    it('rejects a proposal and preserves original accepted plan', () => {
      const proposal = generateProposal({
        currentPlan: initialPlan,
        currentTasks: baseTasks,
        currentAvailability: baseAvailability,
        referenceTime: '2026-10-21T09:00:00.000Z',
        disruption: { type: 'delay', delayMinutes: 30 },
      });

      const result = rejectProposal(proposal);

      expect(result.finalizedProposal.status).toBe('rejected');
      // Original plan remains active
      expect(initialPlan.blocks[0].start).toBe('2026-10-21T09:00:00.000Z');

      // Cannot re-reject
      expect(() => rejectProposal(result.finalizedProposal)).toThrow(/already rejected/);
    });

    it('supports repeated disruptions chaining on newly accepted plans', () => {
      // Disruption 1: 30m delay
      const prop1 = generateProposal({
        currentPlan: initialPlan,
        currentTasks: baseTasks,
        currentAvailability: baseAvailability,
        referenceTime: '2026-10-21T09:00:00.000Z',
        disruption: { type: 'delay', delayMinutes: 30 },
      });
      const approved1 = approveProposal(prop1);

      // Disruption 2: task extension based on the NEW plan
      const prop2 = generateProposal({
        currentPlan: approved1.acceptedPlan,
        currentTasks: approved1.tasks,
        currentAvailability: approved1.availability,
        referenceTime: '2026-10-21T09:30:00.000Z',
        disruption: {
          type: 'task_extended',
          taskId: 't1',
          additionalMinutes: 30,
        },
      });

      // Compares against approved1.acceptedPlan, NOT initialPlan
      expect(prop2.previousPlan).toBe(approved1.acceptedPlan);
      expect(prop2.changes.some((c) => c.taskId === 't1')).toBe(true);
    });
  });
});
