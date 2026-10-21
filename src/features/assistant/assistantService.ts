import type { Task } from '../tasks/taskTypes';
import type { AssistantContext } from './assistantTypes';
import { parseIntent, cleanQuery } from './intentParser';
import {
  formatTimeOnly,
  formatDurationMinutes,
  diffInMinutes,
  formatTimeFriendly,
  formatIsoInText,
} from '../../lib/dateTime';

export type AssistantResult = {
  message: string;
  intent: string;
  tradeoffs?: string[];
  showApprovalActions?: boolean;
  suggestions?: string[];
};

/**
 * Matches a query substring against the user's tasks.
 * Returns { exactMatches, partialMatches }.
 */
export function findMatchingTasks(tasks: Task[], query: string): Task[] {
  const cleaned = cleanQuery(query);
  if (!cleaned) return [];

  // 1. Check title substring or task ID match
  const directMatches = tasks.filter((t) => {
    const cleanedTitle = cleanQuery(t.title);
    return cleanedTitle.includes(cleaned) || t.id.toLowerCase() === cleaned;
  });

  if (directMatches.length > 0) {
    return directMatches;
  }

  // 2. Check individual keyword overlap
  const queryWords = cleaned.split(' ').filter((w) => w.length > 2);
  const wordMatches = tasks.filter((t) => {
    const titleWords = cleanQuery(t.title).split(' ');
    return queryWords.some((qw) => titleWords.some((tw) => tw.includes(qw) || qw.includes(tw)));
  });

  return wordMatches;
}

/**
 * Handles an incoming natural-language message, executes corresponding actions via context,
 * and produces a transparent, honest response.
 */
export function processAssistantMessage(
  query: string,
  context: AssistantContext,
): AssistantResult {
  const intent = parseIntent(query);

  switch (intent.type) {
    case 'APPROVE_PROPOSAL': {
      if (!context.pendingProposal) {
        return {
          intent: intent.type,
          message: 'There is no pending recovery proposal to approve. Your current schedule is already active.',
          suggestions: ['What should I work on next?', "I'm running 30m late"],
        };
      }
      context.onApproveProposal();
      return {
        intent: intent.type,
        message: '✓ Revised recovery plan approved! Your active schedule has been updated with the new task times.',
        suggestions: ['What should I work on next?', 'What is my biggest risk?'],
      };
    }

    case 'REJECT_PROPOSAL': {
      if (!context.pendingProposal) {
        return {
          intent: intent.type,
          message: 'There is no pending recovery proposal to reject. Your current plan remains intact.',
          suggestions: ['What should I work on next?', "I'm running 30m late"],
        };
      }
      context.onRejectProposal();
      return {
        intent: intent.type,
        message: '✕ Proposed revision rejected. Your previously accepted schedule remains active with zero modifications.',
        suggestions: ['What should I work on next?', "I'm running 30m late"],
      };
    }

    case 'WHAT_NEXT': {
      const blocks = context.acceptedPlan.blocks;
      if (blocks.length === 0) {
        return {
          intent: intent.type,
          message:
            'You currently have no tasks scheduled in your accepted plan. Please configure your availability windows or add tasks to build a schedule.',
          suggestions: ['Why is my plan infeasible?', 'Load Demo Scenario'],
        };
      }

      const nextBlock = blocks[0];
      const task = context.tasks.find((t) => t.id === nextBlock.taskId);
      const taskTitle = task ? task.title : `Task ${nextBlock.taskId}`;
      const timeRange = `${formatTimeOnly(nextBlock.start)} – ${formatTimeOnly(nextBlock.end)}`;
      const duration = formatDurationMinutes(diffInMinutes(nextBlock.start, nextBlock.end));

      let deadlineMsg = '';
      if (task?.deadline) {
        const buffer = diffInMinutes(nextBlock.end, task.deadline);
        deadlineMsg =
          buffer >= 0
            ? ` (deadline at ${formatTimeFriendly(task.deadline)}, leaving a ${formatDurationMinutes(buffer)} buffer)`
            : ` (deadline at ${formatTimeFriendly(task.deadline)} is tight)`;
      }

      const priority = task?.priority ? `${task.priority} priority` : 'standard';

      return {
        intent: intent.type,
        message: `Your next scheduled task is **${taskTitle}**, planned for **${timeRange}** (${duration}, ${priority})${deadlineMsg}. Focus on completing this block first.`,
        suggestions: ['What changed in the revised plan?', 'Why didn\'t calculus fit?'],
      };
    }

    case 'EXPLAIN_UNSCHEDULED': {
      const unscheduled = context.acceptedPlan.unscheduledTasks;
      if (unscheduled.length === 0) {
        return {
          intent: intent.type,
          message: 'All of your tasks are currently fitted into your accepted schedule! There are no unscheduled tasks.',
          suggestions: ['What should I work on next?', "I'm running 30m late"],
        };
      }

      if (intent.taskQuery) {
        const matched = findMatchingTasks(
          unscheduled.map((u) => u.task),
          intent.taskQuery,
        );

        if (matched.length === 1) {
          const u = unscheduled.find((item) => item.task.id === matched[0].id)!;
          return {
            intent: intent.type,
            message: `**${u.task.title}** (${formatDurationMinutes(u.task.estimatedMinutes)}) couldn't be scheduled: ${formatIsoInText(u.reason)}. ${u.task.deadline ? `Its deadline was ${formatTimeFriendly(u.task.deadline)}.` : ''}`,
            suggestions: ['What should I work on next?', 'I need to report a delay'],
          };
        }
      }

      // General explanation of all unscheduled tasks
      const reasonsList = unscheduled
        .map((u) => `• **${u.task.title}**: ${formatIsoInText(u.reason)}`)
        .join('\n');

      return {
        intent: intent.type,
        message: `The following ${unscheduled.length} task(s) could not fit into your available study windows:\n${reasonsList}\n\nYou can add more availability or report a change to see if rescheduling helps.`,
        suggestions: ['What should I work on next?', 'What is the biggest risk?'],
      };
    }

    case 'SUMMARIZE_PROPOSAL': {
      if (!context.pendingProposal) {
        return {
          intent: intent.type,
          message: 'There is no pending recovery proposal at this time. You are currently following your active schedule.',
          suggestions: ["I'm running 30m late", 'What should I work on next?'],
        };
      }

      const prop = context.pendingProposal;
      const changesSummary =
        prop.changes.length > 0
          ? prop.changes
              .map((c) => {
                const t = context.tasks.find((task) => task.id === c.taskId);
                const name = t ? t.title : c.taskId;
                return `• **${name}**: ${formatIsoInText(c.reason)} ${c.newStart ? `(starts at ${formatTimeFriendly(c.newStart)})` : ''}`;
              })
              .join('\n')
          : '• No task movements required.';

      return {
        intent: intent.type,
        message: `Here is the summary of the pending recovery proposal:\n${changesSummary}\n\n**Trade-offs:**\n${prop.tradeoffs.map((t) => `• ${formatIsoInText(t)}`).join('\n')}\n\nWould you like to approve or keep your current plan?`,
        tradeoffs: prop.tradeoffs.map((t) => formatIsoInText(t)),
        showApprovalActions: true,
        suggestions: ['Approve the revised plan', 'Keep my current plan'],
      };
    }

    case 'REPORT_DELAY': {
      const { delayMinutes, reason } = intent;
      try {
        context.onGenerateProposal({
          type: 'delay',
          delayMinutes,
          reason,
        });

        return {
          intent: intent.type,
          message: `I've calculated a revised schedule proposal adjusting for your **${delayMinutes}-minute delay**. Your original schedule remains active until you review and approve the proposal. Check the comparison panel to inspect which tasks were moved.`,
          showApprovalActions: true,
          suggestions: ['What changed in the revised plan?', 'Approve the revised plan', 'Keep my current plan'],
        };
      } catch (err) {
        return {
          intent: intent.type,
          message: `Failed to calculate delay proposal: ${err instanceof Error ? err.message : 'Invalid delay'}`,
        };
      }
    }

    case 'EXTEND_TASK': {
      const { taskQuery, additionalMinutes, reason } = intent;
      const matched = findMatchingTasks(context.tasks, taskQuery);

      if (matched.length === 0) {
        return {
          intent: intent.type,
          message: `I couldn't find an existing task matching "${taskQuery}". Please verify the task title from your task list.`,
          suggestions: context.tasks.slice(0, 3).map((t) => `Extend ${t.title} by 30m`),
        };
      }

      if (matched.length > 1) {
        const options = matched.map((t) => `"${t.title}"`).join(', ');
        return {
          intent: intent.type,
          message: `Multiple tasks matched "${taskQuery}": ${options}. Please specify the exact task title you want to extend.`,
          suggestions: matched.slice(0, 2).map((t) => `Extend ${t.title} by ${additionalMinutes}m`),
        };
      }

      const target = matched[0];
      try {
        context.onGenerateProposal({
          type: 'task_extended',
          taskId: target.id,
          additionalMinutes,
          reason,
        });

        return {
          intent: intent.type,
          message: `I've extended **${target.title}** by ${additionalMinutes} minutes and generated a candidate recovery plan. Review the affected schedule in the comparison panel.`,
          showApprovalActions: true,
          suggestions: ['What changed in the revised plan?', 'Approve the revised plan', 'Keep my current plan'],
        };
      } catch (err) {
        return {
          intent: intent.type,
          message: `Failed to extend task: ${err instanceof Error ? err.message : 'Error'}`,
        };
      }
    }

    case 'ADD_TASK': {
      const { title, estimatedMinutes, priority, deadline, reason } = intent;
      const newTask: Task = {
        id: `task-chat-${Date.now()}`,
        title,
        estimatedMinutes,
        priority,
        deadline,
        completed: false,
      };

      try {
        context.onGenerateProposal({
          type: 'new_task',
          task: newTask,
          reason,
        });

        return {
          intent: intent.type,
          message: `I've created a recovery proposal including **${title}** (${estimatedMinutes}m, ${priority} priority). The deterministic scheduler has evaluated where it can fit without breaking deadlines.`,
          showApprovalActions: true,
          suggestions: ['What changed in the revised plan?', 'Approve the revised plan', 'Keep my current plan'],
        };
      } catch (err) {
        return {
          intent: intent.type,
          message: `Could not schedule new task: ${err instanceof Error ? err.message : 'Validation error'}`,
        };
      }
    }

    case 'HELP': {
      return {
        intent: intent.type,
        message:
          'I am your **Deadline Rescue Assistant** (Alexa+ simulated experience). You can interact with me in plain English:\n\n' +
          '• **Report a delay:** *"I\'m running 30 minutes late"*\n' +
          '• **Extend work:** *"My physics report will take another 45 minutes"*\n' +
          '• **Add urgent tasks:** *"Add an urgent DMT viva for 60 minutes"*\n' +
          '• **Check next action:** *"What should I work on next?"*\n' +
          '• **Inspect conflicts:** *"Why didn\'t calculus fit?"*\n' +
          '• **Review proposals:** *"What changed in the revised plan?"*\n' +
          '• **Decisions:** *"Approve the revised plan"* or *"Keep my current plan"*\n\n' +
          'All calculations are deterministic and transparent. No schedule is replaced without your approval.',
        suggestions: ['What should I work on next?', "I'm running 30m late", "Why didn't calculus fit?"],
      };
    }

    case 'UNKNOWN':
    default: {
      return {
        intent: 'UNKNOWN',
        message:
          `I couldn't quite understand "${intent.rawQuery}".\n\n` +
          'You can try asking:\n' +
          '• *"What should I work on next?"*\n' +
          '• *"I\'m running 30 minutes late"*\n' +
          '• *"Why didn\'t calculus fit?"*\n' +
          '• *"Help"*',
        suggestions: ['What should I work on next?', "I'm running 30m late", "Why didn't calculus fit?"],
      };
    }
  }
}
