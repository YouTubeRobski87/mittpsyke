<script lang="ts">
	type EvidenceClaim = {
		title: string;
		description: string;
		evidence: string;
	};

	type ThemeInsight = {
		label: string;
		count: number;
		weight: number;
		tone: 'soft' | 'steady' | 'warm';
		evidence: string;
	};

	type TimelineSegment = {
		label: string;
		range: string;
		entryCount: number;
		summary: string;
	};

	export type DiaryNarrativeInsightViewModel = {
		entryCount: number;
		firstEntryDate: string | null;
		latestEntryDate: string | null;
		evidenceLevel: 'none' | 'emerging' | 'ready' | 'deep' | 'longitudinal';
		readinessMessage: string;
		overviewIntro: string;
		overview: EvidenceClaim[];
		patterns: EvidenceClaim[];
		themes: ThemeInsight[];
		timeline: {
			title: string;
			summary: string;
			segments: TimelineSegment[];
		};
		strengths: EvidenceClaim[];
		challenges: EvidenceClaim[];
		storyParagraphs: string[];
		generatedWithAi: boolean;
	};

	let { narrative }: { narrative: DiaryNarrativeInsightViewModel | null } = $props();

	const hasUsefulAnalysis = $derived(Boolean(narrative && narrative.evidenceLevel !== 'none'));
</script>

{#if !narrative}
	<section class="narrative-empty">
		<p>Jag kunde inte läsa in analysen just nu. Försök igen om en liten stund.</p>
	</section>
{:else if !hasUsefulAnalysis}
	<section class="narrative-empty">
		<p>{narrative.readinessMessage}</p>
		<a href="/dagbok/checkin#skriv-sjalv" class="soft-link">Skriv en reflektion</a>
	</section>
{:else}
	<section class="ai-overview insight-panel hero-panel">
		<div class="panel-meta">
			<span>AI-översikt</span>
			<span>{narrative.entryCount} reflektioner</span>
		</div>
		<h2>{narrative.overviewIntro}</h2>
		<p class="readiness">{narrative.readinessMessage}</p>
		{#if narrative.overview.length > 0}
			<div class="observation-list">
				{#each narrative.overview as item}
					<article class="observation-card">
						<h3>{item.title}</h3>
						<p>{item.description}</p>
						<span>{item.evidence}</span>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	{#if narrative.patterns.length > 0 || narrative.themes.length > 0}
		<section class="split-grid">
			{#if narrative.patterns.length > 0}
				<article class="insight-panel">
					<div class="section-kicker">Personliga mönster</div>
					<h2>Mönster jag ser</h2>
					<div class="claim-list">
						{#each narrative.patterns as item}
							<div class="claim-row">
								<strong>{item.title}</strong>
								<p>{item.description}</p>
							</div>
						{/each}
					</div>
				</article>
			{/if}

			{#if narrative.themes.length > 0}
				<article class="insight-panel">
					<div class="section-kicker">Återkommande teman</div>
					<h2>Det du ofta skriver om</h2>
					<div class="theme-grid">
						{#each narrative.themes as theme}
							<div class={`theme-chip ${theme.tone}`} style={`--weight:${theme.weight}`}>
								<span>{theme.label}</span>
								<small>{theme.count} gånger</small>
							</div>
						{/each}
					</div>
				</article>
			{/if}
		</section>
	{/if}

	{#if narrative.timeline.segments.length > 0}
		<section class="insight-panel timeline-panel">
			<div class="section-kicker">Utveckling över tid</div>
			<h2>{narrative.timeline.title}</h2>
			{#if narrative.timeline.summary}
				<p class="panel-lead">{narrative.timeline.summary}</p>
			{/if}
			<div class="timeline">
				{#each narrative.timeline.segments as segment}
					<article class="timeline-step">
						<div>
							<strong>{segment.label}</strong>
							<span>{segment.range} · {segment.entryCount} reflektioner</span>
						</div>
						<p>{segment.summary}</p>
					</article>
				{/each}
			</div>
		</section>
	{/if}

	{#if narrative.strengths.length > 0 || narrative.challenges.length > 0}
		<section class="split-grid">
			{#if narrative.strengths.length > 0}
				<article class="insight-panel strength-panel">
					<div class="section-kicker">Positiva förändringar</div>
					<h2>Det som blivit starkare</h2>
					<div class="soft-stack">
						{#each narrative.strengths as item}
							<div>
								<strong>{item.title}</strong>
								<p>{item.description}</p>
							</div>
						{/each}
					</div>
				</article>
			{/if}

			{#if narrative.challenges.length > 0}
				<article class="insight-panel challenge-panel">
					<div class="section-kicker">Varsamt att lägga märke till</div>
					<h2>Det här verkar fortfarande vara svårt</h2>
					<p class="panel-lead">Det här återkommer ibland. Det står här som mönster, inte som en dom.</p>
					<div class="soft-stack">
						{#each narrative.challenges as item}
							<div>
								<strong>{item.title}</strong>
								<p>{item.description}</p>
							</div>
						{/each}
					</div>
				</article>
			{/if}
		</section>
	{/if}

	{#if narrative.storyParagraphs.length > 0}
		<section class="insight-panel story-panel">
			<div class="section-kicker">AI-rapport</div>
			<h2>Din berättelse</h2>
			<div class="story-body">
				{#each narrative.storyParagraphs as paragraph}
					<p>{paragraph}</p>
				{/each}
			</div>
		</section>
	{/if}
{/if}

<style>
	.narrative-empty,
	.insight-panel {
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		background: var(--mp-card);
		box-shadow: var(--mp-shadow-soft, 0 14px 38px rgba(45, 55, 38, 0.08));
		backdrop-filter: blur(18px);
	}

	.narrative-empty {
		display: grid;
		gap: 1rem;
		place-items: center;
		min-height: 18rem;
		padding: clamp(2rem, 5vw, 4rem);
		text-align: center;
	}

	.narrative-empty p {
		margin: 0;
		max-width: 38rem;
		color: var(--mp-text-dim);
		font-size: clamp(1rem, 2vw, 1.16rem);
		line-height: 1.7;
	}

	.soft-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.72rem 1.1rem;
		background: rgba(255, 255, 252, 0.72);
		border: 1px solid var(--mp-card-border);
		color: var(--mp-text);
		font-weight: 700;
		text-decoration: none;
	}

	.insight-panel {
		padding: clamp(1.35rem, 2.4vw, 2.2rem);
	}

	.hero-panel {
		padding: clamp(1.7rem, 3.4vw, 3.25rem);
		background:
			radial-gradient(680px 320px at 96% 0%, rgba(218, 236, 203, 0.72), transparent 58%),
			linear-gradient(135deg, rgba(255, 255, 252, 0.9), rgba(244, 249, 237, 0.78));
	}

	.panel-meta,
	.section-kicker {
		color: var(--mp-lila-2);
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.panel-meta {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.insight-panel h2 {
		margin: 0;
		color: var(--mp-text);
		font-size: clamp(1.35rem, 2.5vw, 2rem);
		line-height: 1.15;
	}

	.hero-panel h2 {
		max-width: 46rem;
		font-size: clamp(1.8rem, 3.4vw, 3rem);
	}

	.readiness,
	.panel-lead {
		margin: 1rem 0 0;
		color: var(--mp-text-dim);
		font-size: 0.98rem;
		line-height: 1.65;
	}

	.observation-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.observation-card {
		border-radius: 20px;
		padding: 1.1rem;
		background: rgba(255, 255, 252, 0.66);
		border: 1px solid rgba(104, 132, 92, 0.14);
	}

	.observation-card h3,
	.claim-row strong,
	.soft-stack strong {
		display: block;
		color: var(--mp-text);
		font-size: 0.98rem;
		line-height: 1.35;
	}

	.observation-card p,
	.claim-row p,
	.soft-stack p,
	.timeline-step p,
	.story-body p {
		color: var(--mp-text-dim);
		line-height: 1.65;
	}

	.observation-card h3,
	.observation-card p,
	.claim-row p,
	.soft-stack p,
	.timeline-step p,
	.story-body p {
		margin: 0;
	}

	.observation-card p {
		margin-top: 0.45rem;
	}

	.observation-card span {
		display: block;
		margin-top: 0.8rem;
		color: color-mix(in srgb, var(--mp-text-dim) 78%, var(--mp-lila-2) 22%);
		font-size: 0.78rem;
		line-height: 1.45;
	}

	.split-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.15rem;
	}

	.claim-list,
	.soft-stack {
		display: grid;
		gap: 1rem;
		margin-top: 1.35rem;
	}

	.claim-row,
	.soft-stack > div {
		border-left: 3px solid rgba(111, 159, 112, 0.32);
		padding-left: 0.9rem;
	}

	.theme-grid {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.7rem;
		margin-top: 1.35rem;
	}

	.theme-chip {
		--chip-scale: calc(0.92rem + (var(--weight) * 0.32rem));
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		border-radius: 999px;
		padding: calc(0.5rem + (var(--weight) * 0.16rem)) calc(0.78rem + (var(--weight) * 0.3rem));
		background: rgba(238, 246, 226, 0.72);
		border: 1px solid rgba(104, 132, 92, 0.16);
		color: var(--mp-text);
		font-size: var(--chip-scale);
	}

	.theme-chip.warm {
		background: rgba(255, 244, 220, 0.82);
	}

	.theme-chip.steady {
		background: rgba(228, 240, 222, 0.82);
	}

	.theme-chip small {
		color: var(--mp-text-dim);
		font-size: 0.72em;
	}

	.timeline {
		display: grid;
		gap: 0.9rem;
		margin-top: 1.6rem;
	}

	.timeline-step {
		position: relative;
		display: grid;
		grid-template-columns: minmax(10rem, 0.35fr) minmax(0, 1fr);
		gap: 1rem;
		border-radius: 18px;
		padding: 1rem;
		background: rgba(255, 255, 252, 0.62);
		border: 1px solid rgba(104, 132, 92, 0.13);
	}

	.timeline-step strong,
	.timeline-step span {
		display: block;
	}

	.timeline-step strong {
		color: var(--mp-text);
	}

	.timeline-step span {
		margin-top: 0.25rem;
		color: var(--mp-text-dim);
		font-size: 0.8rem;
	}

	.strength-panel {
		background:
			radial-gradient(420px 220px at 100% 0%, rgba(214, 236, 198, 0.62), transparent 60%),
			var(--mp-card);
	}

	.challenge-panel {
		background:
			radial-gradient(420px 220px at 100% 0%, rgba(247, 230, 198, 0.54), transparent 60%),
			var(--mp-card);
	}

	.story-panel {
		padding: clamp(1.7rem, 3vw, 3rem);
		background:
			linear-gradient(180deg, rgba(255, 255, 252, 0.9), rgba(249, 247, 239, 0.82)),
			var(--mp-card);
	}

	.story-body {
		display: grid;
		gap: 1rem;
		margin-top: 1.5rem;
		max-width: 54rem;
	}

	.story-body p {
		color: color-mix(in srgb, var(--mp-text) 76%, var(--mp-text-dim) 24%);
		font-size: clamp(1rem, 1.2vw, 1.08rem);
	}

	@media (max-width: 880px) {
		.panel-meta,
		.split-grid,
		.observation-list,
		.timeline-step {
			grid-template-columns: 1fr;
		}

		.panel-meta {
			display: grid;
		}

		.hero-panel h2 {
			font-size: clamp(1.7rem, 10vw, 2.35rem);
		}
	}
</style>
