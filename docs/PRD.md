# Deadline Rescue --- Product Requirements Document

**Product:** Deadline Rescue\
**Primary hackathon track:** Alexa+ (simulated-experience route, subject
to verification against current official rules)\
**Status:** MVP specification\
**Product type:** Conversational deadline and schedule recovery
assistant

## 1. Product summary

Deadline Rescue helps students and other deadline-heavy users recover
when their plans become unrealistic. Users describe tasks, deadlines,
durations, and available time in natural language. The system turns that
input into structured tasks, creates a feasible schedule, identifies
conflicts, and proposes revisions when circumstances change.

The core differentiator is not simply generating a plan. It is
**explaining and negotiating trade-offs when a plan breaks**, while
keeping the user in control.

## 2. Problem statement

People often plan around optimistic estimates. When one task takes
longer than expected, the rest of the schedule can become infeasible.
Generic chat responses may offer advice but often fail to maintain a
consistent, inspectable task plan or clearly show what changed.

Deadline Rescue should provide: - A structured view of tasks, durations,
priorities, and deadlines. - A schedule that respects the user's
available time. - Clear warnings when the work cannot fit. - Alternative
recovery plans with transparent trade-offs. - User approval before
replacing an existing plan.

## 3. Target users

### Primary

-   University and college students managing assignments, exams, labs,
    and projects.
-   Students who have limited study time and overlapping deadlines.

### Secondary

-   Solo professionals managing several time-sensitive tasks.
-   Anyone who needs help rescheduling work after an unexpected delay.

### Not a target for the MVP

-   Enterprise project management teams.
-   Users who need a fully integrated calendar, email, or
    learning-management system.
-   Users expecting autonomous actions without review or approval.

## 4. Goals

1.  Let a user turn a natural-language request into a structured task
    list.
2.  Generate a practical schedule based on deadlines, durations,
    priorities, and available time.
3.  Replan after a delay or new task.
4.  Explain the changes in plain language.
5.  Make the track-specific simulated assistant workflow clear and
    demonstrable.
6.  Ship a reliable, documented MVP within a short solo-development
    window.

## 5. Non-goals

-   Real Alexa+ device integration unless access and authorization are
    available.
-   Claiming that the app is officially connected to Alexa+ when it is
    running as a simulation.
-   Voice wake-word support or speech synthesis.
-   User accounts, payments, collaboration, notifications, or
    multi-device sync.
-   External calendar integrations in the MVP.
-   Medical, mental-health, or guaranteed productivity advice.

## 6. MVP features

### P0 --- Required

-   **Task intake:** accept natural language and/or a simple structured
    form.
-   **Task review:** show extracted title, duration, deadline, priority,
    and completion state for confirmation.
-   **Schedule generation:** produce a time-block plan using a
    deterministic scheduling function.
-   **Feasibility checks:** detect insufficient available time, overdue
    tasks, missing estimates, and conflicting deadlines.
-   **Adaptive replanning:** let a user report a delay, mark a task
    complete, or add a task; calculate a revised schedule.
-   **Plan comparison:** show the previous plan and proposed plan, with
    moved tasks clearly identified.
-   **Trade-off explanation:** explain what changed, why it changed, and
    which deadline remains at risk.
-   **Approval control:** apply or reject a proposed plan.
-   **Demo scenario:** include a preloaded example so judges can test
    the key flow quickly.
-   **Error and empty states:** provide helpful feedback for invalid or
    incomplete input.

### P1 --- If time permits

-   Offer two alternative plans, such as "protect earliest deadline" and
    "balance workload."
-   Export a plan as plain text or download a simple file.
-   Persist the current session locally.
-   Add a small feedback control for whether a proposed plan was useful.

### Explicitly excluded until P0 is stable

-   Authentication, multi-user data, complex database setup, mobile app,
    calendar sync, and unrelated dashboards.

## 7. Core user journey

1.  User opens the app and sees a concise explanation and a sample
    scenario.
2.  User enters tasks and available hours in plain language or
    structured fields.
3.  The app extracts the tasks and asks the user to review uncertain
    fields.
4.  User confirms the task list.
5.  The scheduler generates a plan and reports feasibility.
6.  User reports a change, such as "Task A is taking two hours longer."
7.  The app produces a proposed revision and a change summary.
8.  User reviews the trade-offs and approves or rejects the revision.
9.  The app displays the final plan and a short explanation.

## 8. Functional requirements

-   FR-01: The app must accept task data with title, estimated duration,
    deadline (if known), and priority.
-   FR-02: The app must validate durations and dates before scheduling.
-   FR-03: The scheduling logic must be deterministic for the same
    input.
-   FR-04: The app must not silently discard tasks that cannot fit.
-   FR-05: The app must explicitly identify infeasible schedules and
    unmet deadlines.
-   FR-06: Replanning must preserve completed tasks and user-pinned
    commitments unless the user changes them.
-   FR-07: A proposed plan must not replace the current plan until
    approved.
-   FR-08: The app must show which task blocks changed between plans.
-   FR-09: The assistant must distinguish known facts from assumptions
    or estimates.
-   FR-10: A built-in sample scenario must demonstrate the main workflow
    without requiring a user API key.

## 9. Non-functional requirements

-   Usable on current desktop browsers and reasonably responsive on
    mobile-sized screens.
-   Clear keyboard focus and readable contrast.
-   Core scheduling must work without an external AI provider.
-   No secrets committed to source control.
-   Errors should be actionable and not expose stack traces to end
    users.
-   README must describe setup, configuration, limitations, and the
    simulated nature of the track experience.
-   A fresh clone should be runnable using documented steps.

## 10. Success criteria for the MVP

-   A new user can complete the sample workflow in under two minutes.
-   The same test input produces the same schedule.
-   The app detects at least one intentionally infeasible scenario.
-   A delay produces a visible revised plan and an explanation.
-   A rejected proposal leaves the original plan intact.
-   The primary demo works from a fresh start without requiring secret
    credentials.
-   The repository and demo accurately describe which components are
    simulated and which are real.

## 11. Hackathon demo narrative

1.  Start with three tasks and a limited amount of available time.
2.  Generate the initial plan.
3.  Introduce a two-hour delay.
4.  Show the original and proposed schedules side by side.
5.  Highlight the trade-off and any deadline that remains at risk.
6.  Reject or approve the proposal to demonstrate user control.
7.  Briefly explain the Alexa+ simulation approach and repository
    contents.

## 12. Risks and mitigations

-   **Track-compliance risk:** verify official Alexa+ simulation
    requirements before implementation; do not imply an official Alexa+
    connection if none exists.
-   **AI availability risk:** keep task scheduling deterministic and
    provide a sample scenario.
-   **Scope risk:** finish the P0 workflow before visual polish or
    mini-challenge work.
-   **Scheduling correctness risk:** test edge cases and clearly
    communicate infeasibility.
-   **Demo risk:** use seeded data and rehearse the complete flow before
    recording.
