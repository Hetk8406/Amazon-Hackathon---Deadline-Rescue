# Deadline Rescue --- Architecture

## 1. Architecture principles

-   Keep the MVP small, understandable, and easy to run locally.
-   Separate task interpretation, scheduling, and presentation.
-   Make the schedule engine deterministic and testable.
-   Treat AI as an optional language interface, not the source of truth
    for time calculations.
-   Keep the hackathon-specific simulation boundary explicit.
-   Avoid introducing a database or external service until a concrete
    requirement needs it.

## 2. Proposed tech stack

Use this as a starting point; confirm the existing repository before
replacing or adding frameworks.

-   **Frontend:** React + TypeScript + Vite.
-   **Styling:** CSS Modules or plain CSS with design tokens.
-   **Validation:** Zod or lightweight handwritten validation; choose
    one, not both without need.
-   **Scheduling logic:** pure TypeScript functions with unit tests.
-   **Persistence:** browser `localStorage` for MVP session data, with
    an in-memory fallback.
-   **AI provider:** optional server-side adapter for natural-language
    task extraction and explanations. Use only a provider that is
    available and configured.
-   **Backend:** optional small Node.js API if an AI provider key must
    be kept private or the simulation requires a server endpoint.
-   **Testing:** Vitest for core logic; Playwright only if time allows.
-   **Hosting:** any compatible static host for the frontend; deploy a
    backend only if one is required.
-   **Repository:** Git with a clear README and `.env.example`.

Do not describe this as an actual Alexa+ integration unless the required
official integration has been completed and verified. The
simulated-experience implementation must follow the current hackathon
rules.

## 3. Suggested folder structure

``` text
deadline-rescue/
├── public/
│   └── demo-scenario.json
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── ChatPanel.tsx
│   │   ├── TaskReview.tsx
│   │   ├── ScheduleTimeline.tsx
│   │   ├── PlanDiff.tsx
│   │   ├── TradeoffSummary.tsx
│   │   └── ApprovalBar.tsx
│   ├── features/
│   │   ├── tasks/
│   │   │   ├── taskTypes.ts
│   │   │   ├── taskValidation.ts
│   │   │   └── taskParser.ts
│   │   ├── planning/
│   │   │   ├── scheduler.ts
│   │   │   ├── feasibility.ts
│   │   │   ├── replan.ts
│   │   │   └── planDiff.ts
│   │   └── assistant/
│   │       ├── assistantService.ts
│   │       └── providerAdapter.ts
│   ├── lib/
│   │   ├── storage.ts
│   │   └── dateTime.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   └── global.css
│   └── main.tsx
├── tests/
│   ├── scheduler.test.ts
│   ├── feasibility.test.ts
│   └── replan.test.ts
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── PRD.md
├── ARCHITECTURE.md
├── DESIGN.md
├── MEMORY.md
├── RULES.md
└── TRACKER.md
```

Adapt to the repository's existing structure if one already exists. Do
not create empty layers or files just to match this tree.

## 4. Main domain models

``` ts
type Priority = "high" | "medium" | "low";

type Task = {
  id: string;
  title: string;
  estimatedMinutes: number;
  deadline?: string; // ISO date-time, with timezone assumptions documented
  priority: Priority;
  completed: boolean;
  pinned?: boolean;
};

type TimeWindow = {
  start: string; // ISO date-time
  end: string;   // ISO date-time
};

type ScheduleBlock = {
  taskId: string;
  start: string;
  end: string;
  status: "planned" | "completed" | "at-risk";
};

type Plan = {
  id: string;
  createdAt: string;
  tasks: Task[];
  blocks: ScheduleBlock[];
  warnings: string[];
  assumptions: string[];
};

type ReplanProposal = {
  previousPlanId: string;
  proposedPlan: Plan;
  changes: Array<{
    taskId: string;
    reason: string;
    oldStart?: string;
    newStart?: string;
  }>;
  tradeoffs: string[];
};
```

## 5. Data storage

### MVP

-   Store current task list and accepted plan in browser local storage.
-   Keep temporary proposed plans in application state until approved.
-   Use seeded demo data for the presentation.
-   Do not store API keys in browser storage or client-side environment
    variables.

### Database

No database is required for the first version. Add a database only if a
confirmed requirement needs server-side accounts, shared plans, or
durable multi-device data. If a database is added, document its schema,
access controls, retention, and migration process before using it.

## 6. API and data flow

### Task intake

1.  User enters natural-language text or structured task details.
2.  `taskParser` converts the input to candidate task objects. The
    parser may use an optional AI adapter.
3.  `taskValidation` checks required fields, valid durations, date
    formats, and ambiguous values.
4.  UI asks the user to confirm extracted values before scheduling.

### Planning

1.  Confirmed tasks and available time go to `scheduler`.
2.  `feasibility` checks workload, time windows, and deadline conflicts.
3.  Scheduler returns a deterministic `Plan`.
4.  UI renders timeline, warnings, assumptions, and unplaced tasks.

### Replanning

1.  User reports a delay, completion, or new task.
2.  `replan` updates the candidate task state.
3.  Scheduler creates a new proposal.
4.  `planDiff` compares the current plan and proposal.
5.  UI explains the trade-offs.
6.  User approves or rejects the proposal.
7.  Only approval updates the accepted plan.

### Optional AI API

If an AI provider is used, call it from a server-side endpoint. Send
only the minimum task information needed. Validate its structured output
before passing it to the scheduler. Do not let the model directly decide
final time blocks or execute actions.

## 7. Alexa+ simulation boundary

-   Confirm the current hackathon's permitted simulated-experience
    specification before implementation.
-   Keep the simulated assistant entry point and source code in the
    repository.
-   Clearly label simulated components in code comments and
    documentation.
-   Do not use private, restricted, or undocumented endpoints.
-   Do not claim that Alexa+ itself invoked the service unless that has
    been genuinely demonstrated.
-   If the official requirements demand a specific protocol or artifact
    for the chosen route, implement and test that requirement before
    polishing the product.

## 8. Error handling and observability

-   Validate user input at the boundary.
-   Return friendly errors for malformed tasks and unavailable AI
    providers.
-   Provide a deterministic sample mode if the AI provider fails.
-   Log technical errors in development without logging unnecessary
    personal task content.
-   Show explicit warnings when a schedule is infeasible.

## 9. Test strategy

-   Unit-test scheduling, feasibility, and plan diff functions.
-   Test no tasks, one task, equal deadlines, overdue tasks,
    insufficient hours, pinned tasks, completed tasks, and delays that
    exceed the available day.
-   Test that rejecting a proposal does not modify the accepted plan.
-   Run a fresh-install smoke test before the demo.
