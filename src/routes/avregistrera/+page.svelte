<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	let { data, form } = $props();

	const hasTokenMessage = $derived(data.tokenStatus !== 'none');
	const tokenIsSuccess = $derived(data.tokenStatus === 'success');
	const tokenIsError = $derived(data.tokenStatus === 'error' || data.tokenStatus === 'invalid');
	const formSuccess = $derived(Boolean(form?.success));
	const formMessage = $derived(typeof form?.message === 'string' ? form.message : '');
</script>

<SEO canonical="https://mittpsyke.se/avregistrera" />

<svelte:head>
	<title>Avregistrera - MittPsyke</title>
	<meta
		name="description"
		content="Avregistrera dig fran mejlutskick eller ga vidare till avslut av konto pa MittPsyke."
	/>
</svelte:head>

<main class="unsubscribe-page container">
	<section class="panel">
		<h1>Avregistrering</h1>
		<p class="lead">
			Har kan du stoppa mejlutskick och paminelser. Om du vill avsluta hela kontot finns en separat knapp
			langre ner.
		</p>

		{#if hasTokenMessage}
			<p class="feedback {tokenIsSuccess ? 'success' : 'error'}">{data.tokenMessage}</p>
			{#if data.tokenEmailType}
				<p class="hint">Kalla: {data.tokenEmailType}</p>
			{/if}
		{/if}

		{#if formMessage}
			<p class="feedback {formSuccess ? 'success' : 'error'}">{formMessage}</p>
		{/if}

		{#if data.isLoggedIn}
			<p class="hint">Inloggad som: {data.userEmail ?? 'okand anvandare'}</p>

			<form method="POST" action="?/unsubscribe">
				<button class="primary-btn" type="submit">Stoppa alla utskick</button>
			</form>
		{:else if !hasTokenMessage || tokenIsError}
			<p class="hint">
				Logga in for att hantera utskick manuellt, eller anvand avregistreringslanken fran ett mejl.
			</p>
			<a class="ghost-btn" href="/login">Logga in</a>
		{/if}
	</section>

		<section class="panel danger-panel">
			<h2>Avsluta konto</h2>
			<p>
				Om du vill radera kontot helt (dagbok, chatthistorik och profil) kan du gora det i
				kontoinstallningar.
			</p>
			{#if data.isLoggedIn}
				<a class="danger-btn" href="/dashboard/installningar#radera-konto">Ga till kontoradering</a>
			{:else}
				<a class="ghost-btn" href="/login">Logga in for kontoradering</a>
			{/if}
		</section>
	</main>

<style>
	.unsubscribe-page {
		max-width: 760px;
		padding-top: 1.4rem;
		padding-bottom: 2.8rem;
		display: grid;
		gap: 1rem;
	}

	.panel {
		border-radius: var(--radius-card);
		background: #fcfbf9;
		padding: 1.2rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	h1,
	h2 {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		color: #2f2a24;
	}

	h1 {
		font-size: clamp(1.45rem, 3vw, 1.9rem);
	}

	.lead {
		margin: 0 0 0.8rem;
		font-family: var(--font-body);
		line-height: 1.65;
		opacity: 0.8;
	}

	p {
		font-family: var(--font-body);
		line-height: 1.6;
	}

	.feedback {
		margin: 0.7rem 0;
		padding: 0.7rem 0.8rem;
		border-radius: var(--radius-input);
		font-size: 0.92rem;
	}

	.feedback.success {
		background: #e8f7ef;
		color: #116b4b;
		border: 1px solid #bfe7d1;
	}

	.feedback.error {
		background: #fff1f1;
		color: #9c1f1f;
		border: 1px solid #f6cccc;
	}

	.hint {
		margin: 0.35rem 0 0.8rem;
		font-size: 0.86rem;
		opacity: 0.7;
	}

	.primary-btn,
	.ghost-btn,
	.danger-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-input);
		padding: 0.65rem 1rem;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		letter-spacing: -0.01em;
		transition: opacity 160ms ease, background-color 160ms ease;
	}

	.primary-btn {
		background: #e5f1ec;
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: #2e2a24;
	}

	.primary-btn:hover {
		background: #dbe9e3;
	}

	.ghost-btn {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.12);
		color: #2e2a24;
	}

	.ghost-btn:hover {
		opacity: 0.85;
	}

	.danger-panel {
		border: 1px solid rgba(185, 28, 28, 0.22);
		background: #fff7f7;
	}

	.danger-btn {
		background: #b91c1c;
		color: #fff;
		border: 1px solid transparent;
	}

	.danger-btn:hover {
		background: #991b1b;
	}

	:global(.dark) .panel {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) h1,
	:global(.dark) h2 {
		color: #ece7df;
	}

	:global(.dark) .danger-panel {
		background: rgba(185, 28, 28, 0.12);
		border-color: rgba(248, 113, 113, 0.38);
	}

	:global(.dark) .feedback.success {
		background: rgba(22, 163, 74, 0.18);
		border-color: rgba(74, 222, 128, 0.3);
		color: #d1fae5;
	}

	:global(.dark) .feedback.error {
		background: rgba(220, 38, 38, 0.16);
		border-color: rgba(248, 113, 113, 0.32);
		color: #fee2e2;
	}

	:global(.dark) .ghost-btn {
		border-color: rgba(255, 255, 255, 0.14);
		color: #ece7df;
	}
	
	@media (min-width: 740px) {
		.unsubscribe-page {
			padding-top: 1.8rem;
			gap: 1.2rem;
		}

		.panel {
			padding: 1.35rem;
		}
	}
</style>
