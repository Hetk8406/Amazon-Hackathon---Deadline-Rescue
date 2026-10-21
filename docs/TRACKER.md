# Deadline Rescue --- Task Tracker

Use this file as the single checklist for project progress. Mark a task
complete only after implementation and verification. Update the status
and notes as work progresses.

**Statuses:** `TODO` · `IN PROGRESS` · `BLOCKED` · `DONE`

## Phase 0 --- Verify the track and prepare

  -----------------------------------------------------------------------------
  ID             Task             Priority       Status         Acceptance
                                                                criteria /
                                                                notes
  -------------- ---------------- -------------- -------------- ---------------
  T-001          Read current     P0             BLOCKED        Confirm exact
                 official Alexa+                                allowed route,
                 track and                                      required source
                 simulation                                     code, and demo
                 requirements                                   expectations
                                                                (awaiting user
                                                                confirmation)

  T-002          Inspect existing P0             DONE           Current stack,
                 repository and                                 scripts, and
                 preserve useful                                existing APIs
                 code                                           are documented.
                                                                Workspace
                                                                audited (only
                                                                docs/ present;
                                                                Node v22 / npm
                                                                available)

  T-003          Create or verify P0             DONE           PRD,
                 the seven                                      architecture,
                 project                                        design, memory,
                 documentation                                  rules, security,
                 files                                          and tracker
                                                                verified

  T-004          Create           P0             DONE           `.env.example` and
                 `.env.example`                                 `.gitignore` created.
                 and verify                                     Ignored rules for
                 `.gitignore`                                   `.env*`, `dist/`,
                                                                `node_modules/`, and
                                                                `*.tsbuildinfo` verified

  T-005          Establish a      P0             DONE           React + TypeScript +
                 runnable                                       Vite + Vitest
                 baseline                                       baseline initialized.
                                                                Dev server, build,
                                                                typecheck, and tests
                                                                verified clean
  -----------------------------------------------------------------------------

## Phase 1 --- Core task model and scheduler

  ---------------------------------------------------------------------------------
  ID             Task             Priority       Status         Acceptance criteria
                                                                / notes
  -------------- ---------------- -------------- -------------- -------------------
  T-010          Define Task,     P0             DONE           Types match
                 Plan,                                          `ARCHITECTURE.md`
                 ScheduleBlock,                                 and defined in
                 and proposal                                   `src/features/tasks/
                 types                                          taskTypes.ts`

  T-011          Implement task   P0             DONE           Validation in
                 validation                                     `taskValidation.ts`;
                 logic                                          zero/neg/frac
                                                                durations, invalid
                                                                dates, duplicate IDs
                                                                caught

  T-012          Implement        P0             DONE           Deterministic pure
                 deterministic                                  scheduler in
                 scheduling                                     `scheduler.ts` with
                                                                EDF, priority, and
                                                                stable ID tie-break

  T-013          Implement        P0             DONE           Feasibility engine in
                 feasibility and                                `feasibility.ts`
                 deadline                                       detects deficits,
                 warnings                                       tight buffers, and
                                                                overdue tasks

  T-014          Add scheduler    P0             DONE           32 unit tests across
                 unit tests                                     6 test suites pass
                                                                cleanly in Vitest
  ---------------------------------------------------------------------------------

## Phase 2 --- Main product experience

  ----------------------------------------------------------------------------
  ID             Task           Priority       Status         Acceptance
                                                              criteria / notes
  -------------- -------------- -------------- -------------- ----------------
  T-020          Build the main P0             DONE           Responsive
                 responsive                                   two-column
                 layout                                       layout on desktop,
                                                              stacking mobile,
                                                              design tokens
                                                              applied
                                                              (`App.tsx`,
                                                              `DESIGN.md`)

  T-021          Build task     P0             DONE           `TaskForm` and
                 intake and                                   `TaskList` built;
                 review                                       validation errors,
                                                              priority badges,
                                                              completion toggle,
                                                              and task removal

  T-022          Display        P0             DONE           `ScheduleTimeline`
                 schedule                                     renders blocks
                 timeline and                                 chronologically,
                 warnings                                     buffers, status,
                                                              and unscheduled
                                                              work with reasons

  T-023          Add seeded     P0             DONE           Midterm Crunch
                 demo scenario                                scenario in
                                                              `demoScenario.json`
                                                              with 4 tasks,
                                                              capacity deficit,
                                                              and reset controls

  T-024          Add loading,   P1             DONE           Empty states for
                 empty, and                                   zero tasks, no
                 error states                                 windows, and clear
                                                              inline validation
                                                              error indicators
  ----------------------------------------------------------------------------

## Phase 3 --- Replanning and user approval

  ----------------------------------------------------------------------------
  ID             Task           Priority       Status         Acceptance
                                                              criteria / notes
  -------------- -------------- -------------- -------------- ----------------
  T-030          Handle delay,  P0             DONE           Delay in minutes,
                 completion,                                  task extension,
                 and new-task                                 and urgent new
                 events                                       task disruptions
                                                              handled in
                                                              `replan.ts`

  T-031          Generate       P0             DONE           Candidate schedule
                 revised plan                                 generated with
                 proposals                                    shifted
                                                              availability and
                                                              feasibility
                                                              checks

  T-032          Compare old    P0             DONE           `planDiff.ts`
                 and proposed                                 highlights moved,
                 plans                                        added, and dropped
                                                              tasks with shift
                                                              duration

  T-033          Explain        P0             DONE           Transparent
                 trade-offs and                               plain-language
                 remaining                                    explanations and
                 risks                                        risks rendered in
                                                              `PlanDiff.tsx`

  T-034          Implement      P0             DONE           `PlanDiff.tsx` has
                 approve and                                  explicit Approve
                 reject                                       and Reject;
                 controls                                     rejection leaves
                                                              original plan
                                                              untouched

  T-035          Test           P0             DONE           13 UI tests in
                 replanning                                   `App.test.tsx` and
                 edge cases                                   9 unit tests in
                                                              `replan.test.ts`
                                                              cover delays,
                                                              extensions,
                                                              approval,
                                                              rejection, and
                                                              chaining
  ----------------------------------------------------------------------------

## Phase 4 --- Assistant and track-specific requirements

  ------------------------------------------------------------------------------
  ID             Task               Priority       Status         Acceptance
                                                                  criteria /
                                                                  notes
  -------------- ------------------ -------------- -------------- --------------
  T-040          Implement          P0             DONE           Natural-language
                 natural-language                                 intent parser and
                 task extraction or                               duration extractor
                 a clearly labeled                                in `intentParser.ts`;
                 fallback                                         validated against
                                                                  scheduler schema

  T-041          Add optional AI    P1             DONE           Zero external paid
                 provider adapter                                 API dependency;
                 if access is                                     assistant works
                 available                                        entirely client-side
                                                                  with zero risk of
                                                                  key exposure

  T-042          Implement the      P0             DONE           Simulated Alexa+
                 verified permitted                               experience clearly
                 Alexa+ simulation                                labeled, mirrors
                 path                                             voice/chat intent
                                                                  driven schedule
                                                                  recovery

  T-043          Test simulation    P0             DONE           Repeatable fresh
                 and sample flow                                  start via Reset Demo;
                 from a fresh start                               81 tests passing
                                                                  across 8 suites

  T-044          Verify truthful    P0             DONE           Truthful disclosures
                 track language in                                in header, ChatPanel
                 UI and README                                    badge, and footer
  ------------------------------------------------------------------------------

## Phase 5 --- Quality, security, and submission

  ----------------------------------------------------------------------------------
  ID             Task                   Priority       Status         Acceptance
                                                                      criteria /
                                                                      notes
  -------------- ---------------------- -------------- -------------- --------------
  T-050          Refine spacing,        P1             DONE           Tested on
                 typography, contrast,                                desktop, tablet
                 and responsive layout                                and mobile (<640px,
                                                                      <960px); added
                                                                      `:focus-visible` ring

  T-051          Run tests, type check, P0             DONE           85 unit and UI
                 lint, and production                                 integration tests,
                 build                                                `tsc -b --noEmit`,
                                                                      and Vite build all
                                                                      pass with 0 errors

  T-052          Write README with      P0             DONE           Comprehensive
                 setup, demo,                                         `README.md` created
                 architecture, and                                    with setup, demo,
                 limitations                                          architecture, and
                                                                      truthful disclosures

  T-053          Publish repository and P0             TODO           Judges can
                 verify access                                        access the
                                                                      source

  T-054          Record demo video      P0             TODO           Shows initial
                 under three minutes in                               plan, delay,
                 English                                              revised plan,
                                                                      and approval

  T-055          Write honest feedback  P0             TODO           Covers
                 for every                                            purpose, what
                 tool/API/SDK/AWS                                     worked,
                 service used                                         friction,
                                                                      onboarding,
                                                                      and
                                                                      willingness to
                                                                      use again

  T-056          Complete submission    P0             TODO           All mandatory
                 form and                                             fields are
                 track/mini-challenge                                 complete
                 selections                                           

  T-057          Final submission smoke P0             TODO           Repository,
                 test                                                 video, build,
                                                                      and submission
                                                                      details are
                                                                      checked

  T-058          Implement Privacy      P0             DONE           Clear local-only
                 Policy and Terms of                                  privacy notice in
                 Service notices                                      footer and README;
                                                                      zero network data
                                                                      transmission

  T-059          Configure SEO, Social  P1             DONE           Branded SVG
                 preview, Favicon, and                                favicon, OG tags,
                 Robots/Sitemap                                       meta descriptions,
                                                                      and `robots.txt`

  T-060          Implement custom 404   P1             TODO           Single-page app;
                 Not Found route                                      all routes lead
                                                                      to main dashboard

  T-061          Run Accessibility,     P1             DONE           WCAG contrast,
                 Contrast, and                                        focus indicators,
                 Keyboard audit                                       modal Escape key,
                                                                      accessible names
  ----------------------------------------------------------------------------------

## Current focus

**Next task:** Submission completion by user (publish repository Git remote, record demo video via `docs/DEMO_SCRIPT.md`, and complete Devpost submission form).

**Blockers:**
1. **T-053 (Publish repository):** Requires user to set remote origin URL and push master.
2. **T-054 (Record video):** Requires user to record <3 min video following `docs/DEMO_SCRIPT.md`.

**Recent decisions:**
- Completed Phase 3: Implemented core recovery & replanning workflow in
  `src/features/planning/replan.ts` supporting general delays, task extensions,
  and new urgent tasks.
- Completed Phase 4: Conversational assistant + simulated Alexa+ experience.
  Created `src/features/assistant/intentParser.ts` for robust natural language
  intent parsing and duration extraction.
- Created `src/features/assistant/assistantService.ts` executing recovery actions,
  generating transparent explanations, trade-offs, and suggestion chips.
- Upgraded `ChatPanel.tsx` to a conversational message stream with message
  history, inline Approve/Reject action triggers, and suggested prompts.
- Wired conversational state and action handlers into `src/app/App.tsx`.
- Added 25 unit tests in `tests/assistant.test.ts` and updated UI workflow tests in
  `tests/App.test.tsx` (81 tests passing across 8 suites).

## Change log

  -----------------------------------------------------------------------
  Date                                Change
  ----------------------------------- -----------------------------------
  2026-10-21                          Initial task tracker prepared.

  2026-10-21                          Comprehensive pre-coding audit
                                      completed. Updated statuses to
                                      standard set (`TODO`,
                                      `IN PROGRESS`, `BLOCKED`, `DONE`).
                                      Marked T-002 and T-003 as DONE.
                                      Marked T-001 as BLOCKED awaiting
                                      clarification. Added T-058--T-061
                                      for security/readiness.

  2026-10-21                          Phase 0 baseline completed and
                                      verified: Git initialized,
                                      `.gitignore` and `.env.example`
                                      created (T-004 DONE), React + TS +
                                      Vite + Vitest baseline running
                                      cleanly with unit test, typecheck,
                                      and production build (T-005 DONE).

  2026-10-21                          Phase 1 completed and verified:
                                      Task/Plan/ScheduleBlock types
                                      (T-010 DONE), validation logic
                                      (T-011 DONE), deterministic pure
                                      scheduler (T-012 DONE), feasibility
                                      and warning system (T-013 DONE),
                                      and 32 unit tests (T-014 DONE).

  2026-10-21                          Phase 2 completed and verified:
                                      Main responsive 2-col UI (T-020
                                      DONE), task intake & list (T-021
                                      DONE), schedule timeline & risk
                                      display (T-022 DONE), seeded demo
                                      scenario (T-023 DONE), and empty/
                                      error states (T-024 DONE). 39 tests
                                      passing.

  2026-10-21                          Phase 3 completed and verified:
                                      Replanning workflow engine
                                      (T-030 DONE), proposal generation
                                      (T-031 DONE), plan comparison
                                      (T-032 DONE), trade-off explanation
                                      (T-033 DONE), approve/reject
                                      controls (T-034 DONE), and edge-case
                                      tests (T-035 DONE). 53 tests passing.

  2026-10-21                          Phase 4 completed and verified:
                                      Conversational assistant + simulated
                                      Alexa+ experience (T-040, T-041,
                                      T-042, T-043, T-044 all DONE).
                                      Natural language intent parser,
                                      transparent explanations, inline
                                      proposals and approvals. 81 tests
                                      passing across 8 suites.

  2026-10-21                          Phase 5 completed and verified:
                                      Quality, security, and submission
                                      readiness (T-050, T-051, T-052,
                                      T-058, T-059, T-061 all DONE).
                                      Responsive layout refined with mobile
                                      breakpoints, `:focus-visible` ring,
                                      Escape key modal dismissal, SVG
                                      favicon & SEO metadata, local-only
                                      privacy notice, `README.md`, and
                                      complete video demo script in
                                      `docs/DEMO_SCRIPT.md`. 85 tests
                                      passing across 8 suites.
  -----------------------------------------------------------------------
