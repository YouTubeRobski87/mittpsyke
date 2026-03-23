<script lang="ts">
	import { tones } from '$lib/data/tones';
	import { jomojiSvgMap } from '$lib/data/jomojis';
	import { uniqueSvgIds } from '$lib/utils/uniqueSvgIds';
	import type { Component } from 'svelte';
	import { EmojiCrystalBall, EmojiLightBulb, EmojiMantelpieceClock, EmojiSeedling, EmojiZodiacAries, EmojiZodiacTaurus, EmojiZodiacGemini, EmojiZodiacCancer, EmojiZodiacLeo, EmojiZodiacVirgo, EmojiZodiacLibra, EmojiZodiacScorpio, EmojiZodiacSagittarius, EmojiZodiacCapricorn, EmojiZodiacAquarius, EmojiZodiacPisces, EmojiRobot, EmojiFaceYawning, EmojiFlagUk, EmojiArchive, EmojiCat, EmojiTornado, EmojiLedger, EmojiFaceGrimacing, EmojiFaceUnamused, EmojiTopHat, EmojiHeartOnFire, EmojiFaceUpsideDown, EmojiOwl, EmojiVideoGame, EmojiWomanDetective, EmojiCrown, EmojiEarth, EmojiMicrophone, EmojiPoo, EmojiBrain, EmojiOpenBook, EmojiSatellite, EmojiWomanMeditating, EmojiNewspaper, EmojiMusicalNotes, EmojiTheaterMasks, EmojiFaceNerd, EmojiFaceExplodingHead, EmojiPencil, EmojiCrossMark } from '$lib/assets/emojis';
	import UniqueEmoji from '$lib/components/UniqueEmoji.svelte';
	import { getZodiacFromBirthday } from '$lib/utils/zodiac';
	import { getRenderParagraphs, formatParagraph } from '$lib/utils/paragraphs';

	interface Props {
		weekday: string;
		date: string;
		emojis: string[];
		toneId: string;
		generatedText: string;
		birthday?: string;
		editable?: boolean;
		onEdit?: () => void;
		onClose?: () => void;
	}

	let { weekday, date, emojis, toneId, generatedText, birthday = '', editable = false, onEdit, onClose }: Props = $props();

	// Expose the document element for parent image/PDF export
	let documentElement: HTMLDivElement = $state(null!);
	export function getDocumentElement() {
		return documentElement;
	}

	const zodiacComponents: Record<string, Component> = {
		aries: EmojiZodiacAries,
		taurus: EmojiZodiacTaurus,
		gemini: EmojiZodiacGemini,
		cancer: EmojiZodiacCancer,
		leo: EmojiZodiacLeo,
		virgo: EmojiZodiacVirgo,
		libra: EmojiZodiacLibra,
		scorpio: EmojiZodiacScorpio,
		sagittarius: EmojiZodiacSagittarius,
		capricorn: EmojiZodiacCapricorn,
		aquarius: EmojiZodiacAquarius,
		pisces: EmojiZodiacPisces
	};

	const toneIconMap: Record<string, Component> = {
		'ai-robot': EmojiRobot,
		'bored': EmojiFaceYawning,
		'british': EmojiFlagUk,
		'bureaucratic': EmojiArchive,
		'cat-perspective': EmojiCat,
		'chaotic': EmojiTornado,
		'classic': EmojiLedger,
		'cringe': EmojiFaceGrimacing,
		'cynical': EmojiFaceUnamused,
		'detective': EmojiWomanDetective,
		'drama-queen': EmojiCrown,
		'formal': EmojiTopHat,
		'melodramatic': EmojiHeartOnFire,
		'meme': EmojiPoo,
		'nature-documentary': EmojiEarth,
		'nerd': EmojiFaceNerd,
		'overthinker': EmojiFaceExplodingHead,
		'passive-aggressive': EmojiFaceUpsideDown,
		'philosophical': EmojiOwl,
		'quest-log': EmojiVideoGame,
		'self-help': EmojiWomanMeditating,
		'shakespeare': EmojiTheaterMasks,
		'sportscaster': EmojiMicrophone,
		'storytelling': EmojiOpenBook,
		'tabloid': EmojiNewspaper,
		'therapist': EmojiBrain,
		'tinfoil-hat': EmojiSatellite,
		'troubadour': EmojiMusicalNotes
	};

	function getEmojiSvg(emojiId: string): string | undefined {
		return jomojiSvgMap.get(emojiId);
	}

	function getToneIcon(id: string): Component | undefined {
		return toneIconMap[id];
	}

	function getZodiacComponent(): Component | undefined {
		if (!birthday) return undefined;
		const sign = getZodiacFromBirthday(birthday);
		if (!sign) return undefined;
		return zodiacComponents[sign.id];
	}

	const renderParagraphs = $derived(getRenderParagraphs(generatedText));
	const tone = $derived(tones.find((t) => t.id === toneId));
	const ToneIcon = $derived(getToneIcon(toneId));
</script>

<div class="result-document" bind:this={documentElement}>
	<div class="paper-texture"></div>

	<div class="document-header">
		<div class="document-date">
			<span class="document-weekday">{weekday}</span>
			<span class="document-date-text">{date}</span>
			{#if tone}
				<div class="document-tone">
					{#if ToneIcon}
						<span class="tone-icon"><UniqueEmoji><ToneIcon size={20} /></UniqueEmoji></span>
					{/if}
					<span class="tone-name">{tone.name}</span>
				</div>
			{/if}
		</div>
		<span class="document-emojis">
			{#each emojis as emojiId}
				{@const svg = getEmojiSvg(emojiId)}
				{#if svg}
					<span class="document-emoji">{@html uniqueSvgIds(svg)}</span>
				{/if}
			{/each}
		</span>
	</div>

	<div class="document-content">
		{#each renderParagraphs as paragraph}
			{#if paragraph.type === 'horoscope-heading'}
				{@const ZodiacIcon = getZodiacComponent()}
				<p class="addon-heading">
					{#if ZodiacIcon}
						<span class="addon-icon"><UniqueEmoji><ZodiacIcon size={24} /></UniqueEmoji></span>
					{:else}
						<span class="addon-icon"><UniqueEmoji><EmojiCrystalBall size={24} /></UniqueEmoji></span>
					{/if}
					<span>{@html formatParagraph(paragraph.text)}</span>
				</p>
			{:else if paragraph.type === 'onthisday-heading'}
				<p class="addon-heading">
					<span class="addon-icon"><UniqueEmoji><EmojiMantelpieceClock size={24} /></UniqueEmoji></span>
					<span>{@html formatParagraph(paragraph.text)}</span>
				</p>
			{:else if paragraph.type === 'homework-heading'}
				<p class="addon-heading">
					<span class="addon-icon"><UniqueEmoji><EmojiLightBulb size={24} /></UniqueEmoji></span>
					<span>{@html formatParagraph(paragraph.text)}</span>
				</p>
			{:else if paragraph.type === 'dailychallenge-heading'}
				<p class="addon-heading">
					<span class="addon-icon"><UniqueEmoji><EmojiSeedling size={24} /></UniqueEmoji></span>
					<span>{@html formatParagraph(paragraph.text)}</span>
				</p>
			{:else}
				<p>
					{@html formatParagraph(paragraph.text)}
				</p>
			{/if}
		{/each}
	</div>

	<div class="document-footer">
		<div class="footer-line"></div>
		<div class="footer-content">
			{#if onClose}
				<button class="close-btn" data-no-export onclick={onClose}>
					<EmojiCrossMark size={20} />
					<span>Stäng</span>
				</button>
			{/if}
			{#if editable && onEdit}
				<button class="edit-btn" data-no-export onclick={onEdit}>
					<EmojiPencil size={20} />
					<span>Redigera</span>
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.result-document {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 2rem;
		font-family: var(--font-primary);
		background-color: var(--color-bg-elevated);
		border-radius: var(--radius-md);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			0 4px 12px rgba(0, 0, 0, 0.03),
			0 8px 32px rgba(0, 0, 0, 0.02);
		overflow: hidden;
	}

	.paper-texture {
		position: absolute;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
		opacity: 0.02;
		pointer-events: none;
	}

	.document-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.document-emojis {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.document-emoji {
		display: flex;
		align-items: center;
		width: 30px;
		height: 30px;
	}

	.document-emoji :global(svg) {
		width: 100%;
		height: 100%;
	}

	.document-tone {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.tone-icon {
		display: flex;
		align-items: center;
	}

	.tone-name {
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		font-stretch: 105%;
		letter-spacing: var(--tracking-wider);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.document-date {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
	}

	.document-weekday {
		font-size: var(--text-xl);
		font-weight: var(--weight-medium);
		font-stretch: 105%;
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-tight);
		color: var(--color-text);
	}

	.document-date-text {
		font-size: var(--text-sm);
		font-weight: var(--weight-regular);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
	}

	.document-content {
		font-size: var(--text-base);
		font-weight: var(--weight-book);
		line-height: var(--leading-loose);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text);
	}

	.document-content p {
		margin: 0 0 1.125rem 0;
		text-indent: 0;
	}

	.document-content p:first-child {
		font-weight: var(--weight-medium);
	}

	.document-content p:last-child {
		margin-bottom: 0;
	}

	.document-content p.addon-heading {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-weight: var(--weight-medium);
		margin-top: 1.5rem;
	}

	.document-content p.addon-heading:first-child {
		margin-top: 0;
		padding-top: 0;
		border-top: none;
	}

	.addon-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.document-footer {
		display: flex;
		flex-direction: column;
	}

	.footer-line {
		height: 1px;
		background: var(--color-border);
		margin-bottom: 1.25rem;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.close-btn:hover {
		color: var(--color-accent);
	}

	.edit-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		color: var(--color-text-muted);
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.edit-btn:hover {
		color: var(--color-accent);
	}

	@media (max-width: 640px) {
		.result-document {
			padding: 1.5rem;
			gap: 1rem;
		}

		.document-header {
			padding-bottom: 1rem;
		}

		.document-weekday {
			font-size: var(--text-lg);
		}

		.document-emojis {
			gap: 0.5rem;
		}

		.document-emoji :global(svg) {
			width: 24px;
			height: 24px;
		}

		.footer-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>
