<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>{data.tool.title} | Övningar | MittPsyke</title>
	<meta name="description" content={data.tool.description} />
</svelte:head>

<main class="container tool-page">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href="/">Hem</a>
		<span>/</span>
		<a href="/ovningar">Övningar</a>
		<span>/</span>
		<span>{data.tool.title}</span>
	</nav>

	<header class="intro">
		<h1>{data.tool.title}</h1>
		<p>{data.tool.description}</p>
	</header>

	<section class="info-box" aria-label="Om övningen">
		<p><strong>Sammanställt av MittPsyke.</strong> Övningen är ett stöd för reflektion och lugn i vardagen.</p>
		<p>Den ersätter inte vård, diagnos eller behandling. Om något känns för starkt kan du pausa och välja ett mindre steg.</p>
	</section>

	<section class="block">
		<h2>Guide i samma område</h2>
		<p>
			Övningen hör ihop med guiden
			<a href={`/guider/${data.pillar.slug}`}>{data.pillar.title}</a>
			om du vill ha mer bakgrund och fler steg.
		</p>
	</section>

	{#if data.tool.purpose}
		<section class="block">
			<h2>Syfte</h2>
			<p>{data.tool.purpose}</p>
		</section>
	{/if}

	{#if data.tool.steps && data.tool.steps.length > 0}
		<section class="block">
			<h2>Gör så här</h2>
			<ol class="step-list">
				{#each data.tool.steps as step}
					<li>{step}</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if data.tool.reflections && data.tool.reflections.length > 0}
		<section class="block">
			<h2>Reflektera efteråt</h2>
			<ul class="reflect-list">
				{#each data.tool.reflections as question}
					<li>{question}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="block">
		<h2>{data.relatedTools.length > 0 ? 'Fler övningar i samma område' : 'Nästa steg'}</h2>
		{#if data.relatedTools.length > 0}
			<p>Om du vill fortsätta i samma område kan du prova någon av de här övningarna.</p>
			<ul class="link-list">
				{#each data.relatedTools as relatedTool}
					<li><a href={`/ovningar/${relatedTool.slug}`}>{relatedTool.title}</a></li>
				{/each}
			</ul>
		{:else}
			<p>
				Det finns inga fler övningar i det här området just nu. Gå gärna vidare till
				<a href="/ovningar">övningsöversikten</a>
				för fler lugna nästa steg.
			</p>
		{/if}
	</section>
</main>

<style>
	.tool-page {
		padding: 1.25rem 1.25rem 3.5rem;
	}

	.crumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		font-size: 0.84rem;
		opacity: 0.72;
	}

	.intro {
		margin-top: 0.9rem;
	}

	.intro h1 {
		margin: 0;
		font-size: clamp(1.8rem, 3.7vw, 2.45rem);
	}

	.intro p {
		margin: 0.75rem 0 0;
		max-width: 66ch;
		line-height: 1.65;
		opacity: 0.84;
	}

	.block {
		margin-top: 1.4rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #fbfcfd;
	}

	.info-box {
		margin-top: 1rem;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #f4f8f6;
	}

	.info-box p {
		margin: 0;
		font-size: 0.93rem;
		line-height: 1.6;
		opacity: 0.84;
	}

	.info-box p + p {
		margin-top: 0.45rem;
	}

	.block h2 {
		margin: 0;
		font-size: 1.16rem;
		line-height: 1.35;
	}

	.block p {
		margin: 0.65rem 0 0;
		line-height: 1.65;
	}

	.block a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.step-list {
		display: grid;
		gap: 0.65rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.step-list li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
		align-items: start;
		padding: 0.85rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
		line-height: 1.6;
	}

	.step-list li::before {
		counter-increment: step;
		content: counter(step);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 999px;
		background: #e7f1ee;
		color: #2e5850;
		font-size: 0.88rem;
		font-weight: 700;
	}

	.link-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.65rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}

	.link-list li {
		padding: 0.8rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
		line-height: 1.55;
	}

	.reflect-list {
		display: grid;
		gap: 0.65rem;
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
	}

	.reflect-list li {
		padding: 0.8rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
		line-height: 1.55;
	}

	:global(.dark) .block {
		background: #1b2024;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .info-box {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .step-list li,
	:global(.dark) .link-list li,
	:global(.dark) .reflect-list li {
		background: #232a2e;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .step-list li::before {
		background: rgba(134, 223, 214, 0.12);
		color: #86dfd6;
	}

	@media (max-width: 640px) {
		.tool-page {
			padding: 1.1rem 1rem 3rem;
		}

		.block,
		.info-box {
			padding: 0.95rem 0.9rem;
		}

		.step-list,
		.link-list,
		.reflect-list {
			gap: 0.55rem;
		}

		.link-list {
			grid-template-columns: 1fr;
		}

		.step-list li,
		.link-list li,
		.reflect-list li {
			padding: 0.8rem 0.85rem;
		}
	}
</style>
