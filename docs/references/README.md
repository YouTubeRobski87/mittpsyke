# Visual References

These images are the visual source of truth for MittPsyke.

They are not assets for direct rendering unless explicitly requested.

They are design references for humans and AI agents.

## Reading order

1. `00-design-system.png`
2. `02-home-vision-bear.png`
3. `03-companion-world-reference.png`
4. `04-hero-bear-scene.png`
5. `MittHem.png` — legacy, see note below
6. `01-dashboard-current-target.png` — legacy, see note below

`00-design-system.png` is the strongest source of truth for interface work. `MittHem.png` and
`01-dashboard-current-target.png` depict the old `/dashboard` page and are historical only — not
targets for current Mitt Hem (Kvällstugan) work. See their entries below for details.

## MittHem.png

> Legacy. Depicts the old `/dashboard` grid layout (hero, “Ditt nuläge”, two cards, “Utforska
> vidare”, privacy row) from before Kvällstugan became Mitt Hem. `/dashboard` is now a legacy route
> that 301-redirects to Kvällstugan (`/dashboard/kvallsstugan`), which does not use this layout.
> Kept for historical reference and for the still-live `01-dashboard-current-target.png` comparison
> below — not a target for current Mitt Hem work. For Mitt Hem/Kvällstugan UI work, look at the
> shipped route instead.

Purpose (historical): layout target for the old `/dashboard` page.

Use for: understanding the previous dashboard grid, card styling and information density, if ever
touching the legacy `/dashboard` files that still exist on disk.

Rule: Do not use this as a target for Kvällstugan or any current Mitt Hem work.

## 00-design-system.png

Purpose: Defines the visual language of MittPsyke.

Use for colors, typography, spacing, cards, buttons, icons, border radius, shadows and mobile patterns.

Rule: Never introduce UI that conflicts with this reference unless explicitly instructed.

## 01-dashboard-current-target.png

> Legacy, same status as `MittHem.png` above: shows the old `/dashboard` layout, not current Mitt
> Hem. `/dashboard` still exists as a redirecting legacy route; this is not the primary visual
> target for Mitt Hem/Kvällstugan work anymore.

Purpose (historical): showed the desired layout and feel for the old `/dashboard` page.

Use for: legacy dashboard card styling, hero proportions and the overall calm feel, if ever touching
`src/routes/dashboard/+page.svelte` before it is removed.

## 02-home-vision-bear.png

Purpose: Shows the long-term emotional vision for the home experience (Mitt Hem / Kvällstugan) with
the bear companion.

Use for emotional tone, companion placement, hero composition, warm atmosphere and premium product feel.

Rule: Use as vision, not as an exact implementation requirement. Applies to Kvällstugan
(`/dashboard/kvallsstugan`), today’s Mitt Hem — not the legacy `/dashboard` route.

## 03-companion-world-reference.png

Purpose: Design specification for the living companion world.

Use for dynamic light, particles, tree and nature growth, weather, seasons, water reflection, subtle animation, depth, focus and companion mood.

Rule: This reference defines how Growth Garden should eventually influence the whole place.

## 04-hero-bear-scene.png

Purpose: Art direction for companion scenes.

Use for lighting, rendering style, colors, framing, atmosphere and warm scenic composition.

Rule: Use when creating or adjusting illustrated hero scenes.
