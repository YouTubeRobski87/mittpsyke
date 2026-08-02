<script lang="ts">
	import { enhance } from '$app/forms';
	import SEO from '$lib/components/SEO.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const statusLabels: Record<string, string> = { new: 'Nytt', reviewed: 'Granskat', approved: 'Godkänt', ignored: 'Ignorerat', article_idea: 'Artikelidé', development_task: 'Utvecklingsuppgift' };

	function nextStepLabel(action: string | null) {
		return ({ agera_nu: 'Agera nu', testa_i_sandbox: 'Testa lugnt', bevaka: 'Bevaka', ignorera: 'Ignorera' } as Record<string, string>)[action ?? ''] ?? 'Ignorera';
	}
	function toDate(value: string | null) {
		if (!value) return null;
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	function formatDate(value: string | null) {
		const date = toDate(value);
		return date ? new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(date) : '–';
	}
	// Körningar och källkontroller sker flera gånger per dygn, så klockslaget
	// behövs där. Fynd visas med enbart datum eftersom flödenas tider är brus.
	function formatDateTime(value: string | null) {
		const date = toDate(value);
		return date
			? new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
			: '–';
	}
	function sourceLabel(source: { provider: string; name: string }) {
		return source.name === source.provider ? source.provider : `${source.provider} · ${source.name}`;
	}
</script>

<SEO canonical="https://www.mittpsyke.se/admin/radar" />
<svelte:head><title>Radar | Admin | MittPsyke</title><meta name="robots" content="noindex, nofollow" /></svelte:head>

<main class="radar-shell">
	<header class="hero">
		<div><p class="eyebrow">MittPsyke Admin</p><h1>Radar</h1><p>En lugn överblick över relevanta teknik- och forskningsflöden.</p></div>
		<a href="/admin">Till adminöversikt</a>
	</header>
	<p class="privacy-note">Radarn följer externa, godkända källor. Den läser inte MittPsykes sidor, användardata eller samtal.</p>
	{#if data.schemaError}<p class="notice error">{data.schemaError}</p>{/if}
	{#if form?.error}<p class="notice error">{form.error}</p>{:else if form?.success}<p class="notice success">{form.success}</p>{/if}

	<section class="overview" aria-label="Radarns läge">
		<div class="metric"><span>Aktiva källor</span><strong>{data.sources.filter((source) => source.enabled).length}</strong></div>
		<div class="metric"><span>Sparade fynd</span><strong>{data.findings.length}</strong></div>
		<div class="metric"><span>Senaste körning</span><strong>{data.runs[0]?.status === 'completed' ? 'Klar' : data.runs[0]?.status ?? '–'}</strong></div>
	</section>

	<section class="section">
		<div class="section-heading"><h2>Senaste fynd</h2><p>Här visas nyheter utifrån när de publicerades. Äldre fynd är tydligt arkiverade.</p></div>
		{#if data.findings.length === 0}
			<p class="notice">Inga fynd ännu. De visas här efter nästa körning.</p>
		{:else}
			<div class="finding-list">
				{#each data.findings as finding}
					<article class:archived={finding.archived} class="finding-card">
						<div class="finding-head">
							<div class="heading-content"><p class="meta">{finding.provider ?? 'Okänd källa'} · {formatDate(finding.published_at)}</p><h3><a href={finding.url} target="_blank" rel="noreferrer">{finding.title}</a></h3></div>
							<div class="badges"><span class:official={finding.source_is_official} class="source-badge">{finding.source_is_official ? 'Officiell källa' : 'Forskningsflöde'}</span>{#if finding.archived}<span class="source-badge">Arkiverat</span>{/if}</div>
						</div>
						<p class:act-now={finding.recommended_action === 'agera_nu'} class:test={finding.recommended_action === 'testa_i_sandbox'} class:watch={finding.recommended_action === 'bevaka'} class:ignore={finding.recommended_action === 'ignorera'} class="next-step">{nextStepLabel(finding.recommended_action)}</p>
						{#if finding.summary}<p class="summary clamp">{finding.summary}</p>{/if}
						{#if finding.why_it_matters || finding.project_use}<p class="matters clamp"><strong>Varför det kan vara relevant:</strong> {finding.why_it_matters ?? finding.project_use}</p>{/if}
						<form class="handling-form" method="POST" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={finding.id} />
							<label><span>Hantering</span><select name="status" value={finding.status}>{#each Object.entries(statusLabels) as [value, label]}<option {value}>{label}</option>{/each}</select></label>
							<button>Spara</button>
							<div class="scores"><span>Relevans {finding.relevance_score ?? '–'} / 100</span><span>Underlag {finding.confidence_score ?? '–'} / 100</span></div>
						</form>
						{#if finding.summary || finding.why_it_matters || finding.project_use}
							<details class="more"><summary>Visa mer</summary>{#if finding.summary}<p><strong>Sammanfattning:</strong> {finding.summary}</p>{/if}{#if finding.why_it_matters}<p><strong>Varför relevant:</strong> {finding.why_it_matters}</p>{/if}{#if finding.project_use}<p><strong>Möjlig användning:</strong> {finding.project_use}</p>{/if}</details>
						{/if}
						<details class="technical"><summary>Visa tekniska detaljer</summary><dl><div><dt>Kategori</dt><dd>{finding.category ?? '–'}</dd></div><div><dt>Publicerad</dt><dd>{formatDate(finding.published_at)}</dd></div><div><dt>Ålder</dt><dd>{finding.ageDays === null ? 'Okänd' : `${finding.ageDays} dagar`}</dd></div></dl></details>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<div class="two-columns">
		<section class="section"><div class="section-heading"><h2>Källor</h2><p>Endast godkända externa flöden.</p></div><ul class="compact-list">{#each data.sources as source}<li><div><strong>{sourceLabel(source)}</strong><span>{source.category}</span></div><span>{source.enabled ? 'Aktiv' : 'Pausad'} · kontrollerad {formatDateTime(source.last_checked_at)}</span></li>{/each}</ul></section>
		<section class="section"><div class="section-heading"><h2>Körningar</h2><p>Dagligen 06:15 UTC.</p></div><ul class="compact-list">{#each data.runs as run}<li><div><strong>{run.status === 'completed' ? 'Genomförd' : run.status}</strong><span>{formatDateTime(run.started_at)}</span></div><span>{run.sources_checked} källor · {run.findings_saved} sparade</span></li>{/each}</ul></section>
	</div>
</main>

<style>
	.radar-shell { width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; overflow-x: clip; }
	.hero, .finding-head, .overview, .handling-form, .compact-list li { display: flex; gap: 1rem; } .hero { flex-wrap: wrap; justify-content: space-between; align-items: end; margin-bottom: 1.25rem; } .hero a { text-decoration: underline; text-underline-offset: .2em; }
	.hero p, .section-heading p, .meta, .privacy-note, .compact-list span { color: var(--color-text-muted); } .eyebrow { margin-bottom: .25rem; font-size: .8rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
	.privacy-note, .notice { border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-surface); padding: .9rem 1rem; color: var(--color-text-muted); } .notice.error { color: var(--color-danger); } .notice.success { color: var(--color-success); }
	.overview, .two-columns { display: grid; gap: 1rem; } .overview { grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 1rem 0 2rem; } .two-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.metric, .finding-card, .section { min-width: 0; border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-surface); padding: 1rem; } .metric span, label span, .compact-list span { display: block; font-size: .85rem; } .metric strong { display: block; margin-top: .25rem; font-size: 1.55rem; }
	.section { margin-top: 1rem; } .section-heading { margin-bottom: 1rem; } .section-heading h2 { margin: 0; } .finding-list { display: grid; gap: .75rem; min-width: 0; }
	.finding-head { justify-content: space-between; align-items: start; min-width: 0; } .heading-content, .badges { min-width: 0; } .badges { display: flex; flex-wrap: wrap; justify-content: end; gap: .4rem; } .finding-card h3 { margin: .2rem 0 .7rem; font-size: 1.05rem; } .finding-card h3 a, .summary, .matters, dd { overflow-wrap: anywhere; word-break: break-word; } .finding-card h3 a { text-decoration: none; } .finding-card h3 a:hover { text-decoration: underline; }
	.finding-card > p { line-height: 1.55; } .matters { color: var(--color-text-muted); } .clamp { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; }
	.source-badge, .next-step { display: inline-block; max-width: 100%; border-radius: 999px; padding: .3rem .55rem; overflow-wrap: anywhere; font-size: .78rem; } .source-badge { border: 1px solid var(--color-border); color: var(--color-text-muted); } .source-badge.official { border-color: var(--color-primary); color: var(--color-primary); }
	.next-step { margin: 0 0 .8rem; background: var(--color-surface-raised, var(--color-surface)); color: var(--color-text-muted); font-weight: 750; } .next-step.act-now { background: color-mix(in srgb, var(--color-danger) 13%, transparent); color: var(--color-danger); } .next-step.test { background: color-mix(in srgb, var(--color-primary) 13%, transparent); color: var(--color-primary); } .next-step.watch { background: color-mix(in srgb, var(--color-warning) 15%, transparent); color: var(--color-text-muted); }
	.handling-form { flex-wrap: wrap; align-items: end; min-width: 0; margin-top: 1rem; } .handling-form label { min-width: 0; } select, button { min-width: 0; border-radius: .6rem; padding: .55rem .65rem; font: inherit; } select { border: 1px solid var(--color-border); background: var(--color-surface); } button { border: 0; background: var(--color-primary); color: white; font-weight: 700; cursor: pointer; } .scores { display: flex; flex-wrap: wrap; gap: .35rem .75rem; width: 100%; color: var(--color-text-muted); font-size: .85rem; }
	.more, .technical { margin-top: .85rem; color: var(--color-text-muted); } summary { cursor: pointer; overflow-wrap: anywhere; } .more p { line-height: 1.5; overflow-wrap: anywhere; } .technical dl { display: grid; gap: .4rem; margin: .7rem 0 0; } .technical dl div { display: grid; grid-template-columns: 7rem minmax(0, 1fr); gap: .5rem; } .technical dt { font-weight: 700; } .technical dd { margin: 0; }.archived { opacity: .78; }
	.compact-list { margin: 0; padding: 0; list-style: none; } .compact-list li { min-width: 0; justify-content: space-between; padding: .75rem 0; border-top: 1px solid var(--color-border); font-size: .9rem; overflow-wrap: anywhere; } .compact-list li:first-child { border-top: 0; padding-top: 0; }
	@media (max-width: 700px) { .overview, .two-columns { grid-template-columns: 1fr; } .finding-head, .compact-list li { display: block; } .badges { justify-content: start; margin-top: .4rem; } .handling-form { display: grid; grid-template-columns: 1fr; gap: .7rem; } .handling-form label, .handling-form select, .handling-form button { width: 100%; } .scores { display: grid; gap: .25rem; } }
</style>
