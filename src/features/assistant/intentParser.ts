import type { Priority } from '../tasks/taskTypes';
import type { ParsedIntent } from './assistantTypes';

/**
 * Extracts duration in minutes from natural language snippets.
 * Supports patterns like "30 minutes", "1 hour", "an hour", "1.5 hours", "45m", "half an hour".
 */
export function extractDurationMinutes(text: string): number | null {
  const lower = text.toLowerCase();

  // Pattern: "half an hour" / "half hour"
  if (lower.includes('half an hour') || lower.includes('half hour')) {
    return 30;
  }

  // Pattern: "hour and a half" / "an hour and half"
  if (lower.includes('hour and a half') || lower.includes('hour and half')) {
    return 90;
  }

  // Pattern: decimal hours (e.g. "1.5 hours") - checked before integer hours so "1.5 hours" doesn't match "5 hours"
  const decimalHourMatch = lower.match(/(\d+\.\d+)\s*(?:hours|hour|hrs|hr|h)\b/);
  if (decimalHourMatch) {
    const hours = parseFloat(decimalHourMatch[1]);
    if (!Number.isNaN(hours) && hours > 0) {
      return Math.round(hours * 60);
    }
  }

  // Pattern: compound "1 hour 30 minutes" / "1 hour and 15 mins" / "1h 30m"
  const compoundMatch = lower.match(
    /(\d+)\s*(?:hours|hour|hrs|hr|h)(?:\s*(?:and)?\s*(\d+)\s*(?:minutes|minute|mins|min|m))?/i
  );
  if (compoundMatch) {
    const hours = parseInt(compoundMatch[1], 10);
    const mins = compoundMatch[2] ? parseInt(compoundMatch[2], 10) : 0;
    if (!Number.isNaN(hours) && hours > 0) {
      return hours * 60 + (Number.isNaN(mins) ? 0 : mins);
    }
  }

  // Pattern: "an hour" / "one hour"
  if (/\b(?:an|one)\s+(?:hour|hr)\b/.test(lower)) {
    return 60;
  }

  // Pattern: minutes (e.g. "30 minutes", "45 mins", "15 min", "45m")
  const minMatch = lower.match(/(\d+)\s*(?:minutes|minute|mins|min|m)\b/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (!Number.isNaN(mins) && mins > 0) {
      return mins;
    }
  }

  return null;
}

/**
 * Cleans user queries for matching against task titles.
 */
export function cleanQuery(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parses user natural-language queries into structured intents.
 */
export function parseIntent(query: string): ParsedIntent {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const normPunctuation = lower.replace(/[,!]/g, '').trim();

  // 1. Approval / Rejection intents (checked first to avoid confusion with task names)
  if (
    /^(?:please\s+)?(?:approve|apply|accept|confirm|yes\s+apply)(?:\s+(?:the\s+)?(?:revised|new|proposed)?\s*(?:plan|changes|proposal)?)?$/i.test(
      normPunctuation,
    ) ||
    /^(?:approve|accept|apply\s+changes|yes\s+apply\s+changes|approve\s+proposal)$/i.test(
      normPunctuation,
    )
  ) {
    return { type: 'APPROVE_PROPOSAL' };
  }

  if (
    /^(?:please\s+)?(?:reject|discard|cancel|keep\s+(?:my\s+)?(?:current\s+)?plan|no\s+keep)(?:\s+(?:the\s+)?(?:revised|new|proposed)?\s*(?:plan|changes|proposal)?)?$/i.test(
      normPunctuation,
    ) ||
    /^(?:reject\s+proposal|discard\s+proposal|cancel\s+proposal)$/i.test(
      normPunctuation,
    )
  ) {
    return { type: 'REJECT_PROPOSAL' };
  }

  // 2. What should I work on next?
  if (
    /what(?:\s+should\s+i|\s+to)\s+(?:work\s+on|do|focus\s+on)(?:\s+next)?/i.test(lower) ||
    /what\s+is\s+my\s+next\s+task/i.test(lower) ||
    /^next\s+task$/i.test(lower) ||
    /^what\s+next\??$/i.test(lower)
  ) {
    return { type: 'WHAT_NEXT' };
  }

  // 3. Summarize proposal / What changed?
  if (
    /what\s+changed(?:\s+in\s+the\s+(?:revised\s+)?plan)?/i.test(lower) ||
    /explain\s+(?:the\s+)?(?:new|revised|proposed)\s+plan/i.test(lower) ||
    /what\s+do\s+i\s+lose/i.test(lower) ||
    /summarize\s+(?:the\s+)?proposal/i.test(lower) ||
    /trade[- ]?offs?/i.test(lower)
  ) {
    return { type: 'SUMMARIZE_PROPOSAL' };
  }

  // 4. Explain unscheduled task or infeasibility
  const whyUnscheduledMatch = lower.match(
    /why\s+(?:couldn't|didn't|wasn't|can't)\s+(?:my\s+)?(.*?)\s+(?:fit|scheduled|finish)/i,
  );
  if (whyUnscheduledMatch) {
    const taskQuery = whyUnscheduledMatch[1].trim();
    return {
      type: 'EXPLAIN_UNSCHEDULED',
      taskQuery: taskQuery || undefined,
    };
  }

  if (
    /why\s+is\s+(?:my\s+)?(?:plan|schedule)\s+infeasible/i.test(lower) ||
    /why\s+infeasible/i.test(lower) ||
    /what\s+is\s+(?:the\s+)?(?:biggest\s+)?risk/i.test(lower) ||
    /explain\s+(?:the\s+)?risks?/i.test(lower)
  ) {
    return { type: 'EXPLAIN_UNSCHEDULED' };
  }

  // 5. Help intent
  if (
    /^(?:help|\?|what\s+can\s+you\s+do|how\s+does\s+this\s+work|options)$/i.test(
      lower.replace(/\?$/, '').trim(),
    )
  ) {
    return { type: 'HELP' };
  }

  // 6. Delay intent (e.g. "I'm running 30 minutes late", "I'm running an hour late", "I lost 45 minutes")
  const isDelayPhrase =
    /running\s+(?:late|behind)/i.test(lower) ||
    /delayed\s+(?:by)?/i.test(lower) ||
    /lost\s+\d+/i.test(lower) ||
    /\b(?:late|behind)\b/i.test(lower);

  const duration = extractDurationMinutes(lower);

  if (isDelayPhrase && duration) {
    return {
      type: 'REPORT_DELAY',
      delayMinutes: duration,
      reason: trimmed,
    };
  }

  // 7. Task extended intent (e.g. "My physics report will take another 45 minutes", "Calculus practice needs 30 more minutes")
  const isExtendPhrase =
    /(?:take|needs?|will\s+take)\s+(?:another|more|\+\d+)/i.test(lower) ||
    /(?:taking|taking\s+longer|needs?\s+more\s+time)/i.test(lower) ||
    /extended\s+by/i.test(lower);

  if (isExtendPhrase && duration) {
    // Try to extract task name before or around the duration
    // Example: "My physics report will take another 45 minutes" -> "physics report"
    let taskSnippet = lower
      .replace(/^(?:my|the)\s+/i, '')
      .replace(/\s+(?:will\s+take|takes?|needs?|is\s+taking|is\s+extended)\b.*/i, '')
      .replace(/\b(?:another|more|\d+|hours?|minutes?|mins?|h|m)\b/gi, '')
      .trim();

    if (!taskSnippet) {
      taskSnippet = lower;
    }

    return {
      type: 'EXTEND_TASK',
      taskQuery: taskSnippet,
      additionalMinutes: duration,
      reason: trimmed,
    };
  }

  // 8. Add task intent (e.g. "Add an urgent DMT viva tomorrow at 2 PM. It should take an hour.")
  const isAddPhrase = /^(?:please\s+)?add\s+(?:a\s+)?(?:new\s+)?(?:task|assignment|quiz|prep|viva)?/i.test(lower) ||
    /^(?:i\s+need\s+to\s+prepare\s+for|i\s+have\s+to\s+do)\s+/i.test(lower);

  if (isAddPhrase) {
    const taskDuration = duration || 60; // Default to 60m if unspecified or fallback
    const priority: Priority = /\burgent|high\s+priority|critical\b/i.test(lower) ? 'high' : 'medium';

    // Extract title: remove prefixes like "Add an urgent task called", "Add new task", etc.
    let title = trimmed
      .replace(/^(?:please\s+)?add\s+(?:a\s+)?(?:new\s+)?(?:urgent\s+)?(?:task\s+)?(?:called\s+|named\s+)?/i, '')
      .replace(/^(?:i\s+need\s+to\s+prepare\s+for|i\s+have\s+to\s+do)\s+/i, '')
      .replace(/\s+(?:for|taking|takes|duration)\s+\d+\s*(?:minutes?|mins?|hours?|hrs?|h|m).*/i, '')
      .replace(/\s+(?:it\s+should\s+take\s+.*)/i, '')
      .replace(/\s+(?:tomorrow|today|at\s+\d+.*)/i, '')
      .replace(/\s+(?:urgently|high\s+priority).*/i, '')
      .trim();

    if (!title) {
      title = 'New Task';
    }

    return {
      type: 'ADD_TASK',
      title,
      estimatedMinutes: taskDuration,
      priority,
      reason: trimmed,
    };
  }

  // If user only wrote a duration with late, e.g. "30 mins late" or "delayed 45m"
  if (duration && (lower.includes('late') || lower.includes('delay') || lower.includes('behind'))) {
    return {
      type: 'REPORT_DELAY',
      delayMinutes: duration,
      reason: trimmed,
    };
  }

  // Unknown fallback
  return {
    type: 'UNKNOWN',
    rawQuery: trimmed,
  };
}
