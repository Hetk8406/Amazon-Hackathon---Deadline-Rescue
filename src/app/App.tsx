import { useState, useMemo } from 'react';
import type { Task, TimeWindow, Plan } from '../features/tasks/taskTypes';
import type { ChatMessage } from '../features/assistant/assistantTypes';
import { scheduleTasks } from '../features/planning/scheduler';
import { checkPlanFeasibility } from '../features/planning/feasibility';
import {
  generateProposal,
  approveProposal,
  rejectProposal,
  type Proposal,
  type DisruptionEvent,
} from '../features/planning/replan';
import { processAssistantMessage } from '../features/assistant/assistantService';
import { DEMO_SCENARIO, createDemoScenario } from '../data/demoScenario';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { AvailabilityEditor } from '../components/AvailabilityEditor';
import { ScheduleTimeline } from '../components/ScheduleTimeline';
import { FeasibilityPanel } from '../components/FeasibilityPanel';
import { ChatPanel } from '../components/ChatPanel';
import { PlanDiff } from '../components/PlanDiff';
import { ReportDisruptionModal } from '../components/ReportDisruptionModal';
import styles from './App.module.css';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-initial-welcome',
    role: 'assistant',
    content:
      'Hello! I am your Deadline Rescue Assistant (Alexa+ simulated experience). Tell me if you are running late, need to extend a task, or want to know what to work on next.',
    timestamp: DEMO_SCENARIO.referenceTime,
    suggestions: ['What should I work on next?', "I'm running 30m late", "Why didn't calculus fit?"],
  },
];

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => [...DEMO_SCENARIO.tasks]);
  const [availability, setAvailability] = useState<TimeWindow[]>(() => [
    ...DEMO_SCENARIO.availability,
  ]);
  const [referenceTime, setReferenceTime] = useState<string>(DEMO_SCENARIO.referenceTime);

  // Proposal state for recovery workflow
  const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'delay' | 'task_extended' | 'new_task'>('delay');
  const [modalInitialMinutes, setModalInitialMinutes] = useState(30);

  // User feedback notification
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Conversational message state
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  // The accepted plan: explicitly derived from confirmed tasks & availability
  const acceptedPlan: Plan = useMemo(() => {
    try {
      return scheduleTasks({
        tasks,
        availability,
        referenceTime,
        planId: 'accepted-plan-current',
      });
    } catch {
      return {
        id: 'plan-error',
        createdAt: referenceTime,
        tasks,
        blocks: [],
        unscheduledTasks: [],
        issues: [],
        warnings: ['Unable to calculate plan with current inputs.'],
        assumptions: [],
      };
    }
  }, [tasks, availability, referenceTime]);

  // Feasibility report for the accepted plan
  const feasibilityReport = useMemo(() => {
    return checkPlanFeasibility(acceptedPlan, availability, referenceTime);
  }, [acceptedPlan, availability, referenceTime]);

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    setPendingProposal(null);
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    );
    setPendingProposal(null);
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setPendingProposal(null);
  };

  const handleAddWindow = (newWin: TimeWindow) => {
    setAvailability((prev) => [...prev, newWin]);
    setPendingProposal(null);
  };

  const handleRemoveWindow = (index: number) => {
    setAvailability((prev) => prev.filter((_, idx) => idx !== index));
    setPendingProposal(null);
  };

  const handleOpenDisruptionModal = (
    type: 'delay' | 'task_extended' | 'new_task' = 'delay',
    defaultMinutes = 30,
  ) => {
    setModalInitialType(type);
    setModalInitialMinutes(defaultMinutes);
    setIsModalOpen(true);
  };

  const handleSubmitDisruption = (disruption: DisruptionEvent) => {
    try {
      const proposal = generateProposal({
        currentPlan: acceptedPlan,
        currentTasks: tasks,
        currentAvailability: availability,
        referenceTime,
        disruption,
      });
      setPendingProposal(proposal);
      setFeedbackBanner({
        type: 'info',
        message: 'Recovery proposal generated. Review trade-offs below before applying.',
      });
    } catch (err) {
      setFeedbackBanner({
        type: 'info',
        message: err instanceof Error ? err.message : 'Failed to generate proposal.',
      });
    }
  };

  const handleApproveProposal = (proposal: Proposal) => {
    try {
      const result = approveProposal(proposal);
      setTasks(result.tasks);
      setAvailability(result.availability);
      if (proposal.disruption.type === 'delay') {
        // Effective reference time shifts forward with delay
        const shiftedTime = proposal.proposedPlan.createdAt;
        setReferenceTime(shiftedTime);
      }
      setPendingProposal(null);
      setFeedbackBanner({
        type: 'success',
        message: '✓ Revised recovery plan approved! Your schedule has been updated.',
      });
    } catch (err) {
      setFeedbackBanner({
        type: 'info',
        message: err instanceof Error ? err.message : 'Failed to approve proposal.',
      });
    }
  };

  const handleRejectProposal = (proposal: Proposal) => {
    try {
      rejectProposal(proposal);
      setPendingProposal(null);
      setFeedbackBanner({
        type: 'info',
        message: '✕ Proposed revision rejected. Your current schedule remains active.',
      });
    } catch (err) {
      setFeedbackBanner({
        type: 'info',
        message: err instanceof Error ? err.message : 'Failed to reject proposal.',
      });
    }
  };

  const handleResetDemo = () => {
    const freshDemo = createDemoScenario();
    setTasks([...freshDemo.tasks]);
    setAvailability([...freshDemo.availability]);
    setReferenceTime(freshDemo.referenceTime);
    setPendingProposal(null);
    setFeedbackBanner(null);
    setMessages(INITIAL_MESSAGES);
  };

  const handleClearAll = () => {
    setTasks([]);
    setAvailability([]);
    setPendingProposal(null);
    setFeedbackBanner(null);
    setMessages(INITIAL_MESSAGES);
  };

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const result = processAssistantMessage(text, {
      tasks,
      availability,
      acceptedPlan,
      pendingProposal,
      referenceTime,
      onGenerateProposal: (disruption) => {
        handleSubmitDisruption(disruption);
      },
      onApproveProposal: () => {
        if (pendingProposal) {
          handleApproveProposal(pendingProposal);
        }
      },
      onRejectProposal: () => {
        if (pendingProposal) {
          handleRejectProposal(pendingProposal);
        }
      },
    });

    const assistantMsg: ChatMessage = {
      id: `msg-assistant-${Date.now() + 1}`,
      role: 'assistant',
      content: result.message,
      timestamp: new Date().toISOString(),
      intent: result.intent,
      tradeoffs: result.tradeoffs,
      showApprovalActions: result.showApprovalActions,
      suggestions: result.suggestions,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.brandGroup}>
            <span className={styles.brandTitle}>Deadline Rescue</span>
            <span className={styles.trackPill}>Amazon Hackathon &bull; Alexa+ Track</span>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.disruptionBtn}`}
              onClick={() => handleOpenDisruptionModal('delay', 30)}
              title="Report an unexpected delay, longer task, or new assignment"
            >
              🔄 Report Disruption
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleClearAll}
              title="Clear all tasks and availability to test empty states"
            >
              Clear All
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleResetDemo}
              title="Reset to the preloaded midterm crunch demo scenario"
            >
              Reset Demo Scenario
            </button>
          </div>
        </div>
      </header>

      {feedbackBanner && (
        <div
          className={`${styles.banner} ${feedbackBanner.type === 'success' ? styles.bannerSuccess : styles.bannerInfo}`}
          role="status"
        >
          <span>{feedbackBanner.message}</span>
          <button
            type="button"
            className={styles.bannerClose}
            onClick={() => setFeedbackBanner(null)}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      <main className={styles.mainLayout}>
        <div className={styles.leftCol}>
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            onApproveProposal={() => {
              if (pendingProposal) {
                handleApproveProposal(pendingProposal);
              }
            }}
            onRejectProposal={() => {
              if (pendingProposal) {
                handleRejectProposal(pendingProposal);
              }
            }}
            isProposalPending={Boolean(pendingProposal)}
          />
          <TaskForm onAddTask={handleAddTask} />
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onRemoveTask={handleRemoveTask}
          />
          <AvailabilityEditor
            availability={availability}
            onAddWindow={handleAddWindow}
            onRemoveWindow={handleRemoveWindow}
          />
        </div>

        <div className={styles.rightCol}>
          {pendingProposal && (
            <PlanDiff
              proposal={pendingProposal}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
            />
          )}

          <FeasibilityPanel report={feasibilityReport} />
          <ScheduleTimeline plan={acceptedPlan} tasks={tasks} />
        </div>
      </main>

      <ReportDisruptionModal
        isOpen={isModalOpen}
        tasks={tasks}
        initialType={modalInitialType}
        initialDelayMinutes={modalInitialMinutes}
        onClose={() => setIsModalOpen(false)}
        onSubmitDisruption={handleSubmitDisruption}
      />

      <footer className={styles.footer}>
        <div>
          Deadline Rescue &bull; Conversational Schedule Recovery Assistant &bull; Built for Build, Ship, Shape: Amazon Developer Hackathon
        </div>
        <div>
          Core scheduling calculations are pure and deterministic. Alexa+ assistant integration runs as a simulated track experience.
        </div>
        <div>
          Privacy Notice: All schedule calculations and chat simulations run locally in browser memory. No student data or study schedules are transmitted to external servers.
        </div>
      </footer>
    </div>
  );
}

export default App;
