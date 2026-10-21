import type { Proposal } from '../features/planning/replan';
import { formatTimeOnly, formatIsoInText } from '../lib/dateTime';
import styles from './PlanDiff.module.css';

export type PlanDiffProps = {
  proposal: Proposal;
  onApprove: (proposal: Proposal) => void;
  onReject: (proposal: Proposal) => void;
};

export function PlanDiff({ proposal, onApprove, onReject }: PlanDiffProps) {
  const { proposedPlan, previousPlan, changes, tradeoffs, disruption } = proposal;

  const disruptionLabel =
    disruption.type === 'delay'
      ? `General Delay: +${disruption.delayMinutes} minutes`
      : disruption.type === 'task_extended'
        ? `Task Extended: +${disruption.additionalMinutes} minutes`
        : `New Urgent Task: "${disruption.task.title}"`;

  const taskMap = new Map([
    ...previousPlan.tasks.map((t) => [t.id, t] as const),
    ...proposedPlan.tasks.map((t) => [t.id, t] as const),
  ]);

  return (
    <section className={styles.card} aria-labelledby="proposal-heading">
      <div className={styles.header}>
        <h2 id="proposal-heading" className={styles.heading}>
          <span aria-hidden="true">⚖️</span>
          Proposed Schedule Recovery Plan
        </h2>
        <span className={styles.pendingBadge}>Review Required</span>
      </div>

      <div className={styles.disruptionBanner}>
        <div className={styles.disruptionTitle}>Disruption Trigger: {disruptionLabel}</div>
        <div>{formatIsoInText(disruption.reason || 'Requested recovery adjustment.')}</div>
      </div>

      <div className={styles.comparisonSection}>
        <div className={styles.sectionTitle}>Key Schedule Changes ({changes.length})</div>
        {changes.length === 0 ? (
          <div className={styles.changeItem}>
            <span>No tasks required movement. Existing schedule remains feasible.</span>
          </div>
        ) : (
          <ul className={styles.changeList}>
            {changes.map((change) => {
              const task = taskMap.get(change.taskId);
              const title = task?.title || `Task (${change.taskId})`;

              return (
                <li key={change.taskId} className={styles.changeItem}>
                  <div>
                    <span className={styles.taskName}>{title}</span>
                    <div className={styles.timeShift}>
                      {change.oldStart && (
                        <span>
                          Was: {formatTimeOnly(change.oldStart)} &rarr;{' '}
                        </span>
                      )}
                      {change.newStart ? (
                        <span>Now: {formatTimeOnly(change.newStart)}</span>
                      ) : (
                        <span>Removed from schedule</span>
                      )}
                    </div>
                  </div>
                  <span className={styles.shiftReason}>{formatIsoInText(change.reason)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {tradeoffs.length > 0 && (
        <div className={styles.tradeoffsSection}>
          <div className={styles.sectionTitle}>Trade-offs &amp; Remaining Risks</div>
          <ul className={styles.tradeoffList}>
            {tradeoffs.map((item, idx) => (
              <li key={idx} className={styles.tradeoffItem}>
                <span className={styles.tradeoffBullet} aria-hidden="true">
                  &bull;
                </span>
                <span>{formatIsoInText(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.rejectBtn}
          onClick={() => onReject(proposal)}
        >
          Keep Current Plan (Reject)
        </button>
        <button
          type="button"
          className={styles.approveBtn}
          onClick={() => onApprove(proposal)}
        >
          Approve Revised Plan
        </button>
      </div>
    </section>
  );
}

export default PlanDiff;
