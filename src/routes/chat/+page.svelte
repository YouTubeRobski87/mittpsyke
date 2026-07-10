<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';
	import HealthConsent from '$lib/components/HealthConsent.svelte';
	import RecentConversations from '$lib/components/RecentConversations.svelte';

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

	let hasConsent = false;

	onMount(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return;

			const parsed = JSON.parse(stored);
			if (parsed?.accepted && parsed?.policy_version === VERSION) {
				hasConsent = true;
			}
		} catch {
			hasConsent = false;
		}
	});
</script>

<SEO canonical="https://www.mittpsyke.se/chat" />

<svelte:head>
	<title>AI-chat för psykisk hälsa | MittPsyke</title>
	<meta
		name="description"
		content="Prata anonymt med MittPsykes AI-chat om ångest, stress, nedstämdhet och psykiskt mående."
	/>
	<meta property="og:title" content="AI-chat för psykisk hälsa | MittPsyke" />
	<meta
		property="og:description"
		content="Prata anonymt om hur du mår och få hjälp att sortera tankar i lugn takt."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: 'AI-chat för psykisk hälsa | MittPsyke',
		description:
			'Prata anonymt med MittPsykes AI-chat om ångest, stress, nedstämdhet och psykiskt mående.',
		url: 'https://www.mittpsyke.se/chat',
		dateModified: '2026-07-10',
		about: { '@type': 'Thing', name: 'Psykisk hälsa och samtalsstöd' },
		inLanguage: 'sv-SE',
		provider: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

{#if !hasConsent}
	<HealthConsent
		onAccept={() => {
			hasConsent = true;
		}}
	/>
{/if}

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>AI-chat för psykisk hälsa</h1>
			<p>
				Du behöver inte veta exakt hur du ska börja. Välj det som känns närmast just nu och låt
				samtalet ta form i din egen takt. MittPsyke är ett AI-baserat samtalsstöd för reflektion
				och stöd i vardagen. Det ersätter inte vård eller kontakt med psykolog, läkare eller annan
				legitimerad vårdpersonal.
			</p>
		</header>

		<section class="choices" aria-label="Välj ingång till chatten">
			<a class="choice-card" href="/chat/a">
				<h2>Ångest</h2>
				<p>För oro, ångest och tankar som snurrar.</p>
			</a>
			<a class="choice-card" href="/chat/b">
				<h2>Nedstämdhet</h2>
				<p>För tunga dagar, låg ork och sådant som känns mörkt.</p>
			</a>
			<a class="choice-card" href="/chat/e">
				<h2>Trauma</h2>
				<p>För svåra upplevelser, behov av trygghet och att ta det i egen takt.</p>
			</a>
		</section>

		<section class="section how-chat-works" aria-labelledby="how-chat-works-title">
			<h2 id="how-chat-works-title">Så går det till</h2>
			<ol class="how-chat-steps">
				<li>Välj det spår som känns närmast just nu.</li>
				<li>Skriv i din egen takt och få ett lugnt svar tillbaka.</li>
				<li>Om du vill kan du senare skapa konto för att spara och återvända.</li>
			</ol>
		</section>

		<RecentConversations />

		<section class="section">
			<h2>Vad kan du få hjälp med?</h2>
			<p>
				AI-chatten kan hjälpa dig att reflektera kring ångest, stress, sömnproblem, relationer
				och psykiskt mående. Du kan börja utan konto. Vissa tekniska uppgifter hanteras enligt
				<a href="/integritet">integritetspolicyn</a>. Om du vill läsa mer först finns
				<a href="/prata-anonymt-online">prata anonymt online</a>. Vid akut fara, ring 112.
				För vårdråd, kontakta 1177. Behöver du mänsklig kontakt finns
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
			</p>
		</section>
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
		max-width: 720px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.2rem;
	}

	.section h2 {
		margin-bottom: 0.65rem;
	}

	p {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0;
	}

	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.85rem;
		max-width: 720px;
		width: 100%;
		min-width: 0;
	}

	.choice-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f8fafc;
		color: inherit;
		text-decoration: none;
		transition:
			transform 0.18s ease,
			background-color 0.18s ease;
	}

	.choice-card:hover {
		transform: translateY(-2px);
		background: #f1f5f9;
	}

	.choice-card p {
		margin-top: 0.45rem;
		font-size: 0.95rem;
		opacity: 0.82;
	}

	.how-chat-works {
		padding: 1rem 1.1rem;
		border-radius: var(--radius-card);
		background: rgba(248, 245, 239, 0.88);
		border: 1px solid rgba(52, 91, 55, 0.1);
	}

	.how-chat-steps {
		margin: 0.8rem 0 0;
		padding-left: 1.15rem;
		display: grid;
		gap: 0.45rem;
	}

	.section a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.dark) .choice-card {
		background: #171d24;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .choice-card:hover {
		background: #1c2230;
	}

	:global(.dark) .how-chat-works {
		background: rgba(23, 29, 36, 0.82);
		border-color: rgba(255, 255, 255, 0.08);
	}

	@media (max-width: 768px) {
		.page {
			padding: 0.65rem 0.75rem 1.25rem;
		}

		.page-container {
			gap: 0.65rem;
			width: 100%;
			min-width: 0;
		}

		h1 {
			font-size: 1.35rem;
			line-height: 1.12;
		}

		.hero,
		.section {
			max-width: 100%;
			min-width: 0;
		}

		.choices {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.4rem;
		}

		.choice-card {
			display: grid;
			place-items: center;
			min-height: 3.25rem;
			padding: 0.55rem 0.35rem;
			text-align: center;
		}

		.choice-card p {
			display: none;
		}

		.choice-card h2 {
			font-size: 0.8rem;
			line-height: 1.2;
		}

		.how-chat-steps {
			font-size: 0.95rem;
		}
	}
</style>
