import React, { useState } from 'react';
import type { TimeWindow } from '../features/tasks/taskTypes';
import { validateAvailabilityWindow } from '../features/tasks/taskValidation';
import {
  formatDateTimeShort,
  diffInMinutes,
  formatDurationMinutes,
} from '../lib/dateTime';
import styles from './AvailabilityEditor.module.css';

export type AvailabilityEditorProps = {
  availability: TimeWindow[];
  onAddWindow: (window: TimeWindow) => void;
  onRemoveWindow: (index: number) => void;
};

export function AvailabilityEditor({
  availability,
  onAddWindow,
  onRemoveWindow,
}: AvailabilityEditorProps) {
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const totalAvailableMins = availability.reduce((sum, win) => {
    try {
      return sum + Math.max(0, diffInMinutes(win.start, win.end));
    } catch {
      return sum;
    }
  }, 0);

  const handleAddWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startInput.trim() || !endInput.trim()) {
      setErrorMessage('Please specify both start and end times.');
      return;
    }

    const startIso = startInput.includes('Z') || startInput.includes('+')
      ? startInput
      : new Date(startInput).toISOString();
    const endIso = endInput.includes('Z') || endInput.includes('+')
      ? endInput
      : new Date(endInput).toISOString();

    const validation = validateAvailabilityWindow({ start: startIso, end: endIso });
    if (!validation.success) {
      setErrorMessage(validation.errors[0]?.message || 'Invalid availability window.');
      return;
    }

    onAddWindow(validation.data);
    setStartInput('');
    setEndInput('');
    setErrorMessage('');
  };

  return (
    <section className={styles.card} aria-labelledby="availability-heading">
      <div className={styles.header}>
        <h2 id="availability-heading" className={styles.heading}>Planning Availability</h2>
        <span className={styles.totalBadge}>
          {formatDurationMinutes(totalAvailableMins)} Total Available
        </span>
      </div>

      {availability.length === 0 ? (
        <div className={styles.emptyState}>
          No availability windows defined. Add when you are free to study below.
        </div>
      ) : (
        <ul className={styles.windowList}>
          {availability.map((win, idx) => {
            let durationStr = '';
            try {
              const mins = diffInMinutes(win.start, win.end);
              durationStr = `(${formatDurationMinutes(mins)})`;
            } catch {
              durationStr = '';
            }

            return (
              <li key={`${win.start}-${win.end}-${idx}`} className={styles.windowItem}>
                <span className={styles.windowTime}>
                  {formatDateTimeShort(win.start)} &rarr; {formatDateTimeShort(win.end)}
                  <span className={styles.windowDuration}>{durationStr}</span>
                </span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemoveWindow(idx)}
                  aria-label={`Remove window ${formatDateTimeShort(win.start)} to ${formatDateTimeShort(win.end)}`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form className={styles.addForm} onSubmit={handleAddWindow} noValidate>
        <div className={styles.formTitle}>Add Availability Slot</div>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="avail-start" className={styles.label}>
              Start Time
            </label>
            <input
              id="avail-start"
              type="datetime-local"
              className={`${styles.input} ${errorMessage ? styles.inputError : ''}`}
              value={startInput}
              onChange={(e) => {
                setStartInput(e.target.value);
                setErrorMessage('');
              }}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="avail-end" className={styles.label}>
              End Time
            </label>
            <input
              id="avail-end"
              type="datetime-local"
              className={`${styles.input} ${errorMessage ? styles.inputError : ''}`}
              value={endInput}
              onChange={(e) => {
                setEndInput(e.target.value);
                setErrorMessage('');
              }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className={styles.errorText} role="alert">
            {errorMessage}
          </div>
        )}

        <button type="submit" className={styles.addBtn}>
          + Add Time Window
        </button>
      </form>
    </section>
  );
}

export default AvailabilityEditor;
