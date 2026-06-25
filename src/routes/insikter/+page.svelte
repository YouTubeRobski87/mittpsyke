<script lang="ts">
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { supabase } from '$lib/supabase';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { browser } from '$app/environment';
	import { Calendar, TrendingUp, TrendingDown, Heart, Lightbulb } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	const iconMap: Record<string, ComponentType> = {
		calendar: Calendar,
		'trending-up': TrendingUp,
		'trending-down': TrendingDown,
		heart: Heart,
		lightbulb: Lightbulb
	};

	type InsightItem = { type: string; title: string; description: string; icon: string };
	type InsightDay = { day: string; average: number; count: number };
	type InsightsResponse = {
		insights: InsightItem[];
		bestDay: InsightDay | null;
		worstDay: InsightDay | null;
		aiSummary: string | null;
	};

	let insights = $state<InsightsResponse | null>(null);
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
			insights = (await res.json()) as InsightsResponse;
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
		<Sidebar active="insikter" />

		<main class="main">
			<header class="page-header">
				<div>
					<div class="kicker">AI-analys av dagboken</div>
					<h1>Insiktsgenerering</h1>
					<p class="lead">Mönster, teman och reflektioner från dina dagboksrader.</p>
				</div>
			</header>

			{#if !hasConsent}
				<div class="consent-card">
					<h2>AI-insikter kräver ditt samtycke</h2>
					<p>
						För att generera insikter behöver vi analysera innehållet i dina dagboksrader med AI.
						Datan används bara för din analys och skickas inte vidare.
					</p>
					<button class="btn btn-primary" onclick={acceptConsent}>Jag godkänner — visa insikter</button>
				</div>
			{:else if loading}
				<div class="loading-grid">
					{#each [0, 1, 2, 3] as _}
						<div class="skeleton-card"></div>
					{/each}
				</div>
			{:else if error}
				<div class="error-card">{error}</div>
			{:else if !insights || (insights.insights.length === 0 && !insights.aiSummary)}
				<div class="empty-card">
					<p>Skriv i dagboken ett tag så kan vi visa dina personliga insikter här.</p>
					<a href="/dagbok/checkin#skriv-sjalv" class="btn btn-primary">Skriv i dagboken</a>
				</div>
			{:else}
				{#if insights.aiSummary}
					<section class="ai-summary">
						<div class="section-title">AI-sammanfattning</div>
						<blockquote>{insights.aiSummary}</blockquote>
					</section>
				{/if}

				{#if insights.bestDay || insights.worstDay}
					<section class="day-cards">
						{#if insights.bestDay}
							<div class="day-card best">
								<p class="day-label">Bästa dagen</p>
								<h3>{insights.bestDay.day}</h3>
								<p>Snittstämning {insights.bestDay.average.toFixed(1)} · {insights.bestDay.count} inlägg</p>
							</div>
						{/if}
						{#if insights.worstDay}
							<div class="day-card worst">
								<p class="day-label">Tyngsta dagen</p>
								<h3>{insights.worstDay.day}</h3>
								<p>Snittstämning {insights.worstDay.average.toFixed(1)} · {insights.worstDay.count} inlägg</p>
							</div>
						{/if}
					</section>
				{/if}

				{#if insights.insights.length > 0}
					<section class="insights-grid">
						<div class="section-title">Mönster</div>
						<div class="grid">
							{#each insights.insights as item}
								<article class="insight-card">
									<span class="ico">
									<svelte:component this={iconMap[item.icon] ?? Lightbulb} size={22} />
								</span>
									<h3>{item.title}</h3>
									<p>{item.description}</p>
								</article>
							{/each}
						</div>
					</section>
				{/if}
			{/if}
		</main>
	</div>
</div>

<style>
	.mp-dashboard {
		--mp-lila: #a882ff;
		--mp-lila-2: #7c5cff;
		--mp-card: rgba(255, 255, 255, 0.04);
		--mp-card-border: rgba(168, 130, 255, 0.14);
		--mp-text: #e8e6f0;
		--mp-text-dim: #9a98ad;
		--mp-radius: 18px;

		color: var(--mp-text);
		min-height: 100vh;
		padding: 28px;
		background:
			radial-gradient(1200px 600px at 80% -10%, rgba(124, 92, 255, 0.18), transparent 60%),
			radial-gradient(900px 500px at 10% 110%, rgba(168, 130, 255, 0.14), transparent 55%),
			linear-gradient(160deg, #0a0a14, #11101f 60%, #0d0b1a);
	}
	.shell {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 248px 1fr;
		gap: 24px;
	}
	.main { display: flex; flex-direction: column; gap: 24px; }

	.page-header {
		background: var(--mp-card);
		border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius);
		padding: 26px 28px;
		backdrop-filter: blur(14px);
	}
	.kicker {
		font-size: 0.76rem; letter-spacing: 0.06em;
		text-transform: uppercase; color: var(--mp-lila); margin-bottom: 4px;
	}
	.page-header h1 { font-size: 1.7rem; margin: 0 0 4px; font-weight: 700; }
	.lead { font-size: 0.88rem; color: var(--mp-text-dim); margin: 0; }

	.section-title {
		font-size: 0.78rem; letter-spacing: 0.08em;
		text-transform: uppercase; color: var(--mp-text-dim); margin-bottom: 14px;
	}

	.btn {
		display: inline-flex; align-items: center;
		padding: 10px 18px; border-radius: 11px;
		font-size: 0.88rem; font-weight: 600;
		text-decoration: none; border: none; cursor: pointer;
	}
	.btn-primary {
		background: linear-gradient(135deg, var(--mp-lila-2), var(--mp-lila)); color: #fff;
	}

	/* Samtycke */
	.consent-card {
		background: var(--mp-card); border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius); padding: 32px;
		display: flex; flex-direction: column; gap: 16px;
	}
	.consent-card h2 { margin: 0; font-size: 1.1rem; }
	.consent-card p { margin: 0; color: var(--mp-text-dim); line-height: 1.6; font-size: 0.9rem; }

	/* Tom */
	.empty-card {
		background: var(--mp-card); border: 1px solid var(--mp-card-border);
		border-radius: var(--mp-radius); padding: 48px;
		text-align: center; display: flex; flex-direction: column;
		align-items: center; gap: 16px;
	}
	.empty-card p { color: var(--mp-text-dim); margin: 0; }

	/* Fel */
	.error-card {
		background: var(--mp-card); border: 1px solid rgba(255,100,100,0.2);
		border-radius: var(--mp-radius); padding: 20px;
		color: hsl(39 92% 82%); font-size: 0.9rem;
	}

	/* Skeleton */
	.loading-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 18px; }
	.skeleton-card {
		height: 130px; border-radius: var(--mp-radius);
		background: linear-gradient(90deg,
			rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04));
		background-size: 200% 100%;
		animation: shimmer 1.3s ease-in-out infinite;
	}
	@keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }

	/* AI-sammanfattning */
	.ai-summary {
		background: linear-gradient(135deg, rgba(124,92,255,0.12), rgba(168,130,255,0.04));
		border: 1px solid rgba(168,130,255,0.25);
		border-radius: var(--mp-radius); padding: 24px;
	}
	.ai-summary blockquote {
		margin: 0; font-size: 1rem; line-height: 1.65;
		font-style: italic; color: var(--mp-text);
	}

	/* Bästa/sämsta dag */
	.day-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
	.day-card {
		border-radius: var(--mp-radius); padding: 20px;
		border: 1px solid var(--mp-card-border);
		display: flex; flex-direction: column; gap: 6px;
	}
	.day-card.best { background: rgba(100,200,120,0.06); border-color: rgba(100,200,120,0.2); }
	.day-card.worst { background: rgba(200,100,100,0.06); border-color: rgba(200,100,100,0.15); }
	.day-label { font-size: 0.75rem; letter-spacing: .05em; text-transform: uppercase; color: var(--mp-text-dim); margin: 0; }
	.day-card h3 { margin: 0; font-size: 1.2rem; }
	.day-card p { margin: 0; font-size: 0.82rem; color: var(--mp-text-dim); }

	/* Insiktskort */
	.insights-grid { display: flex; flex-direction: column; gap: 0; }
	.grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
	.insight-card {
		background: var(--mp-card); border: 1px solid var(--mp-card-border);
		border-radius: 14px; padding: 18px;
		display: flex; flex-direction: column; gap: 8px;
	}
	.ico { font-size: 1.5rem; }
	.insight-card h3 { margin: 0; font-size: 0.95rem; }
	.insight-card p { margin: 0; font-size: 0.84rem; color: var(--mp-text-dim); line-height: 1.5; }

	@media (max-width: 880px) {
		.shell { grid-template-columns: 1fr; }
		.day-cards { grid-template-columns: 1fr; }
		.grid { grid-template-columns: 1fr; }
		.loading-grid { grid-template-columns: 1fr; }
	}
</style>
