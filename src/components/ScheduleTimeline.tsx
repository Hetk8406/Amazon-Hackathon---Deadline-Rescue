import type { Plan, Task } from '../features/tasks/taskTypes';
import {
  formatTimeOnly,
  formatDurationMinutes,
  diffInMinutes,
  formatDateTimeFriendly,
  formatIsoInText,
} from '../lib/dateTime';
import styles from './ScheduleTimeline.module.css';

export type ScheduleTimelineProps = {
  plan: Plan;
  tasks: Task[];
};

export function ScheduleTimeline({ plan, tasks }: ScheduleTimelineProps) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return (
    <section className={styles.card} aria-labelledby="schedule-heading">
      <div className={styles.header}>
        <h2 id="schedule-heading" className={styles.heading}>Your Schedule</h2>
        <span className={styles.countBadge}>
          {plan.blocks.length} Blocks Planned
        </span>
      </div>

      {plan.blocks.length === 0 ? (
        <div className={styles.emptyState}>
          No tasks currently scheduled. Add tasks and ensure availability windows are configured.
        </div>
      ) : (
        <ol className={styles.timeline}>
          {plan.blocks.map((block, index) => {
            const task = taskMap.get(block.taskId);
            const durationMins = diffInMinutes(block.start, block.end);
            const title = task?.title || `Task (${block.taskId})`;

            let deadlineText = '';
            if (task?.deadline) {
              const buffer = diffInMinutes(block.end, task.deadline);
              const friendlyDeadline = formatDateTimeFriendly(task.deadline);
              if (buffer >= 0) {
                deadlineText = `Deadline: ${friendlyDeadline} (${formatDurationMinutes(buffer)} buffer)`;
              } else {
                deadlineText = `Deadline: ${friendlyDeadline} (exceeded)`;
              }
            }

            const statusClass =
              block.status === 'at-risk'
                ? styles.statusAtRisk
                : block.status === 'completed'
                  ? styles.statusCompleted
                  : styles.statusPlanned;

            return (
              <li key={`${block.taskId}-${index}`} className={styles.blockItem}>
                <div className={styles.timeCol}>
                  <span className={styles.timeRange}>
                    {formatTimeOnly(block.start)} &ndash; {formatTimeOnly(block.end)}
                  </span>
                  <span className={styles.durationText}>
                    {formatDurationMinutes(durationMins)}
                  </span>
                </div>

                <div className={styles.detailsCol}>
                  <div className={styles.taskTitle}>{title}</div>
                  <div className={styles.metaRow}>
                    <span className={`${styles.statusBadge} ${statusClass}`}>
                      {block.status}
                    </span>
                    {task?.priority && <span>Priority: {task.priority}</span>}
                    {deadlineText && (
                      <span className={styles.deadlineNotice}>{deadlineText}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {plan.unscheduledTasks.length > 0 && (
        <div className={styles.unscheduledSection}>
          <div className={styles.unscheduledTitle}>
            <span aria-hidden="true">⚠</span>
            Unscheduled Work ({plan.unscheduledTasks.length})
          </div>

          <ul className={styles.unscheduledList}>
            {plan.unscheduledTasks.map((u, idx) => (
              <li key={`${u.task.id}-${idx}`} className={styles.unscheduledItem}>
                <div className={styles.unscheduledTaskHeader}>
                  <span className={styles.unscheduledTaskTitle}>{u.task.title}</span>
                  <span className={styles.unscheduledDuration}>
                    {formatDurationMinutes(u.task.estimatedMinutes)}
                  </span>
                </div>
                <div className={styles.unscheduledReason}>
                  <strong>Why it didn&apos;t fit:</strong> {formatIsoInText(u.reason)}
                  {u.task.deadline && (
                    <span> (Deadline: {formatDateTimeFriendly(u.task.deadline)})</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default ScheduleTimeline;
