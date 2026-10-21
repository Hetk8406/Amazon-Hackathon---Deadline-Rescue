# Deadline Rescue --- Development Rules

These rules apply to all code-generation and manual changes.

## 1. Scope and workflow

1.  Read `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `MEMORY.md`, and
    `TRACKER.md` before starting a new task.
2.  Inspect the current repository before changing files. Do not assume
    the project is empty.
3.  Implement one small, coherent task at a time.
4.  Finish and test the core workflow before adding optional features.
5.  Update `TRACKER.md` after completing or blocking a task.
6.  Update documentation when a technical or product decision changes.

## 2. Keep dependencies under control

-   Do not add a dependency for a feature that can be implemented simply
    with existing tools.
-   Before adding a package, explain why it is needed and check whether
    the current stack already covers the use case.
-   Avoid duplicate libraries that solve the same problem.
-   Do not add a database, state-management framework, UI framework, or
    animation library without a concrete need.
-   Keep the install and build process straightforward.

## 3. Preserve existing behavior

-   Do not break existing APIs, types, routes, or component contracts
    without checking every caller.
-   Prefer backward-compatible changes.
-   If an API or data shape must change, update all consumers and tests
    in the same task.
-   Do not replace working code wholesale just to match a preferred
    style.
-   Do not delete user work or configuration unless explicitly required.

## 4. Code quality

-   Use clear, descriptive names.
-   Keep functions focused and small.
-   Keep scheduling and feasibility logic independent from UI
    components.
-   Use TypeScript types for task and plan data.
-   Validate external, user-entered, and AI-generated data at
    boundaries.
-   Avoid `any` unless there is a clear, documented reason.
-   Do not duplicate scheduling logic across components.
-   Do not use an LLM as the final authority for time arithmetic or
    deadline feasibility.

## 5. Security and privacy

-   Never commit API keys, tokens, credentials, or private environment
    files.
-   Keep provider secrets on the server if a backend is used.
-   Provide `.env.example` with placeholder names only.
-   Do not log unnecessary user task details.
-   Do not use private or undocumented Amazon endpoints.
-   Clearly distinguish the simulated experience from an actual Amazon
    service integration.

## 6. Testing after every change

After each meaningful change: 1. Run the relevant unit tests. 2. Run
type checking and linting if configured. 3. Run the build for changes
that can affect compilation. 4. Open the app and test the affected
interaction. 5. Fix regressions before moving to the next task. 6.
Record the result in `TRACKER.md`.

At minimum, test: - Empty task list. - Invalid duration or date. -
Normal feasible plan. - Infeasible workload. - Overdue task. - Delayed
task that causes a conflict. - Completed or pinned task during
replanning. - Rejecting a proposal without changing the accepted plan. -
AI provider failure or missing API key. - Fresh start using the demo
scenario.

## 7. UX rules

-   Never silently drop an unscheduled task.
-   Never label an infeasible schedule as successful.
-   Explain warnings in plain language.
-   A proposed plan must require explicit approval before replacing the
    accepted plan.
-   Keep loading, empty, error, and success states intentional.
-   Make keyboard focus visible and controls accessible.
-   Avoid unnecessary animation and decorative gradients.

## 8. Hackathon submission rules

-   Verify the current official track and simulation requirements before
    implementation.
-   Include the source code required for the chosen simulation route.
-   Do not claim a real Alexa+ connection unless verified.
-   Keep the public repository and demo video accessible.
-   Keep the video under three minutes and in English.
-   Provide honest feedback for every Amazon tool, API, SDK, and AWS
    service actually used.
-   Complete required mini-challenge fields only if entering those
    challenges.
-   Do not fabricate test results, integrations, customer outcomes, or
    product feedback.

## 9. Definition of done

A task is complete only when: - The requested behavior works. - Relevant
tests pass. - Existing behavior remains intact. - Error states are
handled. - The documentation and tracker are updated where needed. - No
secrets or unrelated generated files are committed.
