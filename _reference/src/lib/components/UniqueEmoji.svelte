<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let container: HTMLSpanElement;
	let instanceId = Math.random().toString(36).slice(2, 8);

	onMount(() => {
		const svg = container.querySelector('svg');
		if (!svg) return;

		// Find all elements with IDs and collect them
		const elementsWithIds = svg.querySelectorAll('[id]');
		const idMap = new Map<string, string>();

		elementsWithIds.forEach((el) => {
			const oldId = el.getAttribute('id')!;
			const newId = `${oldId}_${instanceId}`;
			idMap.set(oldId, newId);
			el.setAttribute('id', newId);
		});

		// Update all references to those IDs
		const allElements = svg.querySelectorAll('*');
		allElements.forEach((el) => {
			// Check fill, stroke, clip-path, mask, etc.
			for (const attr of ['fill', 'stroke', 'clip-path', 'mask', 'filter']) {
				const value = el.getAttribute(attr);
				if (value && value.startsWith('url(#')) {
					const match = value.match(/url\(#([^)]+)\)/);
					if (match && idMap.has(match[1])) {
						el.setAttribute(attr, `url(#${idMap.get(match[1])})`);
					}
				}
			}

			// Check href and xlink:href
			for (const attr of ['href', 'xlink:href']) {
				const value = el.getAttribute(attr);
				if (value && value.startsWith('#')) {
					const refId = value.slice(1);
					if (idMap.has(refId)) {
						el.setAttribute(attr, `#${idMap.get(refId)}`);
					}
				}
			}
		});
	});
</script>

<span bind:this={container} class="unique-emoji">
	{@render children()}
</span>

<style>
	.unique-emoji {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
