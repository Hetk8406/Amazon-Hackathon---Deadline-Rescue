# Deadline Rescue --- Security, Privacy, and Production Readiness

This document is the pre-launch checklist for security, privacy,
accessibility, SEO, performance, reliability, and conversion UX. Work
through it against the actual codebase and deployment configuration. Do
not mark an item complete without verifying it.

## 1. Operating principles

-   Inspect the current implementation before making changes.
-   Prefer the smallest safe change that fits the existing stack.
-   Do not invent legal claims or state that the app is compliant
    without evidence.
-   Never expose secrets in frontend code, source control, browser
    bundles, screenshots, or logs.
-   Keep the demo workflow working while applying production-readiness
    changes.
-   Test after each meaningful change and update `TRACKER.md`.
-   Treat this document as a checklist, not proof that the app already
    meets these requirements.

## 2. Security and privacy --- P0

### 2.1 Remove frontend secrets

-   Search source files, public assets, git history where feasible, and
    built bundles for API keys, tokens, credentials, and private URLs.
-   Remember that frontend environment variables are public if bundled
    into client-side JavaScript. A `.env` file does not make a
    browser-exposed value secret.
-   Move privileged keys to a server-side environment and access them
    through a backend endpoint.
-   Keep `.env`, `.env.local`, credential files, and private
    certificates out of Git; provide `.env.example` containing
    placeholders only.
-   Rotate any credential that was previously committed or deployed
    publicly. Deleting it from the latest commit alone is not
    sufficient.
-   Verify production build output does not contain server secrets.

### 2.2 HTTPS and transport security

-   Deploy through a host that supports HTTPS and valid TLS
    certificates.
-   Redirect HTTP to HTTPS at the hosting layer.
-   Enable HSTS only after HTTPS is confirmed to work across all
    intended subdomains; choose a suitable max-age and understand
    preload implications before enabling preload.
-   Avoid mixed-content resources.
-   Use secure cookie attributes (`Secure`, `HttpOnly`, and an
    appropriate `SameSite`) for server-managed cookies.
-   Do not implement a client-side redirect as the only HTTPS
    enforcement mechanism; configure it at the host/CDN.

### 2.3 Privacy policy

-   Add a clearly accessible Privacy Policy page linked from the footer
    and any data-collection form.
-   Accurately document what the deployed app collects, why it collects
    it, where it is stored, whether third-party providers receive it,
    retention/deletion practices, analytics, contact method, and
    relevant user choices.
-   If tasks are stored only in the user's browser, say so only after
    confirming the implementation. Explain that clearing browser storage
    removes local data if applicable.
-   If AI providers receive task text, disclose this and avoid sending
    unnecessary personal information.
-   Identify a real contact channel supplied by the project owner; never
    invent a business address or legal entity.
-   Review applicable jurisdictions and seek qualified legal advice
    where necessary. A generated template is not legal advice.

### 2.4 Terms and conditions

-   Add a Terms page linked from the footer.
-   Explain acceptable use, service limitations, user responsibility for
    checking deadlines, availability and warranty disclaimers as
    appropriate, intellectual-property ownership, and how changes or
    termination are handled.
-   Do not promise that a schedule is always correct or that deadlines
    will be met.
-   Use accurate owner/operator details and a real contact method.
-   Have the final terms reviewed for the intended audience and
    applicable law.

### 2.5 Cookie and tracking consent

-   Inventory cookies, local storage, analytics, embedded content, and
    other tracking technologies actually used.
-   Do not display a misleading "cookie consent" banner if the app does
    not use cookies or non-essential tracking; determine whether a
    concise privacy notice is more appropriate.
-   Where consent is legally required, block non-essential
    analytics/marketing tags until the user opts in.
-   Provide accept, reject, and preferences choices with comparable
    visibility when appropriate; do not use preselected consent.
-   Persist consent choices appropriately and provide a way to change
    them later.
-   Ensure essential app functionality does not depend on accepting
    analytics cookies.
-   Confirm applicable legal requirements rather than assuming one
    banner design fits every region.

## 3. SEO and share metadata --- P1

### 3.1 Page titles and descriptions

-   Set a unique, accurate `<title>` and meta description for each
    indexable route.
-   Avoid keyword stuffing and descriptions that promise features the
    app does not have.
-   Add canonical URLs only when the production URL is known and
    duplicate-page handling requires them.
-   For a client-rendered single-page app, verify how the deployed host
    and search crawlers receive metadata for each route.

### 3.2 Social preview image

-   Add Open Graph metadata (`og:title`, `og:description`, `og:type`,
    `og:url`, and `og:image`) and appropriate X/Twitter card metadata.
-   Create an original branded image with legible text at social preview
    sizes; use only assets the project has rights to use.
-   Use an absolute production URL for the preview image.
-   Verify the image loads publicly and renders correctly in
    link-preview validators where available.

### 3.3 Favicon and app icons

-   Replace framework-default branding with a project-owned favicon.
-   Add appropriate favicon sizes and a touch icon if needed.
-   Confirm paths work in production and return successful responses.

### 3.4 Sitemap and robots.txt

-   Create `sitemap.xml` containing only canonical, public pages
    intended for indexing.
-   Create `robots.txt` with sensible crawler instructions and the
    sitemap location.
-   Do not rely on `robots.txt` to protect private content; access
    control must be enforced by the application.
-   Exclude staging, preview, and private routes from the public
    sitemap.
-   Verify both files are reachable at the production domain.

### 3.5 Image alt text

-   Add meaningful alt text to informative images.
-   Use empty alt text (`alt=""`) for purely decorative images.
-   Avoid stuffing alt text with keywords or repeating nearby text
    unnecessarily.
-   Ensure icon-only controls have accessible names independent of image
    alt text.

## 4. Performance --- P1

### 4.1 Image optimization

-   Resize images to the maximum dimensions they are displayed at.
-   Prefer WebP or AVIF where browser support and deployment tooling
    allow; retain suitable fallbacks where necessary.
-   Compress images without making important text or details illegible.
-   Use responsive `srcset`/`sizes` or framework image optimization
    where available.
-   Lazy-load below-the-fold images; do not lazy-load the main
    above-the-fold hero image if it harms LCP.
-   Include image dimensions or aspect ratios to reduce layout shift.

### 4.2 Load speed and Core Web Vitals

-   Run Lighthouse on a production build, not only the development
    server.
-   Test both mobile and desktop profiles.
-   Review Largest Contentful Paint (LCP), Interaction to Next Paint
    (INP), and Cumulative Layout Shift (CLS), along with accessibility
    and best-practice findings.
-   Fix high-impact issues first: oversized images, unnecessary
    JavaScript, render-blocking resources, layout shifts, and slow API
    calls.
-   Record the date, URL, device profile, and key findings in
    `TRACKER.md`.
-   Do not claim a performance score that has not been measured.

## 5. Accessibility and responsive UX --- P1

### 5.1 Color contrast

-   Check text and controls against WCAG 2.2 AA contrast guidance where
    applicable.
-   Aim for at least 4.5:1 contrast for normal text and 3:1 for large
    text; check non-text controls and focus indicators too.
-   Do not use color as the only indicator for deadline risk, errors,
    success, or task status.
-   Test hover, focus, disabled, error, and selected states in both
    themes if the app supports themes.

### 5.2 Mobile responsiveness

-   Test at approximately 390 px, 768 px, 1024 px, and 1440 px widths.
-   Check navigation, chat input, task forms, schedule blocks, dialogs,
    footer, and legal pages.
-   Avoid horizontal page overflow and controls too small to tap.
-   Ensure keyboard focus and page zoom do not hide important controls.
-   Test real browser behavior when possible, not just responsive
    preview.

### 5.3 Custom 404 page

-   Create a branded not-found page with a clear explanation and a link
    back to the main app.
-   Ensure unknown routes show a genuine 404 status when the hosting
    setup supports it; a visual 404 alone may still return HTTP 200.
-   Check that the fallback does not accidentally expose private routes.

### 5.4 Broken links

-   Check all internal routes, footer links, external references, logo
    links, and calls to action.
-   Fix missing routes, incorrect anchors, stale external links, and
    links that lead to the wrong environment.
-   Verify privacy and terms links from every relevant layout.
-   Re-run the link check after route changes.

## 6. Forms and abuse prevention --- P0/P1 depending on exposure

### 6.1 Form validation

-   Validate inputs in the UI for usability and validate again on the
    server for security whenever a backend exists.
-   Use clear field labels, inline error messages, and appropriate input
    types.
-   Validate task titles, positive durations, dates, and available-time
    values.
-   Preserve valid user input after a validation error.
-   Prevent duplicate submissions and show loading/success/error states.
-   Never trust client-side validation as a security boundary.

### 6.2 Spam protection

-   First inventory public forms and determine whether they can be
    abused.
-   For a public contact or submission form, consider rate limiting,
    server-side validation, honeypot fields, and a provider such as
    Cloudflare Turnstile if appropriate.
-   Verify tokens server-side; a client-only CAPTCHA check is not
    sufficient.
-   Do not add CAPTCHA to a local-only task planner unless there is an
    actual abuse case.
-   Keep accessibility and privacy in mind when choosing a protection
    mechanism.

## 7. Analytics --- optional and privacy-sensitive

-   Decide whether analytics are actually needed before adding them.
-   Choose a provider that fits the project's privacy needs and
    deployment setup.
-   Track only useful, low-sensitivity events such as successful demo
    completion or a replanning action; do not send raw task text,
    assignment names, deadlines, or other sensitive user content.
-   Disclose analytics in the Privacy Policy.
-   Obtain consent before non-essential tracking where required by
    applicable law.
-   Verify that opt-out or rejection choices actually prevent
    non-essential tracking.
-   Avoid adding analytics merely to make the app look production-ready.

## 8. Clear call to action

-   Each major page should have one obvious primary action.
-   For Deadline Rescue, the primary action should lead users to
    **Create my recovery plan** or start the sample scenario.
-   Secondary actions should be visually quieter.
-   The CTA must describe the real outcome and must not imply a
    guaranteed result.
-   On the main app screen, prioritize starting a plan and recovering a
    disrupted plan; avoid competing promotional buttons.
-   Test the primary CTA with keyboard, touch, and screen-reader labels.

## 9. Pre-launch verification checklist

### Security and legal

-   [ ] No frontend secrets or accidentally committed credentials.
-   [ ] Any previously exposed secrets have been rotated.
-   [ ] HTTPS and HTTP-to-HTTPS redirect verified in production.
-   [ ] Privacy Policy accurately reflects the real data flow.
-   [ ] Terms accurately describe the service and its limitations.
-   [ ] Cookies and third-party tracking inventoried; consent behavior
    verified where required.

### SEO and sharing

-   [ ] Unique title and meta description on each indexable route.
-   [ ] Open Graph and social preview image verified.
-   [ ] Custom favicon and app icons verified.
-   [ ] `sitemap.xml` and `robots.txt` verified.
-   [ ] Informative images have alt text; decorative images have empty
    alt text.

### Performance and accessibility

-   [ ] Images resized and compressed.
-   [ ] Lighthouse run on production build; findings recorded.
-   [ ] Contrast checked.
-   [ ] Mobile layout tested at multiple widths.
-   [ ] Custom 404 route and status behavior verified.
-   [ ] Internal and external links checked.

### Functionality and launch

-   [ ] Form validation tested for valid, invalid, empty, and boundary
    inputs.
-   [ ] Spam protection added only where needed and validated
    server-side.
-   [ ] Analytics decisions documented; no sensitive user content is
    tracked.
-   [ ] One clear primary CTA is present and functional.
-   [ ] Main Deadline Rescue workflow still works after all changes.
-   [ ] `TRACKER.md` updated with actual test results and remaining
    issues.

## 10. Suggested order of work

1.  Inspect repository, hosting, routes, environment variables, and data
    flow.
2.  Fix exposed secrets and configure HTTPS.
3.  Verify task data storage and any AI-provider data sharing.
4.  Publish accurate Privacy Policy and Terms pages.
5.  Check form validation and abuse exposure.
6.  Fix responsive layout, contrast, alt text, and 404 behavior.
7.  Add metadata, favicon, social preview, sitemap, and robots rules.
8.  Optimize images and run Lighthouse.
9.  Decide on analytics and consent based on actual tracking and legal
    requirements.
10. Test all links, the primary CTA, and the complete core workflow.

## 11. Definition of done

The checklist is complete only when each applicable item has been
verified against the deployed application. Record exceptions, test
results, and follow-up tasks in `TRACKER.md`. Do not mark an item done
merely because code was generated.
