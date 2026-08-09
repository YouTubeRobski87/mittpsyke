<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SEO from '$lib/components/SEO.svelte';
	import HealthConsent from '$lib/components/HealthConsent.svelte';
	import RecentConversations from '$lib/components/RecentConversations.svelte';
	import { planChatStart } from '$lib/ai/chat-start';
	import { trackAiChatStarted } from '$lib/analytics';

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

	// Samma nycklar som ChatWindow läser vid uppstart. Texten skickas automatiskt
	// när samtycket är klart, ämnet följer med som extra kontext när det matchats.
	const HERO_QUICK_START_KEY = 'mittpsyke_hero_quick_start';
	const TOPIC_HINT_KEY = 'mittpsyke_chat_topic_hint';

	let hasConsent = $state(false);
	let draft = $state('');
	let emptyDraftError = $state('');
	let draftField: HTMLTextAreaElement | null = $state(null);

	onMount(() => {
		// Text som skrevs i startsidans hero och som användaren valde att ta med
		// hit i stället för till dagboken. Fylls i, men skickas aldrig automatiskt.
		try {
			const carriedDraft = localStorage.getItem(HERO_QUICK_START_KEY)?.trim();
			if (carriedDraft) {
				draft = carriedDraft;
				localStorage.removeItem(HERO_QUICK_START_KEY);
			}
		} catch {
			// Blockerad lagring betyder bara att texten inte följde med.
		}

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

	function startConversation(event: SubmitEvent) {
		event.preventDefault();
		const plan = planChatStart(draft, null);

		if (!plan.ok) {
			emptyDraftError = 'Skriv några ord om vad du tänker på, så börjar vi där.';
			draftField?.focus();
			return;
		}

		emptyDraftError = '';

		try {
			localStorage.setItem(HERO_QUICK_START_KEY, plan.text);
			if (plan.topicId) {
				localStorage.setItem(TOPIC_HINT_KEY, plan.topicId);
			} else {
				localStorage.removeItem(TOPIC_HINT_KEY);
			}
		} catch {
			// Blockerad lagring stoppar inte samtalet - texten följer bara inte med.
		}

		// Bara längd och temats id. Aldrig det användaren skrivit.
		trackAiChatStarted({ topicId: plan.topicId, textLength: plan.analytics.textLength });

		void goto(plan.destination);
	}
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
			<h1>Vad vill du prata om idag?</h1>
			<p class="hero-lead">
				Skriv precis det du tänker på. Du behöver inte välja kategori – jag hjälper dig att hitta
				rätt.
			</p>
		</header>

		<section class="starter" aria-labelledby="starter-heading">
			<h2 id="starter-heading" class="visually-hidden">Börja ett samtal</h2>

			<form class="starter-form" onsubmit={startConversation}>
				<label class="starter-label" for="chat-starter">Skriv ditt första meddelande</label>
				<textarea
					id="chat-starter"
					bind:this={draftField}
					bind:value={draft}
					class="starter-input"
					rows="4"
					placeholder="Till exempel: Jag kan inte sova. Eller: Jag vet inte varför jag mår dåligt."
					aria-describedby="starter-help{emptyDraftError ? ' starter-error' : ''}"
					oninput={() => (emptyDraftError = '')}
				></textarea>
				<p id="starter-help" class="starter-help">
					Du kan skriva hur lite eller mycket du vill. ”Jag vill bara prata” räcker.
				</p>
				<p id="starter-error" class="starter-error" aria-live="polite">{emptyDraftError}</p>

				<button type="submit" class="starter-submit">Börja samtalet</button>
			</form>
		</section>

		<section class="section how-chat-works" aria-labelledby="how-chat-works-title">
			<h2 id="how-chat-works-title">Så går det till</h2>
			<ol class="how-chat-steps">
				<li>
					<h3>✍️ Skriv i din egen takt</h3>
					<p>Berätta det du vill. Du behöver inte formulera dig perfekt.</p>
				</li>
				<li>
					<h3>🧭 Få hjälp att sortera tankarna</h3>
					<p>
						AI:n hjälper dig att strukturera det du beskriver genom lugna följdfrågor och
						reflektion.
					</p>
				</li>
				<li>
					<h3>🌱 Du väljer själv</h3>
					<p>
						Du kan använda chatten anonymt. Om du senare vill spara din historik väljer du själv
						det.
					</p>
				</li>
			</ol>
			<p class="how-chat-note">
				MittPsyke är ett stödverktyg och ersätter inte vård eller behandling.
			</p>
		</section>

		<RecentConversations />

		<section class="section">
			<h2>Vad kan du få hjälp med?</h2>
			<p>
				AI-chatten hjälper dig att reflektera kring ångest, stress, sömnproblem, relationer
				och psykiskt mående. Du kan börja utan konto — då sparas gästchatten i MittPsyke bara under det aktuella
				besöket. Med konto sparas den tills du själv raderar den. Läs mer om hur uppgifter hanteras
				i <a href="/integritet">integritetspolicyn</a> och om hur AI-stödet är byggt i
				<a href="/ansvarsfull-ai">Ansvarsfull AI</a>. Om du vill läsa mer först finns
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


	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	.hero-lead {
		margin-top: 0.7rem;
	}

	/* Textrutan är sidans primära väg in. */
	.starter {
		max-width: 720px;
		display: grid;
		gap: 1rem;
	}

	.starter-form {
		display: grid;
		gap: 0.4rem;
	}

	.starter-label {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: -0.015em;
	}

	.starter-input {
		width: 100%;
		padding: 0.9rem 1rem;
		font-family: var(--font-body);
		font-size: 1.05rem;
		line-height: 1.6;
		color: inherit;
		background: var(--color-surface, hsl(var(--surface)));
		border: 1.5px solid var(--color-border, hsl(var(--border)));
		border-radius: var(--radius-input);
		resize: vertical;
		min-height: 7rem;
	}

	.starter-input::placeholder {
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
		opacity: 0.8;
	}

	.starter-help {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	.starter-error {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--primary);
	}

	.starter-error:empty {
		display: none;
	}

	.starter-submit {
		justify-self: start;
		margin-top: 0.35rem;
		padding: 0.8rem 1.9rem;
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		background: var(--primary);
		border: 1.5px solid var(--primary);
		border-radius: var(--radius-pill);
		cursor: pointer;
		transition: background-color 0.18s ease;
	}

	.starter-submit:hover {
		background: var(--color-primary-hover, var(--primary));
	}

	:global(.dark) .starter-submit {
		color: #0b1220;
		background: var(--primary-dark, #7dd3fc);
		border-color: var(--primary-dark, #7dd3fc);
	}

	:global(.dark) .starter-error {
		color: var(--primary-dark, #7dd3fc);
	}

	.how-chat-works {
		padding: 1rem 1.1rem;
		border-radius: var(--radius-card);
		background: rgba(248, 245, 239, 0.88);
		border: 1px solid rgba(52, 91, 55, 0.1);
	}

	.how-chat-steps {
		margin: 0.8rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.how-chat-steps li {
		min-width: 0;
		padding: 0.85rem;
		border-radius: var(--radius-card);
		background: rgba(255, 255, 255, 0.62);
		border: 1px solid rgba(52, 91, 55, 0.08);
	}

	.how-chat-steps h3 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.98rem;
		line-height: 1.35;
	}

	.how-chat-steps p {
		margin-top: 0.45rem;
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.how-chat-note {
		margin-top: 0.85rem;
		padding: 0.7rem 0.8rem;
		border-left: 3px solid rgba(52, 91, 55, 0.48);
		background: rgba(52, 91, 55, 0.07);
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.section a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.dark) .how-chat-works {
		background: rgba(23, 29, 36, 0.82);
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .how-chat-steps li {
		background: rgba(255, 255, 255, 0.04);
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .how-chat-note {
		border-left-color: rgba(147, 197, 253, 0.48);
		background: rgba(147, 197, 253, 0.07);
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

		.how-chat-steps {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}
</style>
