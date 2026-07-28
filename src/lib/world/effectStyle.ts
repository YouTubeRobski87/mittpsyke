import type { LivingWorldEffect } from '$lib/worldScene';

// Översätter en effekt från scenkonfigurationen till CSS-variabler. Delas av
// alla världslager (AmbientWorld, WaterLayer, LeafLayer) så placering, timing
// och parallaxdjup tolkas likadant överallt.
export function effectStyle(effect: LivingWorldEffect): string {
	return [
		effect.x !== undefined ? `--x: ${effect.x}%` : '',
		effect.y !== undefined ? `--y: ${effect.y}%` : '',
		effect.width !== undefined ? `--w: ${effect.width}%` : '',
		effect.height !== undefined ? `--h: ${effect.height}%` : '',
		effect.durationMs !== undefined ? `--duration: ${effect.durationMs}ms` : '',
		effect.delayMs !== undefined ? `--delay: ${effect.delayMs}ms` : '',
		effect.opacity !== undefined ? `--opacity: ${effect.opacity}` : '',
		effect.scale !== undefined ? `--scale: ${effect.scale}` : '',
		// Parallaxdjup: 0 = längst bort (rör sig minst), 1 = närmast (rör sig mest).
		effect.depth !== undefined ? `--depth: ${effect.depth}` : ''
	]
		.filter(Boolean)
		.join('; ');
}
