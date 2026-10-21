import type { Task, TimeWindow, Plan, PlanChange } from '../tasks/taskTypes';
import { scheduleTasks } from './scheduler';
import { comparePlans } from './planDiff';
import { addMinutes, parseIso, formatIso } from '../../lib/dateTime';

export type DelayDisruption = {
  type: 'delay';
  delayMinutes: number;
  reason?: string;
};

export type TaskExtendedDisruption = {
  type: 'task_extended';
  taskId: string;
  additionalMinutes: number;
  reason?: string;
};

export type NewTaskDisruption = {
  type: 'new_task';
  task: Task;
  reason?: string;
};

export type DisruptionEvent = DelayDisruption | TaskExtendedDisruption | NewTaskDisruption;

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export type Proposal = {
  id: string;
  createdAt: string;
  disruption: DisruptionEvent;
  previousPlan: Plan;
  proposedPlan: Plan;
  changes: PlanChange[];
  tradeoffs: string[];
  status: ProposalStatus;
  candidateTasks: Task[];
  candidateAvailability: TimeWindow[];
};

export type GenerateProposalInput = {
  currentPlan: Plan;
  currentTasks: Task[];
  currentAvailability: TimeWindow[];
  referenceTime: string;
  disruption: DisruptionEvent;
  proposalId?: string;
};

/**
 * Adjusts availability windows when a general delay occurs.
 * Any available time before `referenceTime + delayMinutes` is eliminated.
 */
export function shiftAvailabilityForDelay(
  availability: TimeWindow[],
  referenceTime: string,
  delayMinutes: number,
): { adjustedWindows: TimeWindow[]; effectiveReferenceTime: string } {
  if (delayMinutes <= 0) {
    throw new Error(`Delay minutes must be a positive integer, received: ${delayMinutes}`);
  }

  const effectiveReferenceTime = addMinutes(referenceTime, delayMinutes);
  const cutoffTs = parseIso(effectiveReferenceTime);

  const adjustedWindows: TimeWindow[] = [];

  for (const win of availability) {
    const startTs = parseIso(win.start);
    const endTs = parseIso(win.end);

    if (endTs <= cutoffTs) {
      // Entire window was consumed by the delay
      continue;
    }

    if (startTs < cutoffTs && endTs > cutoffTs) {
      // Window is partially truncated by the delay
      adjustedWindows.push({
        start: effectiveReferenceTime,
        end: win.end,
      });
    } else {
      // Window is fully after the delay
      adjustedWindows.push({ ...win });
    }
  }

  return { adjustedWindows, effectiveReferenceTime };
}

/**
 * Pure generator for replan proposals based on disruptions.
 * Guarantees that the accepted plan is never mutated.
 */
export function generateProposal(input: GenerateProposalInput): Proposal {
  const proposalId = input.proposalId || `proposal-${Date.now()}`;
  let candidateTasks: Task[] = input.currentTasks.map((t) => ({ ...t }));
  let candidateAvailability: TimeWindow[] = input.currentAvailability.map((w) => ({ ...w }));
  let candidateReferenceTime = input.referenceTime;

  switch (input.disruption.type) {
    case 'delay': {
      const { delayMinutes } = input.disruption;
      if (!Number.isInteger(delayMinutes) || delayMinutes <= 0) {
        throw new Error(`Delay duration must be a positive integer in minutes (> 0), received: ${delayMinutes}`);
      }
      const shifted = shiftAvailabilityForDelay(candidateAvailability, candidateReferenceTime, delayMinutes);
      candidateAvailability = shifted.adjustedWindows;
      candidateReferenceTime = shifted.effectiveReferenceTime;
      break;
    }

    case 'task_extended': {
      const { taskId, additionalMinutes } = input.disruption;
      if (!Number.isInteger(additionalMinutes) || additionalMinutes <= 0) {
        throw new Error(`Additional minutes must be a positive integer (> 0), received: ${additionalMinutes}`);
      }
      const targetIndex = candidateTasks.findIndex((t) => t.id === taskId);
      if (targetIndex === -1) {
        throw new Error(`Cannot extend task: Task ID "${taskId}" not found.`);
      }
      const current = candidateTasks[targetIndex];
      candidateTasks[targetIndex] = {
        ...current,
        estimatedMinutes: current.estimatedMinutes + additionalMinutes,
      };
      break;
    }

    case 'new_task': {
      candidateTasks.push({ ...input.disruption.task });
      break;
    }

    default:
      throw new Error(`Unknown disruption type: ${(input.disruption as { type: string }).type}`);
  }

  // Generate proposed candidate plan using pure scheduler
  const proposedPlan = scheduleTasks({
    tasks: candidateTasks,
    availability: candidateAvailability,
    referenceTime: candidateReferenceTime,
    planId: `plan-${proposalId}`,
  });

  // Calculate plan differences and trade-offs
  const diff = comparePlans(input.currentPlan, proposedPlan);

  const disruptionReason =
    input.disruption.reason ||
    (input.disruption.type === 'delay'
      ? `Schedule delayed by ${input.disruption.delayMinutes}m`
      : input.disruption.type === 'task_extended'
        ? `Task extended by ${input.disruption.additionalMinutes}m`
        : `New task "${input.disruption.task.title}" added`);

  const tradeoffs = [...diff.tradeoffs];
  if (!tradeoffs.some((t) => t.includes(disruptionReason))) {
    tradeoffs.unshift(disruptionReason);
  }

  return {
    id: proposalId,
    createdAt: formatIso(parseIso(input.referenceTime)),
    disruption: input.disruption,
    previousPlan: input.currentPlan,
    proposedPlan,
    changes: diff.changes,
    tradeoffs,
    status: 'pending',
    candidateTasks,
    candidateAvailability,
  };
}

/**
 * Pure state transition: Approves a pending proposal.
 * Throws if the proposal is already finalized.
 */
export function approveProposal(proposal: Proposal): {
  acceptedPlan: Plan;
  tasks: Task[];
  availability: TimeWindow[];
  finalizedProposal: Proposal;
} {
  if (proposal.status !== 'pending') {
    throw new Error(`Cannot approve proposal "${proposal.id}" because it is already ${proposal.status}.`);
  }

  return {
    acceptedPlan: proposal.proposedPlan,
    tasks: proposal.candidateTasks,
    availability: proposal.candidateAvailability,
    finalizedProposal: {
      ...proposal,
      status: 'approved',
    },
  };
}

/**
 * Pure state transition: Rejects a pending proposal.
 * Throws if the proposal is already finalized.
 */
export function rejectProposal(proposal: Proposal): {
  finalizedProposal: Proposal;
} {
  if (proposal.status !== 'pending') {
    throw new Error(`Cannot reject proposal "${proposal.id}" because it is already ${proposal.status}.`);
  }

  return {
    finalizedProposal: {
      ...proposal,
      status: 'rejected',
    },
  };
}
