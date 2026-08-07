# Visual References

These images are the visual source of truth for MittPsyke.

They are not assets for direct rendering unless explicitly requested.

They are design references for humans and AI agents.

## Reading order

1. `00-design-system.png`
2. `MittHem.png`
3. `01-dashboard-current-target.png`
4. `02-home-vision-bear.png`
5. `03-companion-world-reference.png`
6. `04-hero-bear-scene.png`

The first two references are the strongest source of truth for interface work.

## MittHem.png

Purpose: Current layout target for “Mitt Hem” (/dashboard).

Use for the wide desktop grid: world across two of three column tracks, “Ditt
nuläge” in the third, two equal cards plus “Utforska vidare” on the row below,
privacy row full width at the bottom.

Rule: This supersedes `01-dashboard-current-target.png` for dashboard layout,
grid proportions and information density. `01` is still valid for card styling,
hero proportions and the overall calm feel — but its full-width hero with a 3+2
card stack is no longer the layout we build.

Note: the hero in this reference is an aspirational scene with the companion on
the left. The shipped scene (`dashboard-lakeside-world.webp`) has its land and
companion on the right, so the hero copy sits on the left instead of mirrored.
The copy width is bound by `COMPANION_DASHBOARD_COPY_SAFE_WIDTH_PCT`, not by
where any one animal happens to stand.

## 00-design-system.png

Purpose: Defines the visual language of MittPsyke.

Use for colors, typography, spacing, cards, buttons, icons, border radius, shadows and mobile patterns.

Rule: Never introduce UI that conflicts with this reference unless explicitly instructed.

## 01-dashboard-current-target.png

Purpose: Shows the desired layout and feel for “Mitt Hem”.

Use for dashboard layout, hero proportions, card hierarchy, spacing, balance, calm visual density and sidebar treatment.

Rule: This is the primary visual target for dashboard-related changes.

## 02-home-vision-bear.png

Purpose: Shows the long-term vision for the dashboard with the bear companion.

Use for emotional tone, companion placement, hero composition, warm atmosphere and premium product feel.

Rule: Use as vision, not as an exact implementation requirement.

## 03-companion-world-reference.png

Purpose: Design specification for the living companion world.

Use for dynamic light, particles, tree and nature growth, weather, seasons, water reflection, subtle animation, depth, focus and companion mood.

Rule: This reference defines how Growth Garden should eventually influence the whole place.

## 04-hero-bear-scene.png

Purpose: Art direction for companion scenes.

Use for lighting, rendering style, colors, framing, atmosphere and warm scenic composition.

Rule: Use when creating or adjusting illustrated hero scenes.
