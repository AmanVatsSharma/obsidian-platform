# Obsidian UI — token pipeline (phase 2)

**Purpose:** Describe how to promote `src/tokens/semantic-tokens.json` into generated artifacts (CSS variables, Tailwind, Figma) using Style Dictionary or Tokens Studio.

## Today

- `semantic-tokens.json` mirrors `src/styles/tokens.css` for PR review and future CI diffs.
- Source of truth for runtime remains **CSS variables** loaded via `obsidian-ui.css`.

## Recommended pipeline

1. Add Style Dictionary config that reads `semantic-tokens.json` and emits:
   - `tokens.css` (or a partial) — consumed by the design system build, **or**
   - Tailwind theme JSON merged into `preset.ts` generation.
2. In CI, run the generator and fail the job if the output differs from committed files (`git diff --exit-code`).
3. Optionally link Figma library version to the token PR (design–dev contract).

## Manual actions

- Run generator only after design approval (see project manual_actions / release runbooks if adopted).
