<script lang="ts">
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
		communityPreview: {
			id: string | null;
			snippet: string;
			dateLabel: string;
			replyCount: number | null;
			hasActivity: boolean;
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
	const communityPreview = $derived(data.communityPreview);
	const settingsPreview = $derived(data.settingsPreview);
	const introName = $derived(settingsPreview.displayName ? `, ${settingsPreview.displayName}` : '');
	const continuityText = $derived(
		diaryPreview.hasEntry && diaryPreview.dateLabel
			? `Senast sparade du i dagboken ${diaryPreview.dateLabel}. Allt finns kvar när du vill fortsätta.`
			: 'Här kan du börja skapa en egen rytm i lugn och ro, med små steg som går att återvända till.'
	);
	const nextStepText = $derived(
		diaryPreview.hasEntry
			? 'Nästa lilla steg kan vara att öppna dagboken och fortsätta med några ord.'
			: 'Nästa lilla steg kan vara att skriva några ord i dagboken och spara dem till senare.'
	);
	const primaryDiaryCtaLabel = $derived(diaryPreview.hasEntry ? 'Fortsätt i dagboken' : 'Börja i dagboken');
</script>

<main class="auth-page">
	<PortalSubnav
		active="dashboard"
		title="Min portal"
		description="Här finns dina viktigaste delar samlade i en lugn och tydlig översikt."
	/>

	<div class="auth-shell">
		<section class="auth-panel auth-panel-accent portal-status" aria-label="Portalöversikt">
			<p class="portal-status-kicker">Du är här nu</p>
			<h2>Min portal{introName}</h2>
			<p>
				Här ser du små glimtar av dagbok, framsteg, gemenskap och inställningar utan att något tar över.
			</p>
			<p class="portal-status-note">{continuityText}</p>
			<div class="portal-status-actions">
				<a href="/dagbok" class="auth-button primary">{primaryDiaryCtaLabel}</a>
				<p class="portal-subtle">{nextStepText}</p>
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
				<h2>Fortsätt där du var</h2>
				<p class="portal-copy">{diaryPreview.snippet}</p>
				{#if diaryPreview.hasEntry}
					<p class="portal-subtle">Din dagbok sparar det viktigaste, så att du kan plocka upp tråden senare.</p>
				{/if}
				<a href="/dagbok" class="auth-button">{primaryDiaryCtaLabel}</a>
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
					<p class="portal-card-kicker">Gemenskap</p>
					{#if communityPreview.hasActivity && communityPreview.dateLabel}
						<span class="portal-meta">{communityPreview.dateLabel}</span>
					{/if}
				</div>
				<h2>Det rör sig stilla</h2>
				<p class="portal-copy">{communityPreview.snippet}</p>
				{#if communityPreview.hasActivity && communityPreview.replyCount !== null}
					<p class="portal-subtle">
						{communityPreview.replyCount} svar i tråden just nu
					</p>
				{/if}
				<a href="/dashboard/gemenskap" class="auth-button">Till gemenskapen</a>
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
	.portal-status {
		padding: 1.15rem;
	}

	.portal-status-kicker,
	.portal-card-kicker {
		margin: 0;
		font-size: 0.76rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.portal-status h2,
	.portal-card h2 {
		margin: 0.4rem 0 0;
		font-size: 1.15rem;
	}

	.portal-status > p:not(.portal-status-kicker) {
		margin: 0.45rem 0 0;
		color: hsl(var(--muted-foreground));
	}

	.portal-status-note {
		max-width: 50rem;
	}

	.portal-status-actions {
		margin-top: 0.85rem;
		display: grid;
		gap: 0.5rem;
		justify-items: start;
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
