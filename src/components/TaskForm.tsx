import React, { useState } from 'react';
import type { Task, Priority } from '../features/tasks/taskTypes';
import { validateTask } from '../features/tasks/taskValidation';
import styles from './TaskForm.module.css';

export type TaskFormProps = {
  onAddTask: (task: Task) => void;
};

export function TaskForm({ onAddTask }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedMinutes = estimatedMinutes.trim() ? Number(estimatedMinutes) : NaN;
    let formattedDeadline: string | undefined = undefined;
    if (deadline.trim()) {
      // If user provided a local datetime (e.g. "2026-10-21T15:00"), append seconds & Z if not present
      const raw = deadline.trim();
      formattedDeadline = raw.includes('Z') || raw.includes('+') ? raw : new Date(raw).toISOString();
    }

    const candidate = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      estimatedMinutes: parsedMinutes,
      priority,
      deadline: formattedDeadline,
      completed: false,
    };

    const validation = validateTask(candidate);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      for (const err of validation.errors) {
        errMap[err.field] = err.message;
      }
      setFieldErrors(errMap);
      return;
    }

    // Success: add task and reset form
    onAddTask(validation.data);
    setTitle('');
    setEstimatedMinutes('');
    setPriority('medium');
    setDeadline('');
    setFieldErrors({});
  };

  const handleReset = () => {
    setTitle('');
    setEstimatedMinutes('');
    setPriority('medium');
    setDeadline('');
    setFieldErrors({});
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit} noValidate aria-labelledby="add-task-heading">
      <div className={styles.header}>
        <h2 id="add-task-heading" className={styles.heading}>Add New Task</h2>
      </div>

      <div className={styles.formGrid}>
        <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
          <label htmlFor="task-title" className={styles.label}>
            Task Title <span aria-hidden="true">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            className={`${styles.input} ${fieldErrors.title ? styles.inputError : ''}`}
            placeholder="e.g. CS 101 Problem Set"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'task-title-error' : undefined}
          />
          {fieldErrors.title && (
            <span id="task-title-error" className={styles.errorText} role="alert">
              {fieldErrors.title}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-duration" className={styles.label}>
            Estimated Duration (minutes) <span aria-hidden="true">*</span>
          </label>
          <input
            id="task-duration"
            type="number"
            min="1"
            step="5"
            className={`${styles.input} ${fieldErrors.estimatedMinutes ? styles.inputError : ''}`}
            placeholder="e.g. 60"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            aria-invalid={Boolean(fieldErrors.estimatedMinutes)}
            aria-describedby={fieldErrors.estimatedMinutes ? 'task-duration-error' : undefined}
          />
          {fieldErrors.estimatedMinutes && (
            <span id="task-duration-error" className={styles.errorText} role="alert">
              {fieldErrors.estimatedMinutes}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="task-priority" className={styles.label}>
            Priority
          </label>
          <select
            id="task-priority"
            className={styles.select}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="high">High (urgent)</option>
            <option value="medium">Medium (standard)</option>
            <option value="low">Low (flexible)</option>
          </select>
        </div>

        <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
          <label htmlFor="task-deadline" className={styles.label}>
            Deadline (optional)
          </label>
          <input
            id="task-deadline"
            type="datetime-local"
            className={`${styles.input} ${fieldErrors.deadline ? styles.inputError : ''}`}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={Boolean(fieldErrors.deadline)}
            aria-describedby={fieldErrors.deadline ? 'task-deadline-error' : undefined}
          />
          {fieldErrors.deadline && (
            <span id="task-deadline-error" className={styles.errorText} role="alert">
              {fieldErrors.deadline}
            </span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        {(title || estimatedMinutes || deadline) && (
          <button type="button" className={styles.secondaryBtn} onClick={handleReset}>
            Clear
          </button>
        )}
        <button type="submit" className={styles.primaryBtn}>
          Add Task
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
