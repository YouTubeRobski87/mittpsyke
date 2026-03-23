<script lang="ts">
	import { wizardStore } from '$lib/stores/wizard.svelte';
	import { onMount } from 'svelte';
	import { jomojiCategories, jomojiSvgMap } from '$lib/data/jomojis';
	import type { Jomoji } from '$lib/data/jomojiTypes';
	import { shuffleAndPick } from '$lib/utils/shuffleAndPick';
	import { uniqueSvgIds } from '$lib/utils/uniqueSvgIds';
	import RequiredIndicator from '$lib/components/RequiredIndicator.svelte';

	const EMOJIS_PER_CATEGORY = 96;

	// Pre-compute unique tab icons once to prevent re-generation on tab switch
	const uniqueTabIcons = jomojiCategories.map((cat) => uniqueSvgIds(cat.icon));

	// Cache unique SVGs for emojis by ID to prevent re-generation
	const uniqueEmojiSvgCache = new Map<string, string>();
	function getUniqueEmojiSvg(emojiId: string, svg: string): string {
		if (!uniqueEmojiSvgCache.has(emojiId)) {
			uniqueEmojiSvgCache.set(emojiId, uniqueSvgIds(svg));
		}
		return uniqueEmojiSvgCache.get(emojiId)!;
	}

	const weekdays = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
	const months = [
		'januari',
		'februari',
		'mars',
		'april',
		'maj',
		'juni',
		'juli',
		'augusti',
		'september',
		'oktober',
		'november',
		'december'
	];

	let activeTab = $state(0);

	// Shuffle once and cache per category
	const shuffledCache = new Map<number, Jomoji[]>();
	function getDisplayedEmojis(categoryIndex: number): Jomoji[] {
		if (!shuffledCache.has(categoryIndex)) {
			shuffledCache.set(
				categoryIndex,
				shuffleAndPick(jomojiCategories[categoryIndex].emojis, EMOJIS_PER_CATEGORY)
			);
		}
		const cached = shuffledCache.get(categoryIndex)!;
		const selectedIds = new Set(wizardStore.data.emojis);

		// Ensure selected emojis from this category are always visible
		const selectedInCategory = jomojiCategories[categoryIndex].emojis.filter((e) =>
			selectedIds.has(e.id)
		);
		const cachedIds = new Set(cached.map((e) => e.id));
		const missingSelected = selectedInCategory.filter((e) => !cachedIds.has(e.id));

		if (missingSelected.length > 0) {
			return [...missingSelected, ...cached];
		}
		return cached;
	}

	let currentEmojis: Jomoji[] = $derived(getDisplayedEmojis(activeTab));

	onMount(() => {
		const now = new Date();
		const weekday = weekdays[now.getDay()];
		const date = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

		wizardStore.updateData('weekday', weekday);
		wizardStore.updateData('date', date);
		wizardStore.updateData('dateISO', now.toISOString().split('T')[0]);
	});

	function toggleEmoji(emojiId: string) {
		const current = wizardStore.data.emojis;
		if (current.includes(emojiId)) {
			wizardStore.updateData(
				'emojis',
				current.filter((e) => e !== emojiId)
			);
		} else if (current.length < 4) {
			wizardStore.updateData('emojis', [...current, emojiId]);
		}
	}

	function isSelected(emojiId: string): boolean {
		return wizardStore.data.emojis.includes(emojiId);
	}
</script>

<div class="step-content">
	<p class="emoji-prompt">Ibland säger en bild mer än tusen ord... Välj 1-4 emojis som sammanfattar din dag<RequiredIndicator tooltip="Välj minst en emoji" /></p>

	<div class="date-display">
		<div class="date-info">
			<span class="weekday">{wizardStore.data.weekday}</span>
			<span class="date">{wizardStore.data.date}</span>
		</div>
		<div class="selected-emojis">
			{#each wizardStore.data.emojis as emojiId}
				{@const svg = jomojiSvgMap.get(emojiId)}
				<button class="selected-emoji" onclick={() => toggleEmoji(emojiId)}>
					{#if svg}
						<span class="emoji-svg selected-emoji-svg">{@html getUniqueEmojiSvg(emojiId, svg)}</span>
					{/if}
				</button>
			{/each}
			{#each Array(4 - wizardStore.data.emojis.length) as _}
				<div class="emoji-placeholder"></div>
			{/each}
		</div>
	</div>

	<div class="emoji-picker">
		<div class="tabs" role="tablist">
			{#each jomojiCategories as category, i (category.name)}
				<button
					class="tab"
					class:active={activeTab === i}
					role="tab"
					aria-selected={activeTab === i}
					onclick={() => (activeTab = i)}
				>
					<span class="tab-icon">{@html uniqueTabIcons[i]}</span>
					<span class="tab-label">{category.name}</span>
				</button>
			{/each}
		</div>

		<div class="emoji-grid">
			{#each currentEmojis as emoji (emoji.id)}
				<button
					class="emoji-btn"
					class:selected={isSelected(emoji.id)}
					class:disabled={wizardStore.data.emojis.length >= 4 && !isSelected(emoji.id)}
					onclick={() => toggleEmoji(emoji.id)}
					title={emoji.name}
				>
					{@html getUniqueEmojiSvg(emoji.id, emoji.svg)}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.date-display {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background-color: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.date-info {
		display: flex;
		flex-direction: column;
	}

	.weekday {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		color: var(--color-text);
	}

	.date {
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		margin-top: 0.125rem;
	}

	.selected-emojis {
		display: flex;
		gap: 0.5rem;
	}

	.selected-emoji {
		width: 3.25rem;
		height: 3.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg);
		border: 2px solid var(--color-accent);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.selected-emoji:hover {
		transform: scale(1.05);
	}

	.selected-emoji-svg {
		width: 2.125rem;
		height: 2.125rem;
	}

	.emoji-placeholder {
		width: 3.25rem;
		height: 3.25rem;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-md);
	}

	.emoji-prompt {
		text-align: center;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		margin: 0;
	}

	.emoji-picker {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-bg-elevated);
	}

	/* Tabs */
	.tabs {
		display: flex;
		justify-content: center;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 0.625rem;
		border: none;
		background: none;
		cursor: pointer;
		color: var(--color-text-muted);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		white-space: nowrap;
		border-bottom: 2px solid transparent;
		transition:
			color 0.15s,
			border-color 0.15s;
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	.tab-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.tab-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.tab-label {
		line-height: 1.25rem;
	}

	/* Emoji grid */
	.emoji-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.375rem;
		padding: 0.75rem;
	}

	.emoji-btn {
		width: 100%;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 0.35rem;
		transition:
			transform 0.1s ease,
			border-color 0.1s ease,
			background-color 0.1s ease;
	}

	.emoji-btn :global(svg) {
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.emoji-btn:hover:not(.disabled) {
		transform: scale(1.1);
		border-color: var(--color-accent);
	}

	.emoji-btn.selected {
		border: 2px solid var(--color-accent);
	}

	.emoji-btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* SVG sizing helper */
	.emoji-svg {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.emoji-svg :global(svg) {
		width: 100%;
		height: 100%;
	}

	@media (max-width: 600px) {
		.date-display {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.selected-emojis {
			flex-wrap: wrap;
		}

		.tab-label {
			display: none;
		}

		.tab.active .tab-label {
			display: block;
		}
	}

	@media (max-width: 380px) {
		.emoji-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (min-width: 601px) {
		.emoji-grid {
			grid-template-columns: repeat(8, 1fr);
		}
	}

	@media (min-width: 768px) {
		.emoji-grid {
			grid-template-columns: repeat(10, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.emoji-grid {
			grid-template-columns: repeat(12, 1fr);
		}
	}
</style>
