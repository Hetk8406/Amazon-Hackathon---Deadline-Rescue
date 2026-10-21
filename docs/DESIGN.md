# Deadline Rescue --- Design System

## 1. Design direction

Create a focused, calm, trustworthy productivity tool. The interface
should feel like a thoughtfully built developer product rather than a
generic AI-generated dashboard.

Use clear typography, compact cards, purposeful spacing, and a
restrained accent color. Avoid excessive gradients, glassmorphism,
oversized headings, decorative animations, and giant empty hero
sections.

## 2. Color tokens

Use CSS variables so colors can be adjusted consistently.

``` css
:root {
  --color-bg: #101214;
  --color-surface: #181c20;
  --color-surface-raised: #20262b;
  --color-border: #30383f;
  --color-text: #f3f5f6;
  --color-text-muted: #a7b0b8;
  --color-accent: #e8a23a;
  --color-accent-hover: #f0b657;
  --color-success: #55b889;
  --color-warning: #e8a23a;
  --color-danger: #e16b68;
  --color-focus: #8ab4f8;
}
```

Use the amber accent for the primary action, active timeline elements,
and selected items. Use semantic colors sparingly and never rely on
color alone to convey risk or success.

## 3. Typography

-   **Preferred font:** Inter, if available locally or loaded from a
    permitted source.
-   **Fallback:**
    `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
-   Use 14--16 px for primary body text.
-   Use 12--13 px for secondary labels only when still comfortably
    readable.
-   Use 20--24 px for section headings.
-   Use 28--36 px for the page title, depending on viewport.
-   Keep line length moderate for explanations.

Avoid loading multiple font families or weights. Use a small set of
weights: 400, 500, 600, and 700.

## 4. Layout

### Desktop

-   Main app header: product name, current plan status, and one primary
    action.
-   Left/main area: conversation and task input.
-   Right area: current schedule and plan summary.
-   Replan proposal: show as a clear comparison panel, not a hidden
    modal.
-   Keep content within a comfortable max width; use available space
    without spreading content edge to edge.

### Mobile

-   Stack conversation, task review, and schedule vertically.
-   Keep primary actions reachable.
-   Avoid horizontal scrolling for the schedule; use grouped time blocks
    or a compact agenda list.

### Recommended hierarchy

1.  Current situation and available time.
2.  Task list and schedule.
3.  Warnings and deadline risk.
4.  Proposed changes and rationale.
5.  Approve / reject controls.

## 5. Components and styling

### Buttons

-   Primary: amber background, dark text, medium weight, 8 px radius.
-   Secondary: transparent or surface background with a visible border.
-   Destructive: use danger styling only for destructive actions.
-   Disabled: visibly disabled and non-interactive.
-   Minimum interactive target: aim for 40--44 px height.

### Cards

-   Use a subtle surface contrast and 1 px border.
-   Use 10--14 px radius consistently.
-   Keep shadows subtle or omit them.
-   Avoid nesting multiple cards inside cards.

### Chat messages

-   Clearly distinguish user messages and assistant responses.
-   Keep assistant answers concise and scannable.
-   Put schedules, warnings, and plan options into structured UI rather
    than embedding everything in a long chat bubble.
-   Show loading, empty, and error states.

### Schedule timeline

-   Display time, task title, and duration.
-   Highlight moved tasks in the proposal view.
-   Show completed, at-risk, and unscheduled work with labels and icons.
-   Include a text alternative for screen readers.

### Plan comparison

-   Use "Current plan" and "Proposed plan" headings.
-   List moved tasks and their reasons.
-   State which deadlines remain at risk.
-   Make approval and rejection equally clear; do not manipulate the
    user into accepting a plan.

## 6. Motion

-   Use short transitions around 120--200 ms for hover, expansion, and
    state changes.
-   No animation should delay a critical action.
-   Respect `prefers-reduced-motion`.
-   Avoid continuous motion and decorative background effects.

## 7. Accessibility

-   Maintain strong text/background contrast.
-   Provide visible keyboard focus.
-   Use semantic headings and button labels.
-   Associate validation errors with the relevant input.
-   Do not communicate deadline risk by color alone.
-   Ensure keyboard users can approve, reject, and inspect proposals.
-   Avoid auto-scrolling that steals focus.

## 8. Responsive behavior

-   Test at 1440 px, 1024 px, 768 px, and 390 px widths.
-   At narrower widths, collapse the two-column desktop layout into a
    single column.
-   Preserve the order of information and make the proposed-plan state
    obvious.

## 9. Product tone and microcopy

Use direct, calm language: - "This plan does not fit your available
time." - "This change moves your review session to tomorrow." - "Your
assignment deadline is still at risk." - "Apply revised plan" - "Keep
current plan"

Avoid exaggerated claims such as "perfect schedule," "guaranteed
productivity," or "AI knows best."

## 10. Visual acceptance checklist

-   The main workflow is understandable without a tutorial.
-   The user can distinguish the accepted plan from a proposal.
-   Warnings include plain-language explanations.
-   No decorative feature competes with the schedule.
-   The UI remains readable and usable on a small screen.
