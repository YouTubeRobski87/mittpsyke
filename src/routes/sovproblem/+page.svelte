<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import TopicGuideSection from '$lib/components/TopicGuideSection.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/sovproblem" />

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'MedicalWebPage',
		name: 'Sömnproblem – samtalsstöd och stöd i stunden',
		url: 'https://www.mittpsyke.se/sovproblem',
		description: 'Kan du inte sova? Prata anonymt med AI-baserat samtalsstöd om vad som håller dig vaken. Lugnt, tillgängligt och utan krav.',
		about: { '@type': 'MedicalCondition', name: 'Sömnproblem' },
		medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
		specialty: 'https://schema.org/Psychiatric',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Sömnproblem – stöd när natten känns lång</h1>
			<p>
				Att inte kunna sova är mer än bara trötthet. Det kan kännas som att hjärnan vägrar stänga av
				– tankar som snurrar, oro som spirar, en kropp som är utmattad men ändå vaken.
				Sömnproblem hänger ofta ihop med stress, ångest eller saker vi bär på utan att sätta ord på dem.
			</p>
		</header>

		<div class="text-block">
			<section class="section">
				<p>
					Det är inte ett tecken på svaghet. Det kan vara ett tecken på att du behöver utrymme
					att prata om vad som pågår – utan krav på att du ska ha svaret eller sova bättre imorgon.
				</p>
			</section>

			<section class="section">
				<p>
					Här kan du stanna upp, dela vad du bär på och samtala med något som lyssnar utan att döma.
					Du behöver inte logga in för att börja. Du kan vara helt anonym och prata när det passar dig
					– mitt på natten, tidigt på morgonen, eller när oron tar överhanden.
				</p>
			</section>
		</div>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta ett samtal</a>
		</div>

		<aside class="callout" aria-label="Viktigt att veta">
			<h2>Du behöver inte veta varför</h2>
			<p>Ibland räcker det att sätta ord på hur det känns. Sömnproblem minskar sällan av att ignoreras – men kan börja lösas upp när du får prata om dem.</p>
		</aside>

		<TopicGuideSection
			topicTitle="Sömnproblem"
			guideHref="/guider/sovproblem"
			articleLinks={[
				{ title: 'Nattlig oro – tankar som tar över i mörkret', href: '/guider/sovproblem/nattlig-oro' },
				{ title: 'Svårt att somna vid ångest – när kroppen inte kan slappna av', href: '/guider/sovproblem/svart-att-somna-angest' },
				{ title: 'Kan inte sova av stress – vad som händer och vad som hjälper', href: '/guider/sovproblem/kan-inte-sova-stress' }
			]}
		/>
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
		gap: clamp(2rem, 3.5vw, 2.5rem);
	}

	.text-block {
		max-width: 720px;
	}

	.hero {
		max-width: 720px;
		padding: clamp(1rem, 2vw, 1.25rem) 0 0.2rem;
	}

	.section {
		max-width: 720px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.5rem;
	}

	p {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin: 0;
	}

	.cta-container {
		max-width: 720px;
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		border-radius: var(--radius-pill);
		border: 2px solid var(--primary);
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1rem;
		color: white;
		background: var(--primary);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(15, 118, 110, 0.3);
	}

	.cta-button:active {
		transform: translateY(0);
	}

	.callout {
		max-width: 720px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: rgba(226, 240, 236, 0.6);
	}

	.callout h2 {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
		margin-bottom: 0.45rem;
		color: var(--primary);
	}

	.callout p {
		margin: 0;
		font-size: clamp(1rem, 0.96rem + 0.3vw, 1.05rem);
		line-height: 1.65;
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		p {
			font-size: 1.02rem;
		}

		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .callout {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .callout h2 {
		color: #86dfd6;
	}

	:global(.dark) .callout p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .cta-button {
		background: var(--primary);
		border-color: #86dfd6;
		color: white;
	}

	:global(.dark) .cta-button:hover {
		box-shadow: 0 6px 20px rgba(134, 223, 214, 0.3);
	}

</style>

