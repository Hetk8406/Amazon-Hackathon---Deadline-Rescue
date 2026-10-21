import type { FeasibilityReport } from '../features/planning/feasibility';
import { formatDurationMinutes } from '../lib/dateTime';
import styles from './FeasibilityPanel.module.css';

export type FeasibilityPanelProps = {
  report: FeasibilityReport;
};

export function FeasibilityPanel({ report }: FeasibilityPanelProps) {
  const { metrics, isFeasible, risks, summary } = report;

  return (
    <section className={styles.card} aria-labelledby="feasibility-heading">
      <div className={styles.header}>
        <h2 id="feasibility-heading" className={styles.heading}>Plan Feasibility</h2>
        <span
          className={`${styles.statusBadge} ${isFeasible ? styles.statusFeasible : styles.statusInfeasible}`}
        >
          <span aria-hidden="true">{isFeasible ? '✓' : '⚠'}</span>
          {isFeasible ? 'Schedule Feasible' : 'Conflicts Detected'}
        </span>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Required Work</div>
          <div className={styles.metricValue}>
            {formatDurationMinutes(metrics.totalRequiredMinutes)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Available Time</div>
          <div className={styles.metricValue}>
            {formatDurationMinutes(metrics.totalAvailableMinutes)}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>
            {metrics.netDeficitMinutes > 0 ? 'Capacity Deficit' : 'Tasks Status'}
          </div>
          <div
            className={`${styles.metricValue} ${metrics.netDeficitMinutes > 0 ? styles.metricDeficit : ''}`}
          >
            {metrics.netDeficitMinutes > 0
              ? `-${formatDurationMinutes(metrics.netDeficitMinutes)}`
              : `${metrics.scheduledTasksCount}/${metrics.totalTasksCount} fitted`}
          </div>
        </div>
      </div>

      {summary && <div className={styles.summaryText}>{summary}</div>}

      {risks.length > 0 && (
        <div className={styles.issuesSection}>
          <div className={styles.issuesTitle}>Scheduling Warnings &amp; Risks</div>
          <ul className={styles.issuesList}>
            {risks.map((risk, index) => {
              const isError = risk.severity === 'error';
              return (
                <li
                  key={`${risk.code}-${index}`}
                  className={`${styles.issueItem} ${isError ? styles.issueError : styles.issueWarning}`}
                >
                  <span
                    className={`${styles.issueTag} ${isError ? styles.issueTagError : styles.issueTagWarning}`}
                  >
                    {risk.code}
                  </span>
                  <span className={styles.issueMessage}>{risk.message}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export default FeasibilityPanel;
