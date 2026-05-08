<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';

	type DashboardData = {
		diaryPreview: {
			id: string | null;
			snippet: string;
			dateLabel: string;
			hasEntry: boolean;
		};
		progressPreview: {
			currentStreak: number;
			weeklyEntries: number;
			totalEntries: number;
			summary: string;
		};
		settingsPreview: {
			displayName: string | null;
			themeLabel: string;
			weeklyGoalLabel: string;
			dashboardFocusLabel: string;
		};
	};

	let { data } = $props<{ data: DashboardData }>();

	const diaryPreview = $derived(data.diaryPreview);
	const progressPreview = $derived(data.progressPreview);
	const settingsPreview = $derived(data.settingsPreview);
	const primaryDiaryCtaLabel = $derived(diaryPreview.hasEntry ? 'Fortsätt från senast' : 'Börja i dagboken');
</script>

<SEO canonical="https://www.mittpsyke.se/dashboard" />

<main class="auth-page">
	<PortalSubnav
		active="dashboard"
		title="Min portal"
		description="Här finns dina viktigaste delar samlade i en lugn och tydlig översikt."
	/>

	<div class="auth-shell">
		<section class="auth-panel dashboard-return" aria-label="Fortsätt där du var">
			<div class="return-intro">
				<p class="portal-status-kicker">Din plats just nu</p>
				<h2>Välkommen tillbaka</h2>
				<p>
					Du behöver inte veta exakt vad du känner. Börja med en rad, eller fortsätt där du slutade.
				</p>
				<div class="return-actions">
					<a href="/dagbok/checkin#senaste-inlagg" class="auth-button primary">Fortsätt skriva</a>
					<a href="/dagbok/checkin#skriv-sjalv" class="auth-button">Skriv nytt avtryck</a>
				</div>
			</div>

			<div class="return-panels">
				<article class="return-card latest-entry">
					<p class="portal-card-kicker">Senaste dagboksrad</p>
					{#if diaryPreview.hasEntry}
						{#if diaryPreview.dateLabel}
							<p class="portal-meta">{diaryPreview.dateLabel}</p>
						{/if}
						<p class="return-preview">{diaryPreview.snippet}</p>
						<a href="/dagbok/checkin#senaste-inlagg" class="auth-button">Fortsätt från senast</a>
					{:else}
						<p class="return-preview">
							Din dagbok väntar stilla. Ett första avtryck kan vara en enda rad.
						</p>
						<a href="/dagbok/checkin#skriv-sjalv" class="auth-button">Börja skriva</a>
					{/if}
				</article>

				<article class="return-card daily-question">
					<p class="portal-card-kicker">Dagens fråga</p>
					<h3>Vad har tagit mest energi från dig idag?</h3>
					<p class="portal-subtle">
						Svara kort eller långt. Det räcker att börja där du är.
					</p>
					<a href="/dagbok/checkin#skriv-sjalv" class="auth-button">Svara i dagboken</a>
				</article>
			</div>
		</section>

		<section class="portal-grid" aria-label="Snabb översikt">
			<article class="auth-panel portal-card">
				<div class="portal-card-head">
					<p class="portal-card-kicker">Dagbok</p>
					{#if diaryPreview.hasEntry && diaryPreview.dateLabel}
						<span class="portal-meta">{diaryPreview.dateLabel}</span>
					{/if}
				</div>
				<h2>{diaryPreview.hasEntry ? 'Fortsätt där du var' : 'Börja med ett par ord'}</h2>
				<p class="portal-copy">{diaryPreview.snippet}</p>
				{#if diaryPreview.hasEntry}
					<p class="portal-subtle">Din dagbok sparar det viktigaste, så att du kan plocka upp tråden senare.</p>
				{/if}
				<a href="/dagbok/checkin" class="auth-button">{primaryDiaryCtaLabel}</a>
			</article>

			<article class="auth-panel portal-card">
				<div class="portal-card-head">
					<p class="portal-card-kicker">Framsteg</p>
					<span class="portal-meta">
						{progressPreview.currentStreak} dag{progressPreview.currentStreak === 1 ? '' : 'ar'} i följd
					</span>
				</div>
				<h2>Små steg som syns</h2>
				<p class="portal-copy">{progressPreview.summary}</p>
				<div class="portal-stat-row" aria-label="Sammanfattning av framsteg">
					<span>{progressPreview.weeklyEntries} denna vecka</span>
					<span>{progressPreview.totalEntries} totalt</span>
				</div>
				<a href="/framsteg" class="auth-button">Se framsteg</a>
			</article>

			<article class="auth-panel portal-card">
				<div class="portal-card-head">
					<p class="portal-card-kicker">Inställningar</p>
					<span class="portal-meta">{settingsPreview.themeLabel}</span>
				</div>
				<h2>Det som formar din portal</h2>
				<p class="portal-copy">
					Mål: {settingsPreview.weeklyGoalLabel}. Fokus på startsidan: {settingsPreview.dashboardFocusLabel}.
				</p>
				<a href="/dashboard/installningar" class="auth-button">Öppna inställningar</a>
			</article>
		</section>
	</div>
</main>

<style>
	.portal-status-kicker,
	.portal-card-kicker {
		margin: 0;
		font-size: 0.76rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.dashboard-return {
		position: relative;
		display: grid;
		gap: 1rem;
		overflow: hidden;
		padding: clamp(1.15rem, 2.5vw, 1.7rem);
		border-color: rgba(96, 165, 250, 0.28);
		background:
			radial-gradient(circle at 86% 10%, rgba(96, 165, 250, 0.18), transparent 34%),
			linear-gradient(135deg, hsl(222 47% 13%), hsl(224 36% 18%) 62%, hsl(230 30% 16%));
		color: hsl(210 40% 98%);
		box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14);
	}

	.dashboard-return::before {
		content: '✎';
		position: absolute;
		top: 1rem;
		right: 1.1rem;
		font-size: 1.2rem;
		color: rgba(191, 219, 254, 0.62);
		pointer-events: none;
	}

	.return-intro {
		position: relative;
		max-width: 46rem;
	}

	.return-intro h2,
	.portal-card h2 {
		margin: 0.4rem 0 0;
		font-size: 1.15rem;
	}

	.return-intro h2 {
		font-size: clamp(1.45rem, 1.15rem + 1vw, 2rem);
	}

	.return-intro p:not(.portal-status-kicker) {
		margin: 0.45rem 0 0;
		max-width: 44rem;
		color: hsl(214 32% 86% / 0.9);
	}

	.dashboard-return .portal-status-kicker,
	.dashboard-return .portal-card-kicker,
	.dashboard-return .portal-meta,
	.dashboard-return .portal-subtle {
		color: hsl(214 32% 86% / 0.78);
	}

	.return-actions {
		margin-top: 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.return-panels {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(240px, 0.85fr);
		gap: 0.75rem;
	}

	.return-card {
		display: grid;
		gap: 0.7rem;
		align-content: start;
		padding: 0.9rem;
		border: 1px solid rgba(147, 197, 253, 0.24);
		border-radius: var(--radius-input);
		background: rgba(15, 23, 42, 0.42);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
	}

	.return-card h3 {
		margin: 0;
		font-size: 1.02rem;
		line-height: 1.35;
	}

	.return-preview {
		margin: 0;
		line-height: 1.65;
		color: hsl(210 40% 96%);
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.dashboard-return .auth-button:not(.primary) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(191, 219, 254, 0.24);
		color: hsl(210 40% 96%);
	}

	.dashboard-return .auth-button:not(.primary):hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(191, 219, 254, 0.38);
	}

	.portal-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.portal-card {
		display: grid;
		gap: 0.85rem;
		align-content: start;
		min-height: 100%;
		min-width: 0;
		overflow: hidden;
	}

	.portal-card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.portal-meta,
	.portal-subtle,
	.portal-stat-row {
		color: hsl(var(--muted-foreground));
		font-size: 0.92rem;
	}

	.portal-copy {
		margin: 0;
		line-height: 1.6;
		max-width: 100%;
		white-space: normal;
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.portal-subtle {
		margin: -0.35rem 0 0;
	}

	.portal-stat-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	@media (max-width: 760px) {
		.return-panels {
			grid-template-columns: 1fr;
		}

		.return-actions .auth-button,
		.return-card .auth-button {
			width: 100%;
		}

		.portal-grid {
			grid-template-columns: 1fr;
		}

		.portal-card-head {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
