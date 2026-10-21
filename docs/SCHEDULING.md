# Deadline Rescue --- Deterministic Scheduling Engine Specification

This document details the scheduling policy, input validation rules, feasibility checks, and determinism guarantees implemented in Phase 1.

## 1. Core Scheduling Policy

The scheduler (`src/features/planning/scheduler.ts`) is a pure, side-effect-free TypeScript function. It does not depend on React, browser APIs, network requests, an LLM, or the system clock.

### 1.1 Sorting & Prioritization Order
When scheduling pending tasks into chronological availability windows, tasks are ordered using the following strict hierarchy:
1. **Deadline Urgency (Earliest Deadline First / EDF):** Tasks with an explicit deadline are scheduled before tasks without deadlines. Between two tasks with deadlines, the earlier deadline is scheduled first.
2. **Priority Ranking:** If deadlines are identical or neither task has a deadline, higher priority tasks are scheduled first (`high` > `medium` > `low`).
3. **Deterministic Tie-Breaker:** If deadlines and priorities are equal, tasks are sorted alphabetically by their stable task ID (`a.id.localeCompare(b.id)`). This guarantees identical output regardless of the order tasks were supplied in the array.

### 1.2 Time Window & Contiguous Block Allocation
- **Window Normalization:** Raw availability windows are validated, sorted chronologically, and merged if overlapping or contiguous to provide disjoint chronological intervals.
- **Contiguous Placement (MVP Policy):** Each task is scheduled as a single, uninterrupted contiguous block within the earliest availability window that has sufficient consecutive minutes before the task's deadline. Tasks are not fragmented across discontinuous intervals.
- **Strict Non-Overlapping:** Schedule blocks never overlap. When a task is placed, its duration is deducted from the availability slot.
- **Strict Deadline Enforcement:** Work is **never** scheduled to complete after its deadline. If placing a task in a slot would cause it to finish after its deadline, that slot is rejected.

### 1.3 Unscheduled Tasks & Structured Issues
Tasks that cannot be placed are never silently dropped. They are returned in `Plan.unscheduledTasks` with explicit codes:
- `TASK_OVERDUE`: The task's deadline is already earlier than the scheduling reference time.
- `DEADLINE_EXCEEDED`: Availability exists, but none of the windows before the deadline have enough time to finish the task.
- `INSUFFICIENT_TIME`: Total remaining available minutes across all windows are less than the task duration.
- `INSUFFICIENT_WINDOW_DURATION`: Total available time is sufficient in aggregate, but no single window is long enough for the task's contiguous duration.

### 1.4 Completed Tasks
Tasks with `completed: true` are treated as already finished and are excluded from future schedule blocks. They remain in `Plan.tasks` with an assumption note for auditability.

---

## 2. Input Validation Rules

Input validation (`src/features/tasks/taskValidation.ts`) runs before scheduling and returns structured errors without modifying values:
- **Title:** Must be a non-empty, non-whitespace string.
- **Duration (`estimatedMinutes`):** Must be a finite, positive integer (> 0). Fractional, negative, zero, NaN, and non-numeric values are rejected.
- **Priority:** Must be one of `'high' | 'medium' | 'low'`.
- **Deadline:** If present, must be a valid ISO 8601 date-time string.
- **Unique IDs:** Duplicate task IDs in the input array are rejected.
- **Availability Windows:** Each window must have valid ISO `start` and `end` timestamps, and `end` must be strictly after `start`.

---

## 3. Feasibility and Risk Analysis

The feasibility checker (`src/features/planning/feasibility.ts`) evaluates a generated plan:
- **Capacity Deficit:** Compares total non-completed task minutes against total available window minutes.
- **Imminent Deadlines:** Flags unscheduled tasks whose deadlines are within 3 hours of the reference start time.
- **Tight Buffers:** Flags scheduled tasks that complete within 15 minutes of their deadline.
- **Binary Feasibility:** A plan is marked `isFeasible: false` if any tasks are unscheduled, a net deficit exists, or an error-level risk is present.

---

## 4. Plan Comparison (`planDiff.ts`)

The plan diffing engine (`src/features/planning/planDiff.ts`) compares an existing accepted plan with a proposed revised plan:
- Matches schedule blocks by stable task ID.
- Identifies **added tasks**, **removed/unscheduled tasks**, and **moved tasks** (calculating exact shift in minutes).
- Generates transparent, human-readable trade-off statements (e.g. `"Physics Lab was moved later by 60m"`).

---

## 5. Limitations & Future Extensions

1. **Task Splitting:** The MVP intentionally uses contiguous task blocks to prevent fragmentation of student study sessions. Splitting long tasks across break windows can be added as a configurable option in a future phase.
2. **Fixed Time Constraints (Pinned Tasks):** Pinned tasks currently preserve completion state; pre-assigned fixed calendar start slots can be added when external calendar synchronization is implemented.
