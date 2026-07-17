<script lang="ts">
	import { enhance } from '$app/forms';
	import SEO from '$lib/components/SEO.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const statusLabels: Record<string, string> = {
		new: 'Nytt',
		reviewed: 'Granskat',
		approved: 'Godkänt',
		ignored: 'Ignorerat',
		article_idea: 'Artikelidé',
		development_task: 'Utvecklingsuppgift'
	};

	function formatDate(value: string | null) {
		if (!value) return '–';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '–';
		return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
	}

	function sourceLabel(source: { provider: string; name: string }) {
		return source.name === source.provider ? source.provider : `${source.provider} · ${source.name}`;
	}
</script>

<SEO canonical="https://www.mittpsyke.se/admin/radar" />

<svelte:head>
	<title>Radar | Admin | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="radar-shell">
	<header class="hero">
		<div>
			<p class="eyebrow">MittPsyke Admin</p>
			<h1>Radar</h1>
			<p>En lugn överblick över relevanta teknik- och forskningsflöden.</p>
		</div>
		<a href="/admin">Till adminöversikt</a>
	</header>

	<p class="privacy-note">Radarn följer externa, godkända källor. Den läser inte MittPsykes sidor, användardata eller samtal.</p>

	{#if data.schemaError}
		<p class="notice error">{data.schemaError}</p>
	{/if}
	{#if form?.error}
		<p class="notice error">{form.error}</p>
	{:else if form?.success}
		<p class="notice success">{form.success}</p>
	{/if}

	<section class="overview" aria-label="Radarns läge">
		<div class="metric"><span>Aktiva källor</span><strong>{data.sources.filter((source) => source.enabled).length}</strong></div>
		<div class="metric"><span>Sparade fynd</span><strong>{data.findings.length}</strong></div>
		<div class="metric"><span>Senaste körning</span><strong>{data.runs[0]?.status === 'completed' ? 'Klar' : data.runs[0]?.status ?? '–'}</strong></div>
	</section>

	<section class="section">
		<div class="section-heading"><h2>Senaste fynd</h2><p>Välj en lugn nästa hantering för varje fynd.</p></div>
		{#if data.findings.length === 0}
			<p class="notice">Inga fynd ännu. De visas här efter nästa körning.</p>
		{:else}
			<div class="finding-list">
				{#each data.findings as finding}
					<article class="finding-card">
						<div class="finding-head">
							<div><p class="meta">{finding.provider ?? 'Okänd källa'} · {formatDate(finding.published_at)}</p><h3><a href={finding.url} target="_blank" rel="noreferrer">{finding.title}</a></h3></div>
							<span class:official={finding.source_is_official} class="source-badge">{finding.source_is_official ? 'Officiell källa' : 'Forskningsflöde'}</span>
						</div>
						{#if finding.summary}<p>{finding.summary}</p>{/if}
						{#if finding.why_it_matters}<p class="matters"><strong>Varför det kan vara relevant:</strong> {finding.why_it_matters}</p>{/if}
						<form method="POST" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={finding.id} />
							<label><span>Hantering</span><select name="status" value={finding.status}>{#each Object.entries(statusLabels) as [value, label]}<option {value}>{label}</option>{/each}</select></label>
							<button>Spara</button>
							<span class="score">Relevans {finding.relevance_score ?? '–'} / 100</span>
						</form>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<div class="two-columns">
		<section class="section"><div class="section-heading"><h2>Källor</h2><p>Endast godkända externa flöden.</p></div><ul class="compact-list">{#each data.sources as source}<li><div><strong>{sourceLabel(source)}</strong><span>{source.category}</span></div><span>{source.enabled ? 'Aktiv' : 'Pausad'} · kontrollerad {formatDate(source.last_checked_at)}</span></li>{/each}</ul></section>
		<section class="section"><div class="section-heading"><h2>Körningar</h2><p>Dagligen 06:15 UTC.</p></div><ul class="compact-list">{#each data.runs as run}<li><div><strong>{run.status === 'completed' ? 'Genomförd' : run.status}</strong><span>{formatDate(run.started_at)}</span></div><span>{run.sources_checked} källor · {run.findings_saved} sparade</span></li>{/each}</ul></section>
	</div>
</main>

<style>
	.radar-shell { width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
	.hero, .finding-head, .two-columns, .overview, form, .compact-list li { display: flex; gap: 1rem; }
	.hero { flex-wrap: wrap; justify-content: space-between; align-items: end; margin-bottom: 1.25rem; }
	.hero a { text-decoration: underline; text-underline-offset: .2em; }
	.hero p, .section-heading p, .meta, .privacy-note, .compact-list span { color: var(--color-text-muted); }
	.eyebrow { margin-bottom: .25rem; font-size: .8rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
	.privacy-note, .notice { border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-surface); padding: .9rem 1rem; color: var(--color-text-muted); }
	.notice.error { color: var(--color-danger); } .notice.success { color: var(--color-success); }
	.overview { display: grid; grid-template-columns: repeat(3, 1fr); margin: 1rem 0 2rem; }
	.metric, .finding-card, .section { border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-surface); padding: 1rem; }
	.metric span, label span, .compact-list span { display: block; font-size: .85rem; } .metric strong { display: block; margin-top: .25rem; font-size: 1.55rem; }
	.section { margin-top: 1rem; } .section-heading { margin-bottom: 1rem; } .section-heading h2 { margin: 0; }
	.finding-list { display: grid; gap: .75rem; } .finding-head { justify-content: space-between; align-items: start; }
	.finding-card h3 { margin: .2rem 0 .7rem; font-size: 1.05rem; } .finding-card h3 a { text-decoration: none; } .finding-card h3 a:hover { text-decoration: underline; }
	.finding-card > p { line-height: 1.55; } .matters { color: var(--color-text-muted); }
	.source-badge { border: 1px solid var(--color-border); border-radius: 999px; padding: .3rem .55rem; color: var(--color-text-muted); font-size: .78rem; white-space: nowrap; }
	.source-badge.official { border-color: var(--color-primary); color: var(--color-primary); }
	form { flex-wrap: wrap; align-items: end; margin-top: 1rem; } select, button { border-radius: .6rem; padding: .55rem .65rem; font: inherit; } select { border: 1px solid var(--color-border); background: var(--color-surface); } button { border: 0; background: var(--color-primary); color: white; font-weight: 700; cursor: pointer; } .score { color: var(--color-text-muted); font-size: .85rem; padding-bottom: .55rem; }
	.two-columns { display: grid; grid-template-columns: repeat(2, 1fr); } .compact-list { margin: 0; padding: 0; list-style: none; } .compact-list li { justify-content: space-between; padding: .75rem 0; border-top: 1px solid var(--color-border); font-size: .9rem; } .compact-list li:first-child { border-top: 0; padding-top: 0; }
	@media (max-width: 700px) { .overview, .two-columns { grid-template-columns: 1fr; } .finding-head, .compact-list li { display: block; } .source-badge { display: inline-block; margin-top: .4rem; } }
</style>
