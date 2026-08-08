<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';

	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Är MittPsyke ett alternativ till psykolog eller vård?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Nej. MittPsyke är ett stöd för reflektion och nästa steg, inte vård, diagnos eller behandling. När du behöver professionell bedömning är vården rätt väg.'
				}
			},
			{
				'@type': 'Question',
				name: 'När ska jag kontakta 1177 eller ringa 112?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Kontakta 1177 när du behöver vårdråd eller vägledning till vården. Ring 112 vid akut fara eller om någon riskerar att skadas.'
				}
			}
		]
	};
</script>

<SeoHead
	title="MittPsyke, psykolog eller vården – vilket stöd passar?"
	description="Jämför MittPsyke, psykolog, vårdcentral, psykiatri och 1177. Få hjälp att välja nästa steg när du behöver stöd för ditt mående."
	canonical="https://www.mittpsyke.se/mittpsyke-psykolog-eller-varden"
	og={{
		title: 'MittPsyke, psykolog eller vården – vilket stöd passar?',
		description: 'En lugn guide till vilket stöd som kan passa just nu.',
		url: 'https://www.mittpsyke.se/mittpsyke-psykolog-eller-varden'
	}}
/>

<svelte:head>
	<script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
</svelte:head>

<main class="page">
	<div class="page-container">
		<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Vilket stöd passar?' }]} />
		<header class="hero">
			<p class="eyebrow">Hitta nästa steg</p>
			<h1>MittPsyke, psykolog eller vården – vilket stöd passar när?</h1>
			<p>Du behöver inte veta exakt vad du behöver för att börja. Här är en enkel översikt som kan hjälpa dig välja en väg som känns rimlig just nu.</p>
		</header>

		<section class="notice" aria-labelledby="important-title">
			<h2 id="important-title">Viktigt att veta</h2>
			<p>MittPsyke är anonymt samtalsstöd och reflektion i text. Det ersätter inte vård, bedömning, diagnos eller behandling. Vid akut fara: ring <a href="tel:112">112</a>. För vårdråd: <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>.</p>
		</section>

		<section class="section" aria-labelledby="overview-title">
			<h2 id="overview-title">En snabb överblick</h2>
			<div class="options">
				<article><h3>MittPsyke</h3><p>Kan passa när du vill skriva av dig, sortera tankar, reflektera över hur du mår eller förbereda vad du vill säga till vården.</p></article>
				<article><h3>Psykolog eller psykoterapeut</h3><p>Kan passa när du vill ha återkommande samtal med en legitimerad yrkesperson och arbeta med sådant som påverkar dig över tid.</p></article>
				<article><h3>Vårdcentral eller psykiatri</h3><p>Rätt väg när du behöver professionell bedömning, medicinsk hjälp eller samordnad vård.</p></article>
				<article><h3>1177 och akut hjälp</h3><p>1177 kan ge vårdråd och vägledning. Vid akut fara eller risk att någon skadas, ring 112.</p></article>
			</div>
		</section>

		<section class="section">
			<h2>När MittPsyke kan vara en lugn start</h2>
			<p>Du kan börja här om du inte vet vilken hjälp du söker ännu, eller om det känns lättare att sätta ord på det i egen takt. Det kan till exempel handla om att:</p>
			<ul>
				<li>skriva av dig när tankarna är många</li>
				<li>sortera vad som känns svårt just nu</li>
				<li>förstå återkommande mönster genom egna reflektioner</li>
				<li>förbereda frågor eller ord inför kontakt med vården</li>
				<li>hitta ett möjligt nästa steg</li>
			</ul>
			<p>Du väljer själv vad du vill använda och vad du vill lämna därhän.</p>
			<p class="links"><a href="/chatta-anonymt">Chatta anonymt utan konto</a><a href="/anonym-dagbok-online">Skriv i anonym dagbok</a><a href="/digital-dagbok-for-maende">Läs om dagboken</a></p>
		</section>

		<section class="section">
			<h2>När professionell vård är mer lämplig</h2>
			<p>Ta kontakt med vården när du behöver en professionell bedömning, när besvären påverkar vardagen mycket eller när du mår sämre. Du kan börja via <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a> eller din vårdcentral. Psykiatrin kan vara aktuell när behovet är mer specialiserat eller när vårdcentralen hänvisar dig vidare.</p>
			<p>Vid akut fara, eller om du eller någon annan riskerar att skadas, ska du ringa <a href="tel:112">112</a>. För vidare stöd finns också <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.</p>
		</section>

		<section class="section">
			<h2>Om du inte vet var du ska börja</h2>
			<p>Det är vanligt att inte kunna sätta en tydlig etikett på hur man mår. Börja gärna med en mening i <a href="/dagbok?action=new">dagboken</a>, prova en lugn <a href="/ovningar">övning</a> eller läs våra <a href="/guider">guider</a>. Om du hellre vill få vårdråd kan du välja 1177 direkt.</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Är MittPsyke ett alternativ till psykolog eller vård?</h3>
			<p>Nej. MittPsyke är ett stöd för reflektion och nästa steg, inte vård, diagnos eller behandling. När du behöver professionell bedömning är vården rätt väg.</p>
			<h3>När ska jag kontakta 1177 eller ringa 112?</h3>
			<p>Kontakta 1177 när du behöver vårdråd eller vägledning till vården. Ring 112 vid akut fara eller om någon riskerar att skadas.</p>
		</section>
	</div>
</main>

<style>
	.page { padding: clamp(2rem, 6vw, 3rem) 1.25rem clamp(3rem, 8vw, 4.5rem); }
	.page-container { max-width: 840px; margin: 0 auto; display: grid; gap: clamp(1.4rem, 3vw, 2rem); }
	.hero, .section, .notice { max-width: 720px; }
	.eyebrow { color: hsl(var(--primary)); font: 650 0.8rem var(--font-heading); letter-spacing: .08em; text-transform: uppercase; }
	h1, h2, h3 { font-family: var(--font-heading); letter-spacing: -.02em; margin: 0; }
	h1 { font-size: clamp(2rem, 1.5rem + 2vw, 2.7rem); line-height: 1.08; }
	h2 { font-size: clamp(1.25rem, 1.1rem + .7vw, 1.5rem); }
	h3 { font-size: 1.05rem; }
	p, li { font: 1rem/1.7 var(--font-body); margin: 0; }
	.hero, .section { display: grid; gap: .85rem; }
	.notice { padding: 1.1rem 1.2rem; display: grid; gap: .55rem; border: 1px solid hsl(var(--border)); border-radius: var(--radius-card); background: hsl(var(--surface-soft)); }
	.options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
	.options article { padding: 1rem; display: grid; gap: .45rem; border: 1px solid hsl(var(--border)); border-radius: var(--radius-card); background: hsl(var(--surface)); }
	ul { display: grid; gap: .35rem; margin: 0; padding-left: 1.25rem; }
	a { text-decoration: underline; text-underline-offset: 2px; }
	.links { display: flex; flex-wrap: wrap; gap: .85rem; }
	.faq h3:not(:first-of-type) { margin-top: .4rem; }
	@media (max-width: 640px) { .options { grid-template-columns: 1fr; } }
</style>
