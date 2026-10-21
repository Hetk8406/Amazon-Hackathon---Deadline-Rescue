# Deadline Rescue --- Project Memory and Explanation Guide

This file preserves the product's intent and key decisions for future
development sessions. Read it before changing the architecture, UX, or
scope.

## 1. One-sentence explanation

**Deadline Rescue is a conversational deadline-recovery assistant that
helps users turn tasks into a feasible schedule, then explains and
proposes changes when the plan breaks.**

## 2. The problem it solves

A schedule can become unrealistic when tasks take longer than expected
or new commitments appear. The product helps users understand what can
still fit, what must move, and which deadlines remain at risk.

## 3. Core differentiator

Do not reduce the product to "an AI that makes study plans." Its main
feature is **transparent replanning with user approval**: - Detect the
conflict. - Generate a revised plan. - Show exactly what changed. -
Explain trade-offs and remaining risks. - Let the user approve or reject
the proposal.

## 4. Target users

The primary audience is university and college students juggling
assignments, exams, labs, and projects. Secondary users include
individuals managing several deadlines. Keep the language and demo
grounded in realistic student situations.

## 5. Track positioning

The intended primary track is Alexa+, using the hackathon's
simulated-experience route if it is permitted and can be demonstrated
with available tools. The project is not to be described as a real
Alexa+ device integration unless that integration has genuinely been
completed and verified.

Before coding track-specific behavior, check the current official rules
and requirements. Do not rely on assumptions about restricted tools,
private APIs, or undocumented endpoints.

## 6. Product principles

1.  **Feasibility over optimism:** never hide work that cannot fit.
2.  **User control:** a proposed plan does not replace the accepted plan
    until approved.
3.  **Explainability:** every meaningful change has a reason.
4.  **Determinism:** scheduling logic is predictable and testable.
5.  **Honest simulation:** clearly disclose what is simulated.
6.  **Small scope:** complete the main workflow before adding extras.
7.  **Graceful fallback:** the sample scenario and core planner should
    work without an AI API key.

## 7. Key decisions

-   Build a web-first MVP.
-   Keep scheduling logic separate from AI text generation.
-   Prefer local storage over a database for the initial version.
-   Do not add authentication or calendar integration to the MVP.
-   Use seeded data for a reliable hackathon demo.
-   Do not commit secrets.
-   Prefer a coherent, restrained interface over flashy effects.

If a later decision changes one of these points, update this file and
the related documentation.

## 8. Demo story

Start with three tasks and limited study time. Generate a schedule. Tell
the assistant that one task will take two hours longer. Show the
conflict, revised plan, moved tasks, and remaining deadline risk. Reject
the proposal to prove that the original plan stays intact, then approve
a second proposal to demonstrate the full workflow.

## 9. Vocabulary

-   **Task:** a unit of work with an estimate and optional deadline.
-   **Accepted plan:** the current plan approved by the user.
-   **Proposal:** a candidate revised plan awaiting approval.
-   **Feasibility warning:** a clear statement that available time is
    insufficient or a deadline cannot be met.
-   **Trade-off:** what must move, shrink, or remain at risk to make the
    revised plan work.
-   **Simulated experience:** a demonstration implementation that must
    follow the hackathon's permitted simulation requirements.

## 10. How to explain the project to a judge

"Deadline Rescue helps students recover when a plan becomes unrealistic.
Instead of generating another generic checklist, it recalculates the
schedule, shows what changed, explains the trade-offs, and lets the user
decide whether to apply the revision. The core scheduler is
deterministic, and the assistant is used for natural-language
interaction and explanations. The demo clearly identifies the permitted
simulated track experience."

Only describe technical integrations that are actually implemented.
