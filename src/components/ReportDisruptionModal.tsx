import React, { useState, useEffect } from 'react';
import type { Task, Priority } from '../features/tasks/taskTypes';
import type { DisruptionEvent } from '../features/planning/replan';
import { validateTask } from '../features/tasks/taskValidation';
import styles from './ReportDisruptionModal.module.css';

export type ReportDisruptionModalProps = {
  tasks: Task[];
  initialType?: 'delay' | 'task_extended' | 'new_task';
  initialDelayMinutes?: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDisruption: (disruption: DisruptionEvent) => void;
};

export function ReportDisruptionModal({
  tasks,
  initialType = 'delay',
  initialDelayMinutes = 30,
  isOpen,
  onClose,
  onSubmitDisruption,
}: ReportDisruptionModalProps) {
  const [activeTab, setActiveTab] = useState<'delay' | 'task_extended' | 'new_task'>(initialType);

  // Delay form state
  const [delayMinutes, setDelayMinutes] = useState(String(initialDelayMinutes));
  const [delayReason, setDelayReason] = useState('');

  // Task extended form state
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id || '');
  const [additionalMinutes, setAdditionalMinutes] = useState('30');
  const [extendedReason, setExtendedReason] = useState('');

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState('45');
  const [newPriority, setNewPriority] = useState<Priority>('high');
  const [newDeadline, setNewDeadline] = useState('');
  const [newReason, setNewReason] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when opening with fresh initial properties
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      setDelayMinutes(String(initialDelayMinutes));
      if (tasks[0] && !selectedTaskId) {
        setSelectedTaskId(tasks[0].id);
      }
      setErrorMessage('');
    }
  }, [isOpen, initialType, initialDelayMinutes, tasks, selectedTaskId]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'delay') {
      const parsed = Number(delayMinutes);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setErrorMessage('Delay must be a positive integer in minutes.');
        return;
      }
      onSubmitDisruption({
        type: 'delay',
        delayMinutes: parsed,
        reason: delayReason.trim() || `Running ${parsed} minutes late`,
      });
      onClose();
    } else if (activeTab === 'task_extended') {
      if (!selectedTaskId) {
        setErrorMessage('Please select a task.');
        return;
      }
      const parsed = Number(additionalMinutes);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        setErrorMessage('Additional duration must be a positive integer in minutes.');
        return;
      }
      const task = tasks.find((t) => t.id === selectedTaskId);
      onSubmitDisruption({
        type: 'task_extended',
        taskId: selectedTaskId,
        additionalMinutes: parsed,
        reason: extendedReason.trim() || `"${task?.title}" taking ${parsed}m longer`,
      });
      onClose();
    } else if (activeTab === 'new_task') {
      const parsed = Number(newMinutes);
      let formattedDeadline: string | undefined = undefined;
      if (newDeadline.trim()) {
        const raw = newDeadline.trim();
        formattedDeadline = raw.includes('Z') || raw.includes('+') ? raw : new Date(raw).toISOString();
      }

      const candidate = {
        id: `urgent-task-${Date.now()}`,
        title: newTitle,
        estimatedMinutes: parsed,
        priority: newPriority,
        deadline: formattedDeadline,
        completed: false,
      };

      const val = validateTask(candidate);
      if (!val.success) {
        setErrorMessage(val.errors[0]?.message || 'Invalid task input');
        return;
      }

      onSubmitDisruption({
        type: 'new_task',
        task: val.data,
        reason: newReason.trim() || `Added urgent task "${val.data.title}"`,
      });
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            <span aria-hidden="true">🔄</span>
            Report Schedule Disruption
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Disruption types">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'delay'}
            className={`${styles.tabBtn} ${activeTab === 'delay' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('delay');
              setErrorMessage('');
            }}
          >
            Running Late
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'task_extended'}
            className={`${styles.tabBtn} ${activeTab === 'task_extended' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('task_extended');
              setErrorMessage('');
            }}
          >
            Task Taking Longer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'new_task'}
            className={`${styles.tabBtn} ${activeTab === 'new_task' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('new_task');
              setErrorMessage('');
            }}
          >
            New Urgent Task
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {activeTab === 'delay' && (
            <>
              <div className={styles.fieldGroup}>
                <label htmlFor="delay-mins" className={styles.label}>
                  How many minutes are you delayed?
                </label>
                <input
                  id="delay-mins"
                  type="number"
                  min="5"
                  step="5"
                  className={styles.input}
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                />
                <div className={styles.quickPills}>
                  <button type="button" className={styles.pillBtn} onClick={() => setDelayMinutes('15')}>
                    +15m
                  </button>
                  <button type="button" className={styles.pillBtn} onClick={() => setDelayMinutes('30')}>
                    +30m
                  </button>
                  <button type="button" className={styles.pillBtn} onClick={() => setDelayMinutes('60')}>
                    +60m (1h)
                  </button>
                  <button type="button" className={styles.pillBtn} onClick={() => setDelayMinutes('120')}>
                    +120m (2h)
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="delay-reason" className={styles.label}>
                  Reason or note (optional)
                </label>
                <input
                  id="delay-reason"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Bus delayed, office hours ran over"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'task_extended' && (
            <>
              <div className={styles.fieldGroup}>
                <label htmlFor="select-task" className={styles.label}>
                  Select task taking longer
                </label>
                <select
                  id="select-task"
                  className={styles.select}
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.estimatedMinutes}m current)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="additional-mins" className={styles.label}>
                  Additional minutes needed
                </label>
                <input
                  id="additional-mins"
                  type="number"
                  min="5"
                  step="5"
                  className={styles.input}
                  value={additionalMinutes}
                  onChange={(e) => setAdditionalMinutes(e.target.value)}
                />
                <div className={styles.quickPills}>
                  <button type="button" className={styles.pillBtn} onClick={() => setAdditionalMinutes('30')}>
                    +30m
                  </button>
                  <button type="button" className={styles.pillBtn} onClick={() => setAdditionalMinutes('60')}>
                    +60m (1h)
                  </button>
                  <button type="button" className={styles.pillBtn} onClick={() => setAdditionalMinutes('90')}>
                    +90m
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="extend-reason" className={styles.label}>
                  Why does it need more time? (optional)
                </label>
                <input
                  id="extend-reason"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Debugging took longer than estimated"
                  value={extendedReason}
                  onChange={(e) => setExtendedReason(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'new_task' && (
            <>
              <div className={styles.fieldGroup}>
                <label htmlFor="urgent-title" className={styles.label}>
                  Task Title *
                </label>
                <input
                  id="urgent-title"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Surprise Chemistry Quiz Prep"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="urgent-minutes" className={styles.label}>
                  Estimated Duration (minutes) *
                </label>
                <input
                  id="urgent-minutes"
                  type="number"
                  min="5"
                  step="5"
                  className={styles.input}
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="urgent-priority" className={styles.label}>
                  Priority
                </label>
                <select
                  id="urgent-priority"
                  className={styles.select}
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                >
                  <option value="high">High (urgent)</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="urgent-deadline" className={styles.label}>
                  Deadline (optional)
                </label>
                <input
                  id="urgent-deadline"
                  type="datetime-local"
                  className={styles.input}
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="urgent-reason" className={styles.label}>
                  Context / Reason (optional)
                </label>
                <input
                  id="urgent-reason"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Announced in morning lecture"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
            </>
          )}

          {errorMessage && (
            <div className={styles.errorText} role="alert">
              {errorMessage}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Generate Recovery Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportDisruptionModal;
