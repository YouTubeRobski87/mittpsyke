<script lang="ts">
	type GuideActionCtaProps = {
		pillarSlug?: string;
		chatHref: string;
		exerciseHref?: string;
		exerciseLabel?: string;
		layout?: 'full' | 'compact';
	};

	let {
		pillarSlug = '',
		chatHref,
		exerciseHref = '/ovningar',
		exerciseLabel = 'Gör en enkel övning',
		layout = 'full'
	}: GuideActionCtaProps = $props();

	type GuideTone = {
		heading: string;
		intro: string;
		chatCopy: string;
		diaryCopy: string;
		exerciseCopy: string;
		supportCopy: string;
	};

	const toneByPillar = {
		angest: {
			heading: 'Nästa steg vid ångest',
			intro: 'Välj det som känns mest hjälpsamt just nu. Små steg kan räcka.',
			chatCopy: 'Sätt ord på det som känns svårt i lugn takt, utan krav på att formulera allt perfekt.',
			diaryCopy: 'Fånga tankarna innan de drar iväg och skapa mer struktur i det som känns.',
			exerciseCopy: 'Landa i kroppen med en enkel övning som hjälper dig att bromsa stresspåslag.',
			supportCopy: 'Om du behöver mänsklig kontakt finns stödlinjer med chatt och telefon.'
		},
		depression: {
			heading: 'Nästa steg vid nedstämdhet',
			intro: 'När orken är låg kan ett litet nästa steg vara tillräckligt.',
			chatCopy: 'Prata anonymt om det som tynger, i ett tempo som känns möjligt för dig.',
			diaryCopy: 'Skriv kort eller långt och följ hur måendet rör sig över tid.',
			exerciseCopy: 'Börja med en enkel övning som skapar riktning när allt känns tungt.',
			supportCopy: 'Om läget känns svårt att bära ensam kan du hitta rätt stödlinje här.'
		},
		'stress-utmattning': {
			heading: 'Nästa steg vid stress',
			intro: 'När belastningen är hög kan tydliga och små val göra stor skillnad.',
			chatCopy: 'Prata anonymt och sortera det som känns överväldigande just nu.',
			diaryCopy: 'Skriv av dig och få en lugn plats för återkommande reflektion.',
			exerciseCopy: 'Prova en kort övning för att varva ned och hitta tillbaka till nuet.',
			supportCopy: 'Behöver du prata med någon människa finns stödlinjer nära till hands.'
		},
		stress: {
			heading: 'Nästa steg vid stress',
			intro: 'Ta ett lugnt nästa steg som hjälper kroppen och tankarna att bromsa.',
			chatCopy: 'Chatta anonymt och få hjälp att sortera det som känns mycket.',
			diaryCopy: 'Skriv ned det som pågår och följ mönster över tid.',
			exerciseCopy: 'Använd en enkel övning för att skapa mer lugn i stunden.',
			supportCopy: 'När du behöver mänskligt stöd kan du hitta rätt stödlinje här.'
		},
		trauma: {
			heading: 'Nästa steg efter svåra händelser',
			intro: 'Du kan ta det varsamt och välja det steg som känns tryggast för dig.',
			chatCopy: 'Prata anonymt i lugn takt om det som känns svårt att bära ensam.',
			diaryCopy: 'Skriv ned tankar och reaktioner för att ge dem mer tydlig form.',
			exerciseCopy: 'Börja med en enkel och trygg övning som hjälper dig att landa.',
			supportCopy: 'Om du vill prata med en människa finns stödlinjer och akutvägar här.'
		},
		sovproblem: {
			heading: 'Nästa steg vid sömnproblem',
			intro: 'Du behöver inte lösa allt på en natt. Välj det steg som känns minst ansträngande just nu.',
			chatCopy: 'Prata anonymt om det som håller dig vaken eller gör återhämtningen svår.',
			diaryCopy: 'Skriv ned kvällstankar, sömnmönster eller sådant som påverkar återhämtningen.',
			exerciseCopy: 'Prova en lugn övning som hjälper kroppen att varva ned steg för steg.',
			supportCopy: 'Om du behöver prata med någon finns stödlinjer och vårdvägar att ta hjälp av.'
		}
	} satisfies Record<string, GuideTone>;

	type PillarToneKey = keyof typeof toneByPillar;

	const pillarAliases: Partial<Record<string, PillarToneKey>> = {
		ångest: 'angest',
		utmattning: 'stress-utmattning',
		somnproblem: 'sovproblem',
		sömnproblem: 'sovproblem'
	};

	const fallbackTone: GuideTone = {
		heading: 'Nästa steg i lugn takt',
		intro: 'Välj den väg som känns mest hjälpsam just nu.',
		chatCopy: 'Vill du sätta ord på det som känns svårt? Chatta anonymt i lugn takt.',
		diaryCopy: 'Vill du fånga tankar innan de försvinner? Skriv i dagboken.',
		exerciseCopy: 'Vill du ta ett konkret steg? Börja med en enkel övning.',
		supportCopy: 'Behöver du mänsklig kontakt? Se stödlinjer och akut hjälp.'
	};

	const normalizedPillarSlug = $derived(
		pillarSlug
			.trim()
			.toLowerCase()
			.normalize('NFD')
			.replace(/[^\w-]+/g, '')
	);

	const toneKey = $derived(
		(pillarAliases[normalizedPillarSlug] ?? normalizedPillarSlug) as PillarToneKey
	);

	const tone = $derived(toneByPillar[toneKey] ?? fallbackTone);

	const cards = $derived([
		{
			href: chatHref,
			title: 'Chatta anonymt nu',
			copy: tone.chatCopy,
			cta: 'Starta chatt'
		},
		{
			href: '/dagbok',
			title: 'Skriv i dagboken',
			copy: tone.diaryCopy,
			cta: 'Öppna dagboken'
		},
		{
			href: exerciseHref,
			title: 'Gör en enkel övning',
			copy: tone.exerciseCopy,
			cta: exerciseLabel
		},
		{
			href: 'https://stodlinjer.se',
			title: 'Hitta rätt stödlinje',
			copy: tone.supportCopy,
			cta: 'Se stödlinjer',
			target: '_blank',
			rel: 'noopener noreferrer'
		}
	]);
</script>

<section class="guide-cta" class:guide-cta-compact={layout === 'compact'} aria-labelledby="guide-cta-heading">
	<h2 id="guide-cta-heading">{tone.heading}</h2>
	<p class="guide-cta-intro">{tone.intro}</p>

	<div class="guide-cta-grid">
		{#each cards as card}
			<a
				class="guide-cta-card"
				href={card.href}
				target={card.target}
				rel={card.rel}
			>
				<h3>{card.title}</h3>
				<p>{card.copy}</p>
				<span>{card.cta}</span>
			</a>
		{/each}
	</div>

	<p class="guide-cta-note">
		Vid akut fara: <a href="tel:112">112</a>. För vårdråd: <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>.
	</p>
</section>

<style>
	.guide-cta {
		margin-top: 1.9rem;
		padding: 1.2rem 1rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f2f7f4;
	}

	.guide-cta-compact {
		margin-top: 1.4rem;
		padding: 1rem 0.9rem 0.9rem;
	}

	.guide-cta h2 {
		margin: 0;
		font-size: 1.18rem;
		line-height: 1.35;
		color: #2a3339;
	}

	.guide-cta-intro {
		margin: 0.6rem 0 0;
		max-width: 58ch;
		line-height: 1.6;
		opacity: 0.82;
	}

	.guide-cta-grid {
		margin-top: 0.95rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.guide-cta-card {
		display: block;
		padding: 0.9rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
		text-decoration: none;
		color: inherit;
		transition:
			transform 120ms ease,
			border-color 120ms ease,
			box-shadow 120ms ease;
	}

	.guide-cta-card:hover,
	.guide-cta-card:focus-visible {
		transform: translateY(-1px);
		border-color: rgba(48, 74, 63, 0.28);
		box-shadow: 0 8px 24px rgba(42, 51, 57, 0.08);
	}

	.guide-cta-card:focus-visible {
		outline: 2px solid rgba(48, 74, 63, 0.35);
		outline-offset: 2px;
	}

	.guide-cta-compact .guide-cta-card {
		padding: 0.8rem;
	}

	.guide-cta-card h3 {
		margin: 0;
		font-size: 1rem;
		line-height: 1.35;
		color: #2e373d;
	}

	.guide-cta-card p {
		margin: 0.5rem 0 0;
		font-size: 0.93rem;
		line-height: 1.58;
		opacity: 0.8;
	}

	.guide-cta-card span {
		display: inline-flex;
		margin-top: 0.75rem;
		padding: 0.32rem 0.58rem;
		border-radius: 999px;
		background: rgba(95, 129, 112, 0.1);
		font-size: 0.82rem;
		color: #304a3f;
	}

	.guide-cta-note {
		margin: 0.85rem 0 0;
		font-size: 0.84rem;
		line-height: 1.55;
		opacity: 0.78;
	}

	.guide-cta-note a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.dark) .guide-cta {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .guide-cta h2 {
		color: #e8e6e2;
	}

	:global(.dark) .guide-cta-intro,
	:global(.dark) .guide-cta-note {
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.dark) .guide-cta-card {
		background: #232c2a;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .guide-cta-card:hover,
	:global(.dark) .guide-cta-card:focus-visible {
		border-color: rgba(213, 230, 220, 0.28);
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
	}

	:global(.dark) .guide-cta-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .guide-cta-card p {
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.dark) .guide-cta-card span {
		background: rgba(140, 163, 106, 0.16);
		color: #d5e6dc;
	}

	@media (min-width: 760px) {
		.guide-cta-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.85rem;
		}

		.guide-cta-compact .guide-cta-grid {
			gap: 0.75rem;
		}
	}
</style>
