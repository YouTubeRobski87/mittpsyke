<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import DiaryNarrativeInsights, {
		type DiaryNarrativeInsightViewModel
	} from '$lib/components/DiaryNarrativeInsights.svelte';
	import { supabase } from '$lib/supabase';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';

	type InsightsResponse = {
		narrative?: DiaryNarrativeInsightViewModel;
	};

	let narrative = $state<DiaryNarrativeInsightViewModel | null>(null);
	let loading = $state(false);
	let error = $state('');
	let hasConsent = $state(browser ? hasSensitiveConsent() : false);

	async function loadInsights() {
		loading = true;
		error = '';
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (!session) return;

			const res = await fetch('/api/diary/insights', {
				headers: {
					Authorization: `Bearer ${session.access_token}`,
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
				}
			});
			if (!res.ok) {
				const payload = (await res.json().catch(() => ({}))) as { error?: string };
				error = payload.error ?? 'Kunde inte hämta insikter.';
				return;
			}
			const payload = (await res.json()) as InsightsResponse;
			narrative = payload.narrative ?? null;
		} catch {
			error = 'Kunde inte hämta insikter just nu.';
		} finally {
			loading = false;
		}
	}

	function acceptConsent() {
		grantSensitiveConsent();
		hasConsent = true;
		void loadInsights();
	}

	onMount(() => {
		if (hasConsent) void loadInsights();
	});
</script>

<div class="mp-dashboard">
	<div class="shell">
		<main class="main">
			<header class="page-header">
				<div>
					<div class="kicker">AI-insikter</div>
					<h1>Insikter</h1>
					<p class="lead">Personliga mönster, teman och förändringar som bara visas när de stöds av din dagbok.</p>
				</div>
			</header>

			{#if !hasConsent}
				<section class="consent-card">
					<h2>AI-insikter kräver ditt samtycke</h2>
					<p>
						För att hitta mönster behöver MittPsyke analysera innehållet i dina dagboksrader med AI.
						Analysen visas bara för dig och bygger på dina egna reflektioner.
					</p>
					<button class="btn btn-primary" onclick={acceptConsent}>Jag godkänner – visa insikter</button>
				</section>
			{:else if loading}
				<div class="loading-grid">
					{#each [0, 1, 2, 3] as _}
						<div class="skeleton-card"></div>
					{/each}
				</div>
			{:else if error}
				<div class="error-card">{error}</div>
			{:else}
				<DiaryNarrativeInsights {narrative} />
			{/if}
		</main>
	</div>
</div>

<style>
	.mp-dashboard {
		--mp-lila: #6f9f70;
		--mp-lila-2: #2f6f46;
		--mp-card: rgba(255, 255, 252, 0.84);
		--mp-card-border: rgba(104, 132, 92, 0.16);
		--mp-text: #20251f;
		--mp-text-dim: #687163;
		--mp-radius: 24px;
		--mp-surface: #fbfaf5;
		--mp-shadow-soft: 0 8px 26px rgba(58, 75, 48, 0.07);

		color: var(--mp-text);
		min-height: 100vh;
		padding: 34px;
		background:
			radial-gradient(900px 520px at 84% -10%, rgba(222, 238, 206, 0.84), transparent 62%),
			radial-gradient(760px 460px at 8% 110%, rgba(247, 226, 190, 0.46), transparent 58%),
			linear-gradient(160deg, var(--mp-surface), #f7f4ec 58%, #eef4e8);
	}

	.shell {
		max-width: 1040px;
		margin: 0 auto;
		display: block;
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.page-header,
	.consent-card,
	.error-card {
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		box-shadow: var(--mp-shadow-soft);
		backdrop-filter: blur(18px);
	}

	.page-header {
		padding: 30px 32px;
	}

	.kicker {
		margin-bottom: 8px;
		color: var(--mp-lila-2);
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.page-header h1 {
		font-size: clamp(2rem, 3vw, 2.7rem);
		line-height: 1.05;
		margin: 0 0 10px;
		font-weight: 800;
	}

	.lead {
		max-width: 48rem;
		font-size: 0.98rem;
		color: var(--mp-text-dim);
		line-height: 1.65;
		margin: 0;
	}

	.consent-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		padding: clamp(1.5rem, 4vw, 2.5rem);
	}

	.consent-card h2 {
		margin: 0;
		font-size: 1.35rem;
	}

	.consent-card p {
		margin: 0;
		max-width: 48rem;
		color: var(--mp-text-dim);
		line-height: 1.7;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 999px;
		padding: 0.8rem 1.2rem;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--mp-lila-2), #72a76d);
		color: #fff;
		box-shadow: 0 10px 24px rgba(47, 111, 70, 0.18);
	}

	.error-card {
		padding: 20px;
		color: #8a5f17;
		font-size: 0.9rem;
	}

	.loading-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 18px;
	}

	.skeleton-card {
		height: 180px;
		border-radius: var(--mp-radius);
		background: linear-gradient(90deg, rgba(222, 232, 213, 0.5), rgba(255, 255, 255, 0.78), rgba(222, 232, 213, 0.5));
		background-size: 200% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}

	@keyframes shimmer {
		from { background-position: 100% 0; }
		to { background-position: -100% 0; }
	}

	@media (max-width: 880px) {
		.mp-dashboard {
			padding: 18px;
		}

		.shell,
		.loading-grid {
			grid-template-columns: 1fr;
		}

		.main {
			gap: 24px;
		}

		.page-header {
			padding: 26px;
		}
	}
</style>
