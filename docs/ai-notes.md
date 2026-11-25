# AI notes

> **DRAFT. Rewrite in your own words before submitting.** The entries below are real events from building this
> project, but the evaluator will ask _you_ about them. Add your own Gemini prompts from the first attempt as well.

Tools used: Google Gemini (first attempt: code pasted by hand), Claude Code (rebuild: worked directly in the repo).

## 1. Rebuild plan from the brief

- **Prompt:** "Review the project and the required document … compare the whole project with it and make a proper plan … make sure all tasks are covered."
- **Kept:** The gap analysis (ESLint wasn't linting any `.ts` files, CI had no test step, ErrorBoundary was never mounted, Context used instead of Redux, raw error codes on screen) and the task-by-task plan.
- **Changed and why:** I chose GitHub Pages instead of Vercel to keep deploys inside GitHub, and asked for a light e-commerce theme with flat icons.

## 2. Mock API with MSW

- **Prompt:** _(your words)_ "Mock the shared contract so every error can be triggered on purpose."
- **Kept:** MSW handlers with real status codes, the seeded 5,000-product DB, and the Dev tools panel.
- **Changed and why:** _(e.g. which error triggers you added or renamed, and why)_

## 3. Product images

- **Prompt:** "Use free product images or use images from an API if available."
- **Kept:** Generated flat SVG illustrations (`scripts/generate-product-art.mjs`).
- **Changed and why:** The AI first tried LoremFlickr (down, HTTP 500) and DummyJSON (no ducks, keyboards or stickers).
  Generated SVGs were the reliable, free option.

## An AI mistake, and how it was caught

**Wrong measurement in `performance.md`.** The first version of the "re-renders per live stock tick" benchmark used
`<Profiler onRender>` and reported **48 → 48**, as if `React.memo` did nothing. That was wrong: `Profiler` fires whenever
it re-renders, even if the memoized child inside skips rendering. It was caught because the result contradicted
what memo is supposed to do, so the measurement was questioned instead of the optimization. The fix was to count renders inside the
card components, which showed the real result: **48 → 1**.

_(Other real examples from this build: the "Shop all" tab stayed highlighted on category pages, caught by looking at a
screenshot; the first test shim for jsdom's `AbortSignal` used `instanceof`, which passed but still failed in Node, caught by
running the tests.)_

## What I wouldn't hand to AI

Deciding **what is safe to retry** at checkout (the idempotency-key scope: per cart contents, kept across reloads,
cleared after success). Getting it wrong means double-charging real people or blocking a legitimate second order. I want to
reason it through myself and check it with a test, not accept a plausible-looking answer.
