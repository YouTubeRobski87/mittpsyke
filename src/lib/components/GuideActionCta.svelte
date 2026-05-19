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

	const toneByPillar: Record<string, GuideTone> = {
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
			chatCopy: 'Sätt ord på det som håller dig vaken, i din egen takt och utan krav på att formulera allt.',
			diaryCopy: 'Skriv av dig kvällstankarna och ge dem en tydlig plats utanför huvudet.',
			exerciseCopy: 'Prova en kort övning för att hjälpa kroppen att varva ned inför sömnen.',
			supportCopy: 'Om sömnproblemen påverkar ditt mående allvarligt finns stödlinjer och vårdråd nära till hands.'
		},
		sjalvkansla: {
			heading: 'Nästa steg mot bättre självkänsla',
			intro: 'Förändring sker i liten skala. Välj ett steg som känns möjligt just nu.',
			chatCopy: 'Prata anonymt om det som känns svårt att säga högt, i lugn och trygg takt.',
			diaryCopy: 'Skriv ned tankar om dig själv och följ hur självbilden förändras över tid.',
			exerciseCopy: 'Prova en enkel övning som hjälper dig att möta dig själv med lite mer värme.',
			supportCopy: 'Om du behöver mer stöd kan du hitta rätt stödlinje eller kontakt här.'
		},
		panikattack: {
			heading: 'Nästa steg vid panikattacker',
			intro: 'Det värsta brukar gå över. Välj ett litet steg när du känner dig redo.',
			chatCopy: 'Prata anonymt om det som utlöser rädslan och vad som händer i kroppen, i din takt.',
			diaryCopy: 'Skriv ned mönster och tankar kring dina panikattacker för att förstå dem bättre.',
			exerciseCopy: 'Prova en enkel andnings- eller jordningsövning som hjälper kroppen att landa.',
			supportCopy: 'Om panikattackerna är frekventa eller begränsar vardagen finns stöd att få.'
		},
		ensamhet: {
			heading: 'Nästa steg vid ensamhet',
			intro: 'Ensamhet gör ont, men du behöver inte hantera det helt ensam. Ta ett steg i taget.',
			chatCopy: 'Sätt ord på ensamhetskänslan anonymt och bli sedd utan krav på prestation.',
			diaryCopy: 'Skriv om hur ensamheten tar sig uttryck och vad du längtar efter.',
			exerciseCopy: 'Prova en enkel övning som hjälper dig att känna mer kontakt med dig själv.',
			supportCopy: 'Om ensamheten tynger mycket kan en stödlinje ge ett tryggt första samtal.'
		},
		overtankande: {
			heading: 'Nästa steg vid övertänkande',
			intro: 'Tankarna behöver inte lösas – ibland räcker det att ge dem en plats. Välj ett litet steg.',
			chatCopy: 'Prata anonymt om det tankarna fastnat på och få lite perspektiv i lugn takt.',
			diaryCopy: 'Skriv ned tankarna och ta dem ur huvudet – det minskar ofta snurrandet.',
			exerciseCopy: 'Prova en enkel närvaro- eller fokusövning som hjälper tankarna att sakta ned.',
			supportCopy: 'Om övertänkandet påverkar vardagen allvarligt finns stöd och råd att nå.'
		}
	};

	const fallbackTone: GuideTone = {
		heading: 'Nästa steg i lugn takt',
		intro: 'Välj den väg som känns mest hjälpsam just nu.',
		chatCopy: 'Vill du sätta ord på det som känns svårt? Chatta anonymt i lugn takt.',
		diaryCopy: 'Vill du fånga tankar innan de försvinner? Skriv i dagboken.',
		exerciseCopy: 'Vill du ta ett konkret steg? Börja med en enkel övning.',
		supportCopy: 'Behöver du mänsklig kontakt? Se stödlinjer och akut hjälp.'
	};

	const tone = $derived(toneByPillar[pillarSlug] ?? fallbackTone);
</script>

<section class="guide-cta" class:guide-cta-compact={layout === 'compact'} aria-label="Nästa steg">
	<h2>{tone.heading}</h2>
	<p class="guide-cta-intro">{tone.intro}</p>

	<div class="guide-cta-grid">
		<a class="guide-cta-card" href={chatHref}>
			<h3>Chatta anonymt nu</h3>
			<p>{tone.chatCopy}</p>
			<span>Starta chatt</span>
		</a>

		<a class="guide-cta-card" href="/dagbok">
			<h3>Skriv i dagboken</h3>
			<p>{tone.diaryCopy}</p>
			<span>Öppna dagboken</span>
		</a>

		<a class="guide-cta-card" href={exerciseHref}>
			<h3>Gör en enkel övning</h3>
			<p>{tone.exerciseCopy}</p>
			<span>{exerciseLabel}</span>
		</a>

		<a
			class="guide-cta-card"
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
		>
			<h3>Hitta rätt stödlinje</h3>
			<p>{tone.supportCopy}</p>
			<span>Se stödlinjer</span>
		</a>
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
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: #f5f6f8;
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
		background: rgba(15, 23, 42, 0.06);
		font-size: 0.82rem;
		color: #334155;
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
		background: #111827;
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
		background: #171f2d;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .guide-cta-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .guide-cta-card p {
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.dark) .guide-cta-card span {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
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
