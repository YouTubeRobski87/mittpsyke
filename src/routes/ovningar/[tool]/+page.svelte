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
		<p><strong>Sammanställt av MittPsyke</strong></p>
		<p>Övningen är ett enkelt stöd för reflektion och lugn i vardagen. Den ersätter inte vård, diagnos eller behandling.</p>
		<p>Om något känns för starkt eller inte passar dig just nu kan du pausa och välja ett mindre steg.</p>
	</section>

	<section class="block">
		<h2>Tillhörande guide</h2>
		<p>
			Övningen hör ihop med guiden
			<a href={`/guider/${data.pillar.slug}`}>{data.pillar.title}</a>.
		</p>
	</section>

	<section class="block">
		<h2>Arbetsgång</h2>
		<ol>
			<li>Läs igenom syftet med övningen.</li>
			<li>Avsätt 5-15 minuter i lugn miljö.</li>
			<li>Följ stegen i din egen takt.</li>
			<li>Reflektera kort över vad du märker efteråt.</li>
		</ol>
	</section>

	{#if data.tool.slug === '4-7-8-andning'}
		<section class="block">
			<h2>Fördjupa vidare</h2>
			<p>
				Om du vill använda övningen som en del av ett större stöd kan du läsa mer om
				<a href="/4-7-8-andning-ovning">4-7-8 andning övning</a>,
				<a href="/andningsovningar-mot-angest">andningsövningar mot ångest</a>,
				<a href="/ovningar-mot-angest-online">övningar mot ångest online</a> eller
				<a href="/hjalp-vid-angest-online">hjälp vid ångest online</a>.
			</p>
		</section>
	{/if}

	<section class="block">
		<h2>Läs vidare</h2>
		<p>
			Du kan läsa vidare i guiden <a href={`/guider/${data.pillar.slug}`}>{data.pillar.title}</a> och utforska fler
			övningar eller artiklar i samma område när du vill ta nästa steg.
		</p>
	</section>
</main>

<style>
	.tool-page {
		padding: 1.25rem 1.25rem 3.5rem;
	}

	.crumbs {
		font-size: 0.84rem;
		opacity: 0.72;
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
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
		padding: 0.9rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #f4f8f6;
	}

	.info-box p {
		margin: 0;
		font-size: 0.93rem;
		opacity: 0.84;
	}

	.info-box p + p {
		margin-top: 0.35rem;
	}

	.block h2 {
		margin: 0;
		font-size: 1.16rem;
	}

	.block p {
		margin: 0.65rem 0 0;
	}

	.block a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	ol {
		margin: 0.7rem 0 0;
		padding-left: 1.1rem;
	}

	li + li {
		margin-top: 0.4rem;
	}

	:global(.dark) .block {
		background: #1b2024;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .info-box {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}
</style>
