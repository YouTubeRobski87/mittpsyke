<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import GuideActionCta from '$lib/components/GuideActionCta.svelte';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let loggedIn = $state(false);

	onMount(() => {
		let active = true;

		void supabase.auth.getSession().then(({ data: { session } }) => {
			if (!active) return;
			loggedIn = !!session;
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			loggedIn = !!session;
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	});

	const previewWeeks = [
		[0, 1, 1, 2, 2, 1, 0],
		[1, 1, 2, 3, 2, 1, 1],
		[0, 1, 2, 2, 3, 2, 1],
		[1, 2, 2, 3, 3, 2, 1],
		[0, 1, 1, 2, 2, 2, 1],
		[1, 2, 3, 3, 2, 1, 1]
	];

	function toneClass(level: number): string {
		if (level === 0) return 'tone-0';
		if (level === 1) return 'tone-1';
		if (level === 2) return 'tone-2';
		return 'tone-3';
	}
</script>

<SEO canonical="https://www.mittpsyke.se/humorsparning" />

<svelte:head>
	<title>Humörspårning & aktivitetsheatmap – MittPsyke</title>
	<meta
		name="description"
		content="Följ dina känslor över tid med visuell humörspårning, streaks och insikter. Se mönster i ditt mående med MittPsyke."
	/>
	<meta property="og:title" content="Humörspårning & aktivitetsheatmap – MittPsyke" />
	<meta
		property="og:description"
		content="Följ dina känslor över tid med visuell humörspårning, streaks och insikter. Se mönster i ditt mående med MittPsyke."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />

</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Spåra ditt humör över tid</h1>
			<p>
				När du följer ditt humör regelbundet blir det lättare att se vad som hjälper och vad som dränerar.
				Humörspårning gör små skiften synliga innan de känns överväldigande.
			</p>
			<p>
				Med en visuell heatmap får du överblick över veckor och månader i stället för enstaka dagar. Det
				gör det enklare att förstå mönster kopplade till sömn, stress, socialt stöd och återhämtning.
			</p>
			<p>
				MittPsyke kombinerar dagbok, humörspårning och AI-insikter så att du kan följa din utveckling i
				lugn takt. Tjänsten ersätter inte vård, men kan vara ett tydligt första steg.
			</p>
		</header>

		<section class="preview-card" aria-label="Förhandsvisning av humörspårning">
			<div class="preview-header">
				<h2>Förhandsvisning: heatmap och streak</h2>
				<div class="streak-badge">
					<span class="streak-number">14</span>
					<span class="streak-label">dagars streak</span>
				</div>
			</div>
			<div class="heatmap">
				{#each previewWeeks as week}
					<div class="week-column">
						{#each week as day}
							<div class={`day-cell ${toneClass(day)}`}></div>
						{/each}
					</div>
				{/each}
			</div>
			<p class="preview-note">Illustration av hur översikten kan se ut i ditt konto.</p>
		</section>

		<div class="cta-container" aria-label="Starta humörspårning">
			{#if loggedIn}
				<a class="cta-button" href="/framsteg">Se mitt framsteg</a>
			{:else}
				<a class="cta-button" href="/register">Skapa konto</a>
				<a class="cta-button ghost" href="/login">Logga in</a>
			{/if}
		</div>

		<section class="section">
			<h2>Från känsla till insikt</h2>
			<p>
				När du spårar humör tillsammans med korta dagboksanteckningar får du bättre underlag för reflektion.
				Det hjälper dig att ta mer träffsäkra små steg i vardagen.
			</p>
			<p class="links-row">
				<a class="secondary-link" href="/dagbok">Öppna dagboken</a>
				<a class="secondary-link" href="/framsteg">Se framsteg</a>
				<a class="secondary-link" href="/journalforing">Läs om dagboksskrivande</a>
			</p>
		</section>

		<GuideActionCta chatHref="/chat" exerciseHref="/ovningar" exerciseLabel="Se övningar för mer balans" layout="compact" />
	</div>
</main>

<style>
	.page {
		padding: clamp(2.2rem, 6vw, 3rem) clamp(1.25rem, 4vw, 1.5rem) clamp(3.2rem, 8vw, 4rem);
	}

	.page-container {
		max-width: 840px;
		margin: 0 auto;
		display: grid;
		gap: clamp(1.3rem, 3vw, 1.8rem);
	}

	.hero,
	.section,
	.preview-card {
		max-width: 740px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.9rem, 1.5rem + 1.9vw, 2.3rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
	}

	p {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0.75rem 0 0;
	}

	.preview-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f3f7f6;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.streak-badge {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
		padding: 0.4rem 0.7rem;
		border-radius: var(--radius-pill);
		background: rgba(95, 129, 112, 0.15);
	}

	.streak-number {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 700;
		color: #2f4d40;
	}

	.streak-label {
		font-size: 0.82rem;
		color: #3c5a4d;
	}

	.heatmap {
		margin-top: 0.9rem;
		display: flex;
		gap: 0.35rem;
	}

	.week-column {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.day-cell {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.24rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.tone-0 {
		background: #ebedf0;
	}

	.tone-1 {
		background: #c6e48b;
	}

	.tone-2 {
		background: #7bc96f;
	}

	.tone-3 {
		background: #239a3b;
	}

	.preview-note {
		margin-top: 0.8rem;
		font-size: 0.88rem;
		opacity: 0.78;
	}

	.cta-container {
		max-width: 740px;
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.35rem;
		border-radius: var(--radius-pill);
		background: var(--primary);
		border: 2px solid var(--primary);
		color: #ffffff;
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
	}

	.cta-button.ghost {
		background: transparent;
		color: var(--primary);
	}

	.links-row {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	.secondary-link {
		display: inline-block;
		color: var(--theme-accent, #436e8f);
		text-decoration: underline;
		font-size: 0.95rem;
		font-weight: 500;
		margin-right: 1rem;
		opacity: 0.9;
		transition: opacity 150ms ease;
	}
	.secondary-link:hover {
		opacity: 1;
	}

	@media (max-width: 640px) {
		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .preview-card {
		background: #1b2321;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .streak-badge {
		background: rgba(134, 223, 214, 0.16);
	}

	:global(.dark) .streak-number {
		color: #d5e6dc;
	}

	:global(.dark) .streak-label {
		color: #b7ccc2;
	}

	:global(.dark) .day-cell {
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .tone-0 {
		background: #2a2f2d;
	}

	:global(.dark) .tone-1 {
		background: #4a6d59;
	}

	:global(.dark) .tone-2 {
		background: #6cae77;
	}

	:global(.dark) .tone-3 {
		background: #8fd98f;
	}

	:global(.dark) .cta-button.ghost {
		color: #86dfd6;
		border-color: #86dfd6;
	}
</style>
