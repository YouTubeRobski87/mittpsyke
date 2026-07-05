# DESIGN SYSTEM

MittPsyke ska kännas varmt, tryggt, enkelt och premium — aldrig kliniskt, stressigt eller speligt.

Always inspect:

1. `docs/references/00-design-system.png`
2. `docs/references/01-dashboard-current-target.png`

## Core feeling

The interface should feel like a calm sanctuary, a soft home base, a place to return to, nature-inspired, warm and emotionally safe.

It should not feel like a clinical dashboard, productivity tool, game interface, noisy analytics product or generic SaaS admin panel.

## Layout principles

Use generous whitespace, large rounded cards, calm visual hierarchy, soft shadows, clear spacing, low visual density and few competing focal points.

Avoid crowded sections, harsh contrast, dense tables, many small controls and bright warning colors unless truly necessary.

## Color direction

Use forest green, light green, sage, sand, lavender, pale sky blue and warm off-white.

Avoid harsh red, neon colors, cold gray-heavy UI, dark clinical panels on the main dashboard and too many saturated accents.

## Cards

Cards should be rounded, soft, lightly bordered, subtly shadowed, spacious and calm.

Cards should feel like resting places, not widgets demanding attention.

## Buttons

Buttons should be clear, soft, friendly and low-pressure.

Primary buttons should use calm green tones.

Secondary buttons should feel quiet and supportive.

## Typography

Use calm, readable typography.

Headings should feel confident but not loud.

Body copy should be short and human.

Prefer copy like:

- “Vad fint att du är här.”
- “En liten stund i taget.”
- “Den finns kvar här när du återvänder.”

Avoid:

- “Complete your task”
- “You missed this”
- “Level up”
- “Boost your productivity”

## Dashboard rules

The dashboard is “Mitt Hem”.

It should be the emotional center of the product.

The hero scene is the soul of the page. Do not reduce it to a decorative banner.

## Sidebar

The sidebar should be quiet, clear, low contrast, easy to scan and consistent across dashboard-related areas.

Active state should be visible but calm.

## Mobile

Mobile should feel like the same place, not a stripped-down fallback.

Rules:

- no horizontal scroll
- cards stack cleanly
- hero remains emotionally strong
- text stays readable
- no overcrowding
- navigation remains usable

## AI-agent implementation rules

When editing UI:

- preserve existing functionality
- improve existing components before creating new ones
- avoid large rewrites unless explicitly requested
- keep diffs focused
- do not change backend, auth, database or routing unless explicitly asked
- run `npm run check`
- run `npm run build`
