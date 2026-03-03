<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>{data.tool.title} | Ovningar | MittPsyke</title>
	<meta name="description" content={data.tool.description} />
</svelte:head>

<main class="container tool-page">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href="/">Hem</a>
		<span>/</span>
		<a href="/ovningar">Ovningar</a>
		<span>/</span>
		<span>{data.tool.title}</span>
	</nav>

	<header class="intro">
		<h1>{data.tool.title}</h1>
		<p>{data.tool.description}</p>
	</header>

	<section class="block">
		<h2>Tillhorande guide</h2>
		<p>
			Ovningen hor ihop med guiden
			<a href={`/guider/${data.pillar.slug}`}>{data.pillar.title}</a>.
		</p>
	</section>

	<section class="block">
		<h2>Arbetsgang</h2>
		<ol>
			<li>Las igenom syftet med ovningen.</li>
			<li>Avsatt 5-15 minuter i lugn miljo.</li>
			<li>Folj stegen i din egen takt.</li>
			<li>Reflektera kort over vad du marker efterat.</li>
		</ol>
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
		border: 1px solid rgba(255, 255, 255, 0.05);
		background: var(--bg-card);
		box-shadow: var(--shadow-elevated);
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

</style>
