import type { Task, Priority } from '../features/tasks/taskTypes';
import { formatDurationMinutes, formatDateTimeFriendly } from '../lib/dateTime';
import styles from './TaskList.module.css';

export type TaskListProps = {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
};

function getPriorityClass(priority: Priority): string {
  switch (priority) {
    case 'high':
      return styles.priorityHigh;
    case 'medium':
      return styles.priorityMedium;
    case 'low':
      return styles.priorityLow;
    default:
      return '';
  }
}

export function TaskList({ tasks, onToggleComplete, onRemoveTask }: TaskListProps) {
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <section className={styles.card} aria-labelledby="task-list-heading">
      <div className={styles.header}>
        <h2 id="task-list-heading" className={styles.heading}>Your Tasks</h2>
        <span className={styles.countBadge}>
          {completedCount}/{tasks.length} Completed
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          No tasks entered yet. Use the form above or click &ldquo;Load Demo Scenario&rdquo; to populate your plan.
        </div>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => {
            const priorityClass = getPriorityClass(task.priority);

            return (
              <li
                key={task.id}
                className={`${styles.item} ${task.completed ? styles.itemCompleted : ''}`}
              >
                <div className={styles.leftGroup}>
                  <input
                    type="checkbox"
                    id={`task-check-${task.id}`}
                    className={styles.checkbox}
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  />
                  <div className={styles.content}>
                    <span className={`${styles.title} ${task.completed ? styles.titleCompleted : ''}`}>
                      {task.title}
                    </span>
                    <div className={styles.metaRow}>
                      <span className={`${styles.priorityBadge} ${priorityClass}`}>
                        {task.priority} priority
                      </span>
                      <span>Duration: {formatDurationMinutes(task.estimatedMinutes)}</span>
                      {task.deadline && (
                        <span>Deadline: {formatDateTimeFriendly(task.deadline)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemoveTask(task.id)}
                  aria-label={`Delete task: ${task.title}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default TaskList;
