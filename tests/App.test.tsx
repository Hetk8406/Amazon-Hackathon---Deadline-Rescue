import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../src/app/App';

describe('Deadline Rescue Main Experience (Phase 2 & Phase 3)', () => {
  it('renders the main dashboard with all core panels', () => {
    render(<App />);

    expect(screen.getAllByText(/deadline rescue/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /conversational assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /add new task/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /planning availability/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /plan feasibility/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /your schedule/i })).toBeInTheDocument();
  });

  it('loads the preloaded demo scenario with scheduled blocks and an unscheduled task', () => {
    render(<App />);

    const taskListSection = screen.getByRole('region', { name: /your tasks/i });
    expect(within(taskListSection).getByText(/Algorithms Problem Set/i)).toBeInTheDocument();
    expect(within(taskListSection).getByText(/Physics Lab Report/i)).toBeInTheDocument();
    expect(within(taskListSection).getByText(/History Reading/i)).toBeInTheDocument();
    expect(within(taskListSection).getByText(/Calculus Midterm Review/i)).toBeInTheDocument();

    // The engine scheduled 3 tasks in the timeline
    expect(screen.getByText(/3 Blocks Planned/i)).toBeInTheDocument();

    // The engine identified 1 unscheduled task with deadline exceeded
    expect(screen.getByText(/Unscheduled Work \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Why it didn't fit:/i)).toBeInTheDocument();

    // Feasibility panel reports conflicts detected and capacity deficit
    expect(screen.getByText(/Conflicts Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Capacity Deficit/i)).toBeInTheDocument();
  });

  it('displays user-friendly dates (e.g. "21 Oct, 3:00 PM") and no raw ISO timestamps in deadline warnings', () => {
    render(<App />);

    // In task list, Calculus deadline is formatted friendly
    const taskListSection = screen.getByRole('region', { name: /your tasks/i });
    expect(within(taskListSection).getByText(/Deadline: 21 Oct, 3:00 PM/i)).toBeInTheDocument();

    // In timeline unscheduled work, reason displays friendly deadline
    const scheduleSection = screen.getByRole('region', { name: /your schedule/i });
    expect(
      within(scheduleSection).getByText(/Task cannot be completed before its deadline \(21 Oct, 3:00 PM\)/i),
    ).toBeInTheDocument();

    // Raw ISO strings are nowhere in the rendered text
    expect(screen.queryByText(/2026-10-21T15:00:00/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026-10-21T12:00:00/)).not.toBeInTheDocument();
  });

  it('adds a valid task and updates the schedule', () => {
    render(<App />);

    const titleInput = screen.getByLabelText(/task title/i);
    const durationInput = screen.getByLabelText(/estimated duration/i);
    const addBtn = screen.getByRole('button', { name: /add task/i });

    fireEvent.change(titleInput, { target: { value: 'Organic Chemistry Pre-Lab' } });
    fireEvent.change(durationInput, { target: { value: '45' } });
    fireEvent.click(addBtn);

    const taskListSection = screen.getByRole('region', { name: /your tasks/i });
    expect(within(taskListSection).getByText(/Organic Chemistry Pre-Lab/i)).toBeInTheDocument();
  });

  it('displays validation errors when adding invalid task input', () => {
    render(<App />);

    const addBtn = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/task title must be a non-empty string/i)).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/task title/i);
    const durationInput = screen.getByLabelText(/estimated duration/i);

    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
    fireEvent.change(durationInput, { target: { value: '0' } });
    fireEvent.click(addBtn);

    expect(screen.getByText(/task duration must be a positive integer in minutes/i)).toBeInTheDocument();
  });

  it('removes a task and updates the list and schedule', () => {
    render(<App />);

    const taskListSection = screen.getByRole('region', { name: /your tasks/i });
    expect(within(taskListSection).getByText(/Algorithms Problem Set/i)).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /delete task: algorithms problem set/i });
    fireEvent.click(removeBtn);

    expect(within(taskListSection).queryByText(/Algorithms Problem Set/i)).not.toBeInTheDocument();
  });

  it('marks a task complete and updates completion state', () => {
    render(<App />);

    const checkbox = screen.getByLabelText(/mark "history reading \(ch\. 14 primary sources\)" as complete/i);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('validates availability window inputs and rejects invalid/reversed times', () => {
    render(<App />);

    const addWinBtn = screen.getByRole('button', { name: /\+ add time window/i });

    fireEvent.click(addWinBtn);
    expect(screen.getByText(/please specify both start and end times/i)).toBeInTheDocument();

    const startInput = screen.getByLabelText(/start time/i);
    const endInput = screen.getByLabelText(/end time/i);

    fireEvent.change(startInput, { target: { value: '2026-10-21T18:00' } });
    fireEvent.change(endInput, { target: { value: '2026-10-21T16:00' } });
    fireEvent.click(addWinBtn);

    expect(screen.getByText(/window end must be strictly after start/i)).toBeInTheDocument();
  });

  it('supports clear all and reset demo scenario', () => {
    render(<App />);

    const clearBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText(/no tasks entered yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no availability windows defined/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /reset demo scenario/i });
    fireEvent.click(resetBtn);

    const taskListSection = screen.getByRole('region', { name: /your tasks/i });
    expect(within(taskListSection).getByText(/Algorithms Problem Set/i)).toBeInTheDocument();
    expect(within(taskListSection).getByText(/Calculus Midterm Review/i)).toBeInTheDocument();
  });

  describe('Phase 3: Replanning and recovery workflow', () => {
    it('creates a pending recovery proposal when a delay is reported while preserving accepted plan', () => {
      render(<App />);

      // Original accepted schedule starts at 09:00
      const scheduleSection = screen.getByRole('region', { name: /your schedule/i });
      expect(within(scheduleSection).getByText(/09:00/)).toBeInTheDocument();

      // Open disruption modal
      const reportBtn = screen.getByRole('button', { name: /report disruption/i });
      fireEvent.click(reportBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/report schedule disruption/i)).toBeInTheDocument();

      // Change delay to 60m
      const delayInput = screen.getByLabelText(/how many minutes are you delayed/i);
      fireEvent.change(delayInput, { target: { value: '60' } });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /generate recovery proposal/i });
      fireEvent.click(submitBtn);

      // Proposal review panel is now visible
      expect(screen.getByRole('heading', { name: /proposed schedule recovery plan/i })).toBeInTheDocument();
      expect(screen.getByText(/review required/i)).toBeInTheDocument();
      expect(screen.getByText(/General Delay: \+60 minutes/i)).toBeInTheDocument();

      // Original accepted plan is STILL active and untouched!
      expect(within(scheduleSection).getByText(/09:00/)).toBeInTheDocument();
    });

    it('approving a proposal applies the revised schedule to the accepted plan', () => {
      render(<App />);

      const reportBtn = screen.getByRole('button', { name: /report disruption/i });
      fireEvent.click(reportBtn);

      const delayInput = screen.getByLabelText(/how many minutes are you delayed/i);
      fireEvent.change(delayInput, { target: { value: '60' } });

      const submitBtn = screen.getByRole('button', { name: /generate recovery proposal/i });
      fireEvent.click(submitBtn);

      // Click Approve Revised Plan
      const approveBtn = screen.getByRole('button', { name: /approve revised plan/i });
      fireEvent.click(approveBtn);

      // Confirmation banner appears
      expect(screen.getByText(/revised recovery plan approved/i)).toBeInTheDocument();

      // Proposal review panel is closed
      expect(screen.queryByRole('heading', { name: /proposed schedule recovery plan/i })).not.toBeInTheDocument();

      // The accepted schedule now reflects the 09:30 start (shifted by 60m from reference 08:30)
      const scheduleSection = screen.getByRole('region', { name: /your schedule/i });
      expect(within(scheduleSection).getByText(/09:30/)).toBeInTheDocument();
    });

    it('rejecting a proposal preserves the original schedule and dismisses the review', () => {
      render(<App />);

      const scheduleSection = screen.getByRole('region', { name: /your schedule/i });
      expect(within(scheduleSection).getByText(/09:00/)).toBeInTheDocument();

      const reportBtn = screen.getByRole('button', { name: /report disruption/i });
      fireEvent.click(reportBtn);

      const delayInput = screen.getByLabelText(/how many minutes are you delayed/i);
      fireEvent.change(delayInput, { target: { value: '60' } });

      const submitBtn = screen.getByRole('button', { name: /generate recovery proposal/i });
      fireEvent.click(submitBtn);

      // Click Keep Current Plan (Reject)
      const rejectBtn = screen.getByRole('button', { name: /keep current plan \(reject\)/i });
      fireEvent.click(rejectBtn);

      // Confirmation banner appears
      expect(screen.getByText(/proposed revision rejected/i)).toBeInTheDocument();

      // Original schedule remains at 09:00
      expect(within(scheduleSection).getByText(/09:00/)).toBeInTheDocument();
    });

    it('conversational suggestion chip triggers recovery proposal directly in chat', () => {
      render(<App />);

      // Click suggestion chip "I'm running 30m late"
      const suggestionBtn = screen.getByRole('button', { name: /i'm running 30m late/i });
      fireEvent.click(suggestionBtn);

      // Proposal review panel is visible
      expect(screen.getByRole('heading', { name: /proposed schedule recovery plan/i })).toBeInTheDocument();
      expect(screen.getByText(/General Delay: \+30 minutes/i)).toBeInTheDocument();

      // Assistant chat stream records the response
      expect(screen.getByText(/adjusting for your/i)).toBeInTheDocument();
    });

    it('supports task taking longer disruption event via modal', () => {
      render(<App />);

      const reportBtn = screen.getByRole('button', { name: /report disruption/i });
      fireEvent.click(reportBtn);

      // Click tab "Task Taking Longer"
      const tab = screen.getByRole('tab', { name: /task taking longer/i });
      fireEvent.click(tab);

      // Additional minutes
      const addMinsInput = screen.getByLabelText(/additional minutes needed/i);
      fireEvent.change(addMinsInput, { target: { value: '60' } });

      const submitBtn = screen.getByRole('button', { name: /generate recovery proposal/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Task Extended: \+60 minutes/i)).toBeInTheDocument();
    });

    it('interacts via conversational assistant: answers next action query', () => {
      render(<App />);

      const chatInput = screen.getByLabelText(/message to deadline rescue assistant/i);
      const sendBtn = screen.getByRole('button', { name: /send message/i });

      fireEvent.change(chatInput, { target: { value: 'What should I work on next?' } });
      fireEvent.click(sendBtn);

      const messageStream = screen.getByRole('log', { name: /conversation with deadline rescue assistant/i });

      // User message rendered in stream
      expect(within(messageStream).getByText('What should I work on next?')).toBeInTheDocument();

      // Assistant replies with next scheduled task
      expect(within(messageStream).getByText(/Your next scheduled task is/i)).toBeInTheDocument();
      expect(within(messageStream).getByText(/Algorithms Problem Set/i)).toBeInTheDocument();
    });

    it('interacts via conversational assistant: explains unscheduled task', () => {
      render(<App />);

      const chatInput = screen.getByLabelText(/message to deadline rescue assistant/i);
      const sendBtn = screen.getByRole('button', { name: /send message/i });

      fireEvent.change(chatInput, { target: { value: "Why didn't calculus fit?" } });
      fireEvent.click(sendBtn);

      const messageStream = screen.getByRole('log', { name: /conversation with deadline rescue assistant/i });
      expect(within(messageStream).getByText(/Calculus Midterm Review/i)).toBeInTheDocument();
      expect(within(messageStream).getByText(/couldn't be scheduled/i)).toBeInTheDocument();
    });

    it('handles conversational proposal generation and approval via chat commands', () => {
      render(<App />);

      const chatInput = screen.getByLabelText(/message to deadline rescue assistant/i);
      const sendBtn = screen.getByRole('button', { name: /send message/i });

      // 1. Report delay via text
      fireEvent.change(chatInput, { target: { value: "I'm running 30 minutes late" } });
      fireEvent.click(sendBtn);

      expect(screen.getByRole('heading', { name: /proposed schedule recovery plan/i })).toBeInTheDocument();

      // 2. Approve via chat text
      fireEvent.change(chatInput, { target: { value: 'Approve the revised plan' } });
      fireEvent.click(sendBtn);

      // Revised plan approved and applied
      expect(screen.getAllByText(/Revised recovery plan approved/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByRole('heading', { name: /proposed schedule recovery plan/i })).not.toBeInTheDocument();
    });

    it('handles proposal rejection via chat command', () => {
      render(<App />);

      const chatInput = screen.getByLabelText(/message to deadline rescue assistant/i);
      const sendBtn = screen.getByRole('button', { name: /send message/i });

      // 1. Report delay via text
      fireEvent.change(chatInput, { target: { value: "I'm running 30 minutes late" } });
      fireEvent.click(sendBtn);

      expect(screen.getByRole('heading', { name: /proposed schedule recovery plan/i })).toBeInTheDocument();

      // 2. Reject via chat text
      fireEvent.change(chatInput, { target: { value: 'Keep my current plan' } });
      fireEvent.click(sendBtn);

      // Proposal dismissed and current schedule preserved
      expect(screen.getAllByText(/Proposed revision rejected/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByRole('heading', { name: /proposed schedule recovery plan/i })).not.toBeInTheDocument();
    });

    it('closes disruption modal on Escape key press and backdrop click', () => {
      render(<App />);

      const reportBtn = screen.getByRole('button', { name: /report disruption/i });
      fireEvent.click(reportBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Open again and test backdrop click
      fireEvent.click(reportBtn);
      const openDialog = screen.getByRole('dialog');
      fireEvent.click(openDialog); // Click on backdrop overlay
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles impossible schedule without crashing and maintains unscheduled explanations', () => {
      render(<App />);

      // Add a task with duration 600 minutes (10 hours) which exceeds all remaining capacity
      const titleInput = screen.getByLabelText(/task title/i);
      const durationInput = screen.getByLabelText(/estimated duration/i);
      const addBtn = screen.getByRole('button', { name: /add task/i });

      fireEvent.change(titleInput, { target: { value: 'Mega Hackathon Final Polish' } });
      fireEvent.change(durationInput, { target: { value: '600' } });
      fireEvent.click(addBtn);

      // Verify task list has it
      const taskList = screen.getByRole('region', { name: /your tasks/i });
      expect(within(taskList).getByText(/Mega Hackathon Final Polish/i)).toBeInTheDocument();

      // Feasibility reports severe deficit
      expect(screen.getByText(/Capacity Deficit/i)).toBeInTheDocument();

      // Timeline lists it as unscheduled with explicit explanation
      const scheduleSection = screen.getByRole('region', { name: /your schedule/i });
      expect(within(scheduleSection).getByText(/Unscheduled Work \(2\)/i)).toBeInTheDocument();
      expect(within(scheduleSection).getByText(/Mega Hackathon Final Polish/i)).toBeInTheDocument();
    });

    it('displays the simulated Alexa+ experience disclosure clearly', () => {
      render(<App />);

      expect(screen.getByText(/Alexa\+ Simulated Experience • Local/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Alexa\+ simulated experience — running locally in this demo/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Alexa\+ assistant integration runs as a simulated track experience/i),
      ).toBeInTheDocument();
    });
  });
});
