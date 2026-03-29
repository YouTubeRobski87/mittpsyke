<script lang="ts">
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
</script>

<svelte:head>
	<title>Journalföring för psykisk hälsa – MittPsyke</title>
	<meta
		name="description"
		content="Forskning visar att regelbunden journalföring förbättrar mental hälsa. MittPsyke gör det enkelt med AI-guidat skrivande på svenska."
	/>
	<meta property="og:title" content="Journalföring för psykisk hälsa – MittPsyke" />
	<meta
		property="og:description"
		content="Forskning visar att regelbunden journalföring förbättrar mental hälsa. MittPsyke gör det enkelt med AI-guidat skrivande på svenska."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/journalforing" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Journalföring för bättre mental hälsa</h1>
			<p>
				Regelbunden journalföring kan minska stress, göra känslor tydligare och hjälpa dig att se vad som
				påverkar ditt mående. När tankar får ord blir det ofta lättare att sortera det som känns rörigt.
			</p>
			<p>
				Forskning om skrivande och reflektion visar att små, återkommande stunder kan ge bättre
				självförståelse över tid. Du behöver inte skriva långt. Några rader om dagen kan räcka för att
				upptäcka mönster.
			</p>
			<p>
				I MittPsyke får du stöd av AI-frågor på svenska som gör det enklare att komma igång. Du kan skriva i
				din egen takt och följa hur känslor och teman förändras vecka för vecka.
			</p>
		</header>

		<div class="cta-container" aria-label="Starta med journalföring">
			{#if loggedIn}
				<a class="cta-button" href="/dagbok">Öppna dagboken</a>
			{:else}
				<a class="cta-button" href="/register">Skapa konto och börja skriva</a>
				<a class="cta-button ghost" href="/login">Logga in</a>
			{/if}
		</div>

		<section class="section">
			<h2>Bygg en lugn vana i små steg</h2>
			<p>
				Börja med en kort check-in varje kväll: hur dagen kändes, vad som tog energi och vad som gav lugn.
				Över tid kan du jämföra anteckningar och se tydligare samband mellan känslor, sömn, stress och
				vardag.
			</p>
			<p class="links-row">
				<a class="secondary-link" href="/dagbok">Öppna dagboken</a>
				<a class="secondary-link" href="/framsteg">Se framsteg</a>
				<a class="secondary-link" href="/humorsparning">Läs om humörspårning</a>
			</p>
		</section>

		<GuideActionCta chatHref="/chat" exerciseHref="/ovningar" exerciseLabel="Se övningar för återhämtning" layout="compact" />
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
	.section {
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
		color: var(--theme-accent, #0f766e);
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

	:global(.dark) .cta-button.ghost {
		color: #86dfd6;
		border-color: #86dfd6;
	}
</style>
