<svelte:head>
	<title>MittPsyke - Under konstruktion</title>
	<meta
		name="description"
		content="MittPsyke är tillfälligt under konstruktion medan vi arbetar med förbättringar."
	/>
</svelte:head>

<main class="maintenance-screen">
	<section class="maintenance-card" aria-label="Under konstruktion">
		<h1>MittPsyke</h1>
		<p class="subtitle">Sidan är tillfälligt under konstruktion.</p>
		<p class="details">Vi arbetar lugnt och metodiskt med förbättringar. Tack för ditt tålamod.</p>
	</section>
</main>

<style>
	:global(html, body) {
		height: 100%;
	}

	:global(body) {
		margin: 0;
		background: #0f172a;
		color: #e2e8f0;
		font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
	}

	.maintenance-screen {
		min-height: 100vh;
		padding: 1.5rem;
		display: grid;
		place-items: center;
		background: #0f172a;
	}

	.maintenance-card {
		width: min(560px, 100%);
		padding: 2rem 1.5rem;
		border-radius: 14px;
		background: #111827;
		border: 1px solid #1f2937;
		text-align: center;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		line-height: 1.2;
		color: #f8fafc;
	}

	.subtitle {
		margin: 0.85rem 0 0;
		font-size: clamp(1rem, 2.2vw, 1.125rem);
		color: #cbd5e1;
	}

	.details {
		margin: 0.9rem 0 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #94a3b8;
	}
 </style>
