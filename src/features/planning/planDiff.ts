import type { Plan, PlanChange, ReplanProposal } from '../tasks/taskTypes';
import { diffInMinutes } from '../../lib/dateTime';

/**
 * Compares an existing plan with a proposed plan to produce a structured diff.
 * Uses stable task IDs to track movements, additions, removals, and status changes.
 */
export function comparePlans(oldPlan: Plan, newPlan: Plan): ReplanProposal {
  const oldBlocksMap = new Map(oldPlan.blocks.map((b) => [b.taskId, b]));
  const newBlocksMap = new Map(newPlan.blocks.map((b) => [b.taskId, b]));
  const allTaskIds = new Set([...oldPlan.tasks.map((t) => t.id), ...newPlan.tasks.map((t) => t.id)]);

  const changes: PlanChange[] = [];
  const tradeoffs: string[] = [];

  for (const taskId of allTaskIds) {
    const oldBlock = oldBlocksMap.get(taskId);
    const newBlock = newBlocksMap.get(taskId);
    const task = newPlan.tasks.find((t) => t.id === taskId) || oldPlan.tasks.find((t) => t.id === taskId);
    const title = task ? `"${task.title}"` : `Task ${taskId}`;

    if (!oldBlock && newBlock) {
      // Newly scheduled
      changes.push({
        taskId,
        reason: 'Added to schedule',
        newStart: newBlock.start,
        newStatus: newBlock.status,
      });
      tradeoffs.push(`${title} was added to the schedule at ${newBlock.start}.`);
    } else if (oldBlock && !newBlock) {
      // Removed from schedule
      const unscheduledInfo = newPlan.unscheduledTasks.find((u) => u.task.id === taskId);
      const reason = unscheduledInfo ? unscheduledInfo.reason : 'Removed from schedule';
      changes.push({
        taskId,
        reason,
        oldStart: oldBlock.start,
        oldStatus: oldBlock.status,
      });
      tradeoffs.push(`${title} could no longer be scheduled: ${reason}.`);
    } else if (oldBlock && newBlock) {
      const startShiftMinutes = diffInMinutes(oldBlock.start, newBlock.start);
      const endShiftMinutes = diffInMinutes(oldBlock.end, newBlock.end);
      const statusChanged = oldBlock.status !== newBlock.status;

      if (startShiftMinutes !== 0 || endShiftMinutes !== 0 || statusChanged) {
        let reason = '';
        if (startShiftMinutes > 0) {
          reason = `Delayed by ${startShiftMinutes}m`;
          tradeoffs.push(`${title} was moved later by ${startShiftMinutes}m (starts at ${newBlock.start}).`);
        } else if (startShiftMinutes < 0) {
          reason = `Moved earlier by ${Math.abs(startShiftMinutes)}m`;
          tradeoffs.push(`${title} was moved earlier by ${Math.abs(startShiftMinutes)}m (starts at ${newBlock.start}).`);
        } else if (endShiftMinutes !== 0) {
          const diffMins = endShiftMinutes;
          reason = diffMins > 0 ? `Extended by ${diffMins}m` : `Shortened by ${Math.abs(diffMins)}m`;
          tradeoffs.push(`${title} duration changed by ${diffMins > 0 ? `+${diffMins}m` : `${diffMins}m`} (ends at ${newBlock.end}).`);
        }

        if (statusChanged) {
          reason = reason ? `${reason} (status: ${newBlock.status})` : `Status changed to ${newBlock.status}`;
          tradeoffs.push(`${title} status changed from ${oldBlock.status} to ${newBlock.status}.`);
        }

        changes.push({
          taskId,
          reason,
          oldStart: oldBlock.start,
          newStart: newBlock.start,
          oldStatus: oldBlock.status,
          newStatus: newBlock.status,
        });
      }
    }
  }

  // Include any remaining deadline risks highlighted in proposed plan
  for (const issue of newPlan.issues) {
    if (issue.severity === 'error') {
      const task = newPlan.tasks.find((t) => t.id === issue.taskId);
      const prefix = task ? `"${task.title}" risk: ` : '';
      if (!tradeoffs.includes(`${prefix}${issue.message}`)) {
        tradeoffs.push(`${prefix}${issue.message}`);
      }
    }
  }

  return {
    previousPlanId: oldPlan.id,
    proposedPlan: newPlan,
    changes,
    tradeoffs,
  };
}
