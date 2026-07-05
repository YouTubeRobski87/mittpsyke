# AI GUIDELINES

## Before doing anything

Always start by reading:

docs/README.md

Do not begin implementing changes before reading the documentation hierarchy.

## First rule


Read the relevant docs before making UI changes:

- `docs/NORTH_STAR.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/COMPANION_WORLD.md`
- `docs/references/README.md`

For dashboard or companion work, inspect all images in `docs/references/`.

## Product principle

We are not just building features.

We are building a place people want to return to.

If two solutions are equally good technically, choose the calmer one.

## Change discipline

Do:

- make small focused diffs
- preserve existing functionality
- improve existing components before creating new ones
- keep routing stable unless explicitly asked
- preserve SEO unless explicitly asked
- preserve Supabase logic unless explicitly asked
- run `npm run check`
- run `npm run build`

Do not:

- rewrite large parts of the app unnecessarily
- change backend logic without explicit permission
- change auth flows without explicit permission
- add new dependencies without explicit permission
- redesign components against the visual references
- introduce gamified rewards, XP, levels or guilt-based streaks

## Reporting

After changes, report:

- files read
- files changed
- summary of changes
- result of `npm run check`
- result of `npm run build`
- risks or follow-up work
