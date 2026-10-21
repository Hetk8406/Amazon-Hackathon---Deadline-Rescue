# Deadline Rescue — Hackathon Demo Script (< 3 Minutes)

> **Build, Ship, Shape: Amazon Developer Hackathon — Alexa+ Track**  
> *Track Simulation Disclosure:* This interface demonstrates a simulated Alexa+ voice assistant experience running locally in browser memory. All core scheduling calculations are pure and deterministic.

---

## 1. Overview & Setup (0:00 – 0:30)

### Visual Setup
1. Open the application at `http://localhost:5173`.
2. Click **"Reset Demo Scenario"** in the top header to ensure a fresh, predictable baseline.
3. Call attention to:
   - **Header:** "Deadline Rescue" with the "Amazon Hackathon • Alexa+ Track" badge.
   - **Left Column:** The **Conversational Assistant** with the disclosure badge: `Alexa+ Simulated Experience • Local`.
   - **Right Column:** **Plan Feasibility** showing *Conflicts Detected* and **Your Schedule** showing *3 Blocks Planned* and *Unscheduled Work (1)*.

### Voiceover / Talking Points
> *"Hi everyone, this is Deadline Rescue, an intelligent deadline recovery assistant built for the Amazon Developer Hackathon's Alexa+ track. When university students run behind schedule, typical calendar apps silently let deadlines fail. Deadline Rescue combines a deterministic Earliest-Deadline-First scheduling engine with a simulated Alexa+ conversational assistant to propose honest, feasible schedule recoveries without ever overwriting active plans without student approval."*

---

## 2. Querying Active State (0:30 – 1:05)

### Step 1: Check Next Task
- In the assistant composer, click the suggestion chip or type:
  ```text
  What should I work on next?
  ```
- **Expected Result:** The assistant immediately responds in the chat stream:
  > *"Your next scheduled task is **Algorithms Problem Set (Dynamic Programming)**, planned for **09:00 – 11:00** (2h, high priority) (deadline at 12:00, leaving a 1h buffer). Focus on completing this block first."*

### Step 2: Inquire Why a Task Did Not Fit
- Click the suggestion chip or type:
  ```text
  Why didn't calculus fit?
  ```
- **Expected Result:** The assistant explains honestly without hallucinating a fit:
  > *"**Calculus Midterm Review & Practice Exam** (2h 30m) couldn't be scheduled: Deadline exceeded: task finishes at 16:00, after deadline 15:00. Its deadline was 15:00."*
- Point out: *The engine never fakes a schedule. Real capacity deficits (-60m) are transparently reported.*

---

## 3. Disruption & Candidate Proposal (1:05 – 1:55)

### Step 3: Report a Real-World Delay
- Click the chip or type:
  ```text
  I'm running 30 minutes late
  ```
- **Expected Result:**
  1. The assistant responds:
     > *"I've calculated a revised schedule proposal adjusting for your **30-minute delay**. Your original schedule remains active until you review and approve the proposal..."*
  2. The **Proposed Schedule Recovery Plan** comparison card appears in the right column with a `Review Required` badge.
  3. Notice that **Your Schedule** below it *still shows the original 09:00 start*. Active work is protected from automated overwrites.

### Step 4: Inspect Proposed Trade-offs
- In the chat, type:
  ```text
  What changed in the revised plan?
  ```
- **Expected Result:**
  The assistant summarizes the time shifts:
  > *"• **Algorithms Problem Set**: Shifted forward by 30m (starts at 09:30)"*
  Along with any trade-offs and inline `[Approve Revised Plan]` / `[Keep Current Plan (Reject)]` buttons.

---

## 4. Decision & Schedule Application (1:55 – 2:35)

### Step 5: Approve the Recovery Plan
- Click **"Approve Revised Plan"** (either inline in the chat or on the proposal card), or type:
  ```text
  Approve the revised plan
  ```
- **Expected Result:**
  1. Confirmation banner appears: `✓ Revised recovery plan approved! Your schedule has been updated.`
  2. The proposal card dismisses.
  3. The active schedule timeline now starts at **09:30** for Algorithms Problem Set, with subsequent blocks adjusted deterministically.
  4. The assistant acknowledges the change with new suggested prompts.

---

## 5. Alternative / Fallback Demonstration (2:35 – 2:55)

### Step 6: Manual UI Fallback & Closing
- Click the **"🔄 Report Disruption"** button in the header.
- Demonstrate that if speech/conversational input is ambiguous, students can switch directly to structured modal reporting:
  - *Running Late (+15m, +30m, +60m, +120m)*
  - *Task Taking Longer*
  - *New Urgent Task*
- Press `Escape` or click outside to dismiss the modal cleanly.

### Closing Remarks
> *"Deadline Rescue gives students realistic, stress-reducing schedule recovery powered by pure math and transparent Alexa+ interaction. All source code, tests, and documentation are ready for review. Thank you!"*

---

## Quick Reference / Fallback Cheatsheet

| Query / Action | Expected Result | Fallback if Unrecognized |
| :--- | :--- | :--- |
| `"What should I work on next?"` | Explains current 1st block (Algorithms 09:00) | Click suggested chip |
| `"Why didn't calculus fit?"` | Explains deadline overrun at 16:00 vs 15:00 | Read reasons in Schedule panel |
| `"I'm running 30m late"` | Generates proposed plan (+30m shift) | Click "🔄 Report Disruption" |
| `"Approve the revised plan"` | Applies revision, shifts reference time to 09:30 | Click orange [Approve Revised Plan] button |
| `"Keep my current plan"` | Drops candidate proposal, keeps 09:00 schedule | Click grey [Keep Current Plan (Reject)] button |
| Press `Escape` | Closes disruption modal | Click close button ✕ |
