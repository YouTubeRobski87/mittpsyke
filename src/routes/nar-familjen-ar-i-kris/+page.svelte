<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';

	// Reflektionsövningen sparas bara i användarens egen webbläsare.
	// Ingenting skickas någonsin till servern - texten kan vara mycket privat.
	const STORAGE_KEY = 'mittpsyke_familjekris_reflektion';

	type ReflectionField = {
		id: string;
		label: string;
		help: string;
		placeholder: string;
	};

	const fields: ReflectionField[] = [
		{
			id: 'handelse',
			label: 'Vad hände?',
			help: 'Bara händelsen, som en kamera hade sett den. Vem sa vad, och när.',
			placeholder: 'Min syster bestämde tiden hos läkaren utan att fråga mig.'
		},
		{
			id: 'kansla',
			label: 'Vad kände jag?',
			help: 'Känslan i sig, utan att förklara eller försvara den.',
			placeholder: 'Förbisedd. Och arg, fast det egentligen var sorg.'
		},
		{
			id: 'behov',
			label: 'Vad behövde jag?',
			help: 'Det som saknades. Ofta något litet, som att bli tillfrågad.',
			placeholder: 'Att bli tillfrågad. Att räknas som en av dem som bryr sig.'
		},
		{
			id: 'senare',
			label: 'Vad vill jag säga senare?',
			help: 'När det är lugnt igen. Formulera det du faktiskt vill ska nå fram.',
			placeholder: 'Jag vill vara med i besluten, även när det går fort.'
		}
	];

	const messageTemplates = [
		{
			id: 'pausa',
			situation: 'När du vill pausa en konflikt',
			text: 'Jag vill inte lösa det här mitt i allt som händer nu. Jag är inte arg på dig. Jag behöver bara att vi tar det när vi båda orkar.'
		},
		{
			id: 'ensam',
			situation: 'När du känner dig ensam',
			text: 'Jag vet att ni också har det tungt. Men jag känner mig utanför i det här, och jag behöver få vara med i det som bestäms.'
		},
		{
			id: 'senare',
			situation: 'När du vill prata senare',
			text: 'Kan vi prata i lugn och ro någon gång de närmaste dagarna? Inte för att reda ut vem som gjort vad, utan för att jag vill att du ska veta hur jag har det.'
		}
	];

	let answers = $state<Record<string, string>>({
		handelse: '',
		kansla: '',
		behov: '',
		senare: ''
	});

	// Först efter att sparad text lästs in får $effect skriva tillbaka, annars
	// skulle det tomma utgångsläget skriva över det användaren redan hade.
	let isRestored = $state(false);
	let saveState = $state<'idle' | 'saved' | 'unavailable'>('idle');
	let copiedId = $state<string | null>(null);
	let copyFailedId = $state<string | null>(null);

	const hasAnyText = $derived(Object.values(answers).some((value) => value.trim().length > 0));

	onMount(() => {
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed: unknown = JSON.parse(stored);
				if (parsed && typeof parsed === 'object') {
					for (const field of fields) {
						const value = (parsed as Record<string, unknown>)[field.id];
						if (typeof value === 'string') answers[field.id] = value;
					}
				}
			}
		} catch {
			// Privat läge eller blockerad lagring. Övningen fungerar ändå,
			// den sparas bara inte - och det säger vi rakt ut i gränssnittet.
			saveState = 'unavailable';
		}
		isRestored = true;
	});

	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		// Läs alla fält så effekten körs om vid varje ändring.
		const snapshot = JSON.stringify({
			handelse: answers.handelse,
			kansla: answers.kansla,
			behov: answers.behov,
			senare: answers.senare
		});

		if (!isRestored || saveState === 'unavailable') return;

		// Skriv inget och påstå inget förrän användaren faktiskt skrivit något.
		// Utan den här spärren sa sidan "Sparat i den här webbläsaren" direkt vid
		// ett tomt besök, och lade en tom post i lagringen.
		const isEmpty = !hasAnyText;

		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				if (isEmpty) {
					window.localStorage.removeItem(STORAGE_KEY);
					saveState = 'idle';
					return;
				}
				window.localStorage.setItem(STORAGE_KEY, snapshot);
				saveState = 'saved';
			} catch {
				saveState = 'unavailable';
			}
		}, 600);

		return () => clearTimeout(saveTimer);
	});

	function clearReflection() {
		for (const field of fields) answers[field.id] = '';
		try {
			window.localStorage.removeItem(STORAGE_KEY);
		} catch {
			// Går inte att rensa lagringen - fälten är ändå tömda.
		}
		saveState = 'idle';
	}

	let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyMessage(id: string, text: string) {
		clearTimeout(copyResetTimer);
		copiedId = null;
		copyFailedId = null;
		try {
			await navigator.clipboard.writeText(text);
			copiedId = id;
			// Nollställs igen så bekräftelsen inte blir stående, och så att en ny
			// kopiering faktiskt läses upp: en aria-live-region annonserar inte om
			// texten är oförändrad sedan förra gången.
			copyResetTimer = setTimeout(() => (copiedId = null), 4000);
		} catch {
			// Utan klippbordsbehörighet får användaren markera texten själv.
			copyFailedId = id;
		}
	}

	const saveMessage = $derived(
		saveState === 'saved'
			? 'Sparat i den här webbläsaren.'
			: saveState === 'unavailable'
				? 'Din webbläsare tillåter inte sparning just nu. Det du skriver finns kvar så länge sidan är öppen.'
				: ''
	);

	const pageUrl = 'https://www.mittpsyke.se/nar-familjen-ar-i-kris';
</script>

<SEO canonical={pageUrl} />

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'När familjen är i kris men du själv hamnar utanför',
		url: pageUrl,
		mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
		description:
			'När en familjekris väcker rädsla, ilska och gamla konflikter. Få stöd att förstå känslorna, pausa konflikten och uttrycka vad du behöver.',
		inLanguage: 'sv-SE',
		about: [
			{ '@type': 'Thing', name: 'Familjekonflikter' },
			{ '@type': 'Thing', name: 'Anhörigstöd' },
			{ '@type': 'Thing', name: 'Ensamhet' }
		],
		audience: { '@type': 'Audience', audienceType: 'Anhöriga' },
		dateModified: '2026-07-31',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>När familjen är i kris men du själv hamnar utanför</h1>
			<p class="lead">
				När alla är rädda kan familjer reagera på helt olika sätt. Någon tar kontroll, någon drar
				sig undan och någon blir lämnad ensam med sina känslor.
			</p>
			<p class="lead-secondary">
				Den här sidan avgör inte vem som har rätt. Den finns för att du ska få syn på din egen
				reaktion, kunna pausa det som blivit låst och hitta orden till senare.
			</p>
		</header>

		<section class="section" aria-labelledby="forstaelse-rubrik">
			<h2 id="forstaelse-rubrik">Det du känner har oftast en förklaring</h2>

			<div class="prose">
				<h3>Rädsla ser inte likadan ut hos alla</h3>
				<p>
					När ett besked kommer gör familjen sällan samma sak. Någon börjar ringa, googla och boka
					tider. Någon blir tyst och går ut i köket. Någon skämtar. Någon säger att det nog inte är
					så farligt.
				</p>
				<p>
					Det är lätt att läsa varandras reaktioner som att någon bryr sig mer eller mindre. Oftast
					är det samma rädsla som tar sig olika uttryck. Den som organiserar står inte närmare — den
					har bara hittat något att göra med händerna.
				</p>

				<h3>När två blir ett team och du blir den tredje</h3>
				<p>
					I pressade lägen söker människor snabbt någon som tänker likadant. Två i familjen hittar
					varandra, pratar oftare, bestämmer i förbifarten. Det sker sällan medvetet. Men för dig
					som står utanför blir det tydligt: besluten är redan fattade när du får veta, och när du
					invänder låter det som att du bråkar om något som redan är klart.
				</p>
				<p>
					Att känna sig utanför i sin egen familj är en särskild sorts ensamhet. Den syns inte
					utåt, och den är svår att förklara utan att låta bitter.
				</p>

				<h3>Att bli den som alltid är jobbig</h3>
				<p>
					Det finns en roll i många familjer som ingen väljer. Den som säger fel sak. Den som tar
					upp det obekväma. Den som alla blir tysta omkring.
				</p>
				<p>
					När du väl har fått den rollen tolkas allt du säger genom den. En rimlig fråga låter som
					en anklagelse. En gräns låter som en attack. Du kan börja tro att det är något fel på
					dig, när det egentligen handlar om ett mönster som fanns långt före den här krisen.
				</p>

				<h3>Ilska är sällan bara ilska</h3>
				<p>
					Under det som låter som ilska ligger nästan alltid något annat: sorg som inte fått plats,
					rädsla ingen sagt högt, eller känslan av att inte bli förstådd.
				</p>
				<p>
					Det gäller dig. Det gäller också dem. Den som höjer rösten mot dig är ofta livrädd för
					något helt annat. Det gör inte orden mindre sårande, och du behöver inte ursäkta dem. Men
					det kan göra dem lite lättare att bära.
				</p>

				<h3>Gamla sår vaknar i nya kriser</h3>
				<p>
					Ni bråkar sällan bara om det som händer nu. Under diskussionen om vem som ska följa med
					till läkaren ligger tjugo år av vem som brukade bli lyssnad på, vem som fick bestämma och
					vem som fick ge med sig.
				</p>
				<p>
					Det är därför konflikten kan bli så mycket större än frågan. Om du märker att din
					reaktion är starkare än situationen betyder det sällan att du överreagerar. Det betyder
					oftast att något gammalt precis blev berört.
				</p>
			</div>
		</section>

		<section class="section" aria-labelledby="ovning-rubrik" id="reflektion">
			<h2 id="ovning-rubrik">Sortera det som hände</h2>
			<p class="section-intro">
				Fyra frågor som skiljer händelsen från känslan och känslan från behovet. Det är oftast där
				det låser sig: det vi säger handlar om vad den andra gjorde, när det vi menar handlar om
				vad vi själva saknade.
			</p>

			<div class="privacy-note">
				<p>
					Det du skriver stannar i den här webbläsaren och sparas medan du skriver. Ingenting
					skickas någonstans, och du kan radera allt när du vill.
				</p>
			</div>

			<form class="reflection" onsubmit={(event) => event.preventDefault()}>
				{#each fields as field (field.id)}
					<div class="field">
						<label for={`field-${field.id}`}>{field.label}</label>
						<p class="field-help" id={`help-${field.id}`}>{field.help}</p>
						<textarea
							id={`field-${field.id}`}
							aria-describedby={`help-${field.id}`}
							rows="3"
							placeholder={field.placeholder}
							bind:value={answers[field.id]}
						></textarea>
					</div>
				{/each}

				<div class="reflection-footer">
					<p class="save-status" aria-live="polite">{saveMessage}</p>
					{#if hasAnyText}
						<button type="button" class="text-button" onclick={clearReflection}>
							Radera det jag skrivit
						</button>
					{/if}
				</div>
			</form>
		</section>

		<section class="section" aria-labelledby="ikvall-rubrik">
			<h2 id="ikvall-rubrik">Du behöver inte lösa allt ikväll</h2>
			<p class="section-intro">
				Ingenting av det här måste redas ut medan alla fortfarande är rädda och trötta. Tre saker
				räcker för idag.
			</p>

			<ul class="card-grid">
				<li class="card">
					<h3>Pausa konflikten</h3>
					<p>
						Att pausa är inte att ge upp, och inte att låtsas som ingenting. Det är att säga: inte
						nu, inte så här. En konflikt som tas när båda är utmattade blir nästan alltid värre än
						den behövde bli.
					</p>
					<a class="card-link" href="#mallar">Hitta orden för en paus</a>
				</li>
				<li class="card">
					<h3>Säg vad du behöver</h3>
					<p>
						Det är lättare att bli hörd när du säger vad du behöver än när du förklarar vad någon
						annan gjorde fel. ”Jag behöver bli tillfrågad” landar annorlunda än ”ni frågar mig
						aldrig”.
					</p>
					<a class="card-link" href="#reflektion">Sortera vad du behöver</a>
				</li>
				<li class="card">
					<h3>Vänta med stora beslut</h3>
					<p>
						Kriser är dåliga rådgivare i frågor om att bryta kontakt, flytta eller säga upp sig.
						Det som känns akut ikväll ser oftast annorlunda ut om en vecka. Skjut upp det som går
						att skjuta upp.
					</p>
				</li>
			</ul>
		</section>

		<section class="section" aria-labelledby="mallar-rubrik" id="mallar">
			<h2 id="mallar-rubrik">Om du vill säga något men inte hittar orden</h2>
			<p class="section-intro">
				Tre korta meddelanden som varken anklagar eller ber om ursäkt. Använd dem som de är eller
				ändra tills de låter som du.
			</p>

			<ul class="template-list">
				{#each messageTemplates as template (template.id)}
					<li class="template">
						<p class="template-situation">{template.situation}</p>
						<blockquote>{template.text}</blockquote>
						<div class="template-actions">
							<button type="button" class="copy-button" onclick={() => copyMessage(template.id, template.text)}>
								Kopiera meddelandet
							</button>
							{#if copyFailedId === template.id}
								<span class="copy-hint">Kunde inte kopiera. Markera texten och kopiera manuellt.</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
			<p class="copy-status" aria-live="polite">
				{copiedId ? 'Meddelandet är kopierat.' : ''}
			</p>
		</section>

		<section class="section" aria-labelledby="vidare-rubrik">
			<h2 id="vidare-rubrik">Om det blir för tungt att bära själv</h2>
			<div class="prose">
				<p>
					Den här sidan är stöd för att tänka och formulera dig. Den är inte vård, och den kan inte
					bedöma din situation. Om du mår allt sämre, inte kan sova eller känner att du inte orkar
					mer behöver du få prata med en människa.
				</p>
				<p>
					Bär du dessutom oro för någon som är sjuk är det värt att veta att anhöriga ofta blir
					sist med att söka hjälp för egen del. Att du håller ihop det praktiska betyder inte att
					du har det bra.
				</p>
			</div>

			<ul class="link-list">
				<li>
					<a href="/ensamhet">Om ensamhet</a>
					<span>när känslan av att stå utanför sitter kvar även efter att krisen lagt sig.</span>
				</li>
				<li>
					<a href="/dagbok">Dagboken</a>
					<span>om du vill fortsätta skriva över tid i stället för en enstaka gång.</span>
				</li>
				<li>
					<a href="/chat">Samtalsstödet</a>
					<span>om du vill sätta ord på det i ett samtal, anonymt och utan att boka tid.</span>
				</li>
			</ul>

			<aside class="callout" aria-label="Akut hjälp">
				<h3>Om det är akut</h3>
				<p>
					Ring <a href="tel:112">112</a> vid fara för liv. För sjukvårdsrådgivning dygnet runt,
					ring 1177 eller besök
					<a href="https://www.1177.se/liv--halsa/psykisk-halsa/" target="_blank" rel="noopener noreferrer">1177 Vårdguiden</a>.
					På <a href="https://www.stodlinjer.se/" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>
					finns stödlinjer dit du kan ringa och prata anonymt.
				</p>
			</aside>
		</section>

		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 31 juli 2026</p>
			<h2>Källor</h2>
			<ul>
				<li>
					<a href="https://www.1177.se/liv--halsa/psykisk-halsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa – 1177 Vårdguiden</a>
				</li>
				<li>
					<a href="https://www.anhoriga.se/" target="_blank" rel="noopener noreferrer">Nationellt kompetenscentrum anhöriga</a>
				</li>
				<li>
					<a href="https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/anhoriga/" target="_blank" rel="noopener noreferrer">Stöd till anhöriga – Socialstyrelsen</a>
				</li>
			</ul>
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
		gap: clamp(2.4rem, 4vw, 3.2rem);
	}

	.hero {
		max-width: 720px;
		padding: clamp(1rem, 2vw, 1.25rem) 0 0.2rem;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: clamp(1.35rem, 1.2rem + 0.7vw, 1.6rem);
		font-weight: 750;
		line-height: 1.2;
	}

	h3 {
		font-size: clamp(1.08rem, 1rem + 0.35vw, 1.2rem);
		font-weight: 700;
		line-height: 1.3;
		margin-top: 2rem;
	}

	p {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin: 0;
	}

	.lead {
		font-size: clamp(1.08rem, 1rem + 0.55vw, 1.25rem);
		line-height: 1.6;
	}

	.lead-secondary {
		margin-top: 1rem;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	.section {
		max-width: 720px;
		display: grid;
		gap: 1rem;
	}

	.section-intro {
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	.prose {
		display: grid;
		gap: 1rem;
	}

	.prose h3:first-child {
		margin-top: 0.5rem;
	}

	/* ── Reflektionsövning ── */

	.privacy-note {
		border-left: 3px solid var(--primary-border-soft, rgba(67, 110, 143, 0.22));
		padding: 0.15rem 0 0.15rem 0.9rem;
	}

	.privacy-note p {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	.reflection {
		display: grid;
		gap: 1.4rem;
		margin: 0;
	}

	.field {
		display: grid;
		gap: 0.3rem;
	}

	label {
		font-family: var(--font-heading);
		font-size: 1.02rem;
		font-weight: 700;
		letter-spacing: -0.015em;
	}

	.field-help {
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	textarea {
		width: 100%;
		margin-top: 0.35rem;
		padding: 0.75rem 0.85rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.6;
		color: inherit;
		background: var(--color-surface, hsl(var(--surface)));
		border: 1px solid var(--color-border, hsl(var(--border)));
		border-radius: var(--radius-input);
		resize: vertical;
		min-height: 5.2rem;
	}

	textarea::placeholder {
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
		opacity: 0.75;
	}

	.reflection-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		min-height: 1.5rem;
	}

	.save-status {
		font-size: 0.88rem;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
		margin: 0;
	}

	.text-button {
		background: none;
		border: none;
		padding: 0.25rem 0;
		font-family: var(--font-body);
		font-size: 0.88rem;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.text-button:hover {
		color: inherit;
	}

	/* ── Kort ── */

	.card-grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 1rem;
	}

	.card {
		display: grid;
		gap: 0.55rem;
		align-content: start;
		padding: 1.15rem;
		border: 1px solid var(--color-border, hsl(var(--border)));
		border-radius: var(--radius-card);
		background: var(--primary-soft, rgba(67, 110, 143, 0.08));
	}

	.card p {
		font-size: 1rem;
		line-height: 1.65;
	}

	.card-link {
		justify-self: start;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Meddelandemallar ── */

	.template-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 1rem;
	}

	.template {
		display: grid;
		gap: 0.6rem;
		padding: 1.15rem;
		border: 1px solid var(--color-border, hsl(var(--border)));
		border-radius: var(--radius-card);
		background: var(--color-surface, hsl(var(--surface)));
	}

	.template-situation {
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	blockquote {
		margin: 0;
		font-size: clamp(1rem, 0.96rem + 0.3vw, 1.08rem);
		line-height: 1.65;
	}

	.template-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}

	.copy-button {
		padding: 0.5rem 1.1rem;
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 600;
		color: var(--primary);
		background: none;
		border: 1.5px solid var(--primary-border-soft, rgba(67, 110, 143, 0.22));
		border-radius: var(--radius-pill);
		cursor: pointer;
		transition: background-color 0.2s ease, border-color 0.2s ease;
	}

	.copy-button:hover {
		background: var(--primary-soft-hover, rgba(67, 110, 143, 0.14));
		border-color: var(--primary);
	}

	.copy-hint,
	.copy-status {
		font-size: 0.88rem;
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
		margin: 0;
	}

	.copy-status {
		min-height: 1.3rem;
	}

	/* ── Länkar och avslut ── */

	.link-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.7rem;
	}

	.link-list li {
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.6;
	}

	.link-list a {
		font-weight: 600;
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.link-list span {
		color: var(--color-text-muted, hsl(var(--muted-foreground)));
	}

	.callout {
		border: 1px solid var(--color-border, hsl(var(--border)));
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: var(--color-surface-muted, hsl(var(--surface-muted)));
	}

	.callout h3 {
		font-size: 1.15rem;
		font-weight: 700;
		margin-top: 0;
		margin-bottom: 0.45rem;
	}

	.callout p {
		font-size: 1rem;
		line-height: 1.65;
	}

	.callout a {
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Källor ── */

	.source-block {
		max-width: 720px;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border, hsl(var(--border)));
	}

	.source-block .updated-date {
		font-size: 0.8rem;
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.source-block h2 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.source-block ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.source-block li {
		font-size: 0.85rem;
	}

	.source-block a {
		color: inherit;
		opacity: 0.7;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.source-block a:hover {
		opacity: 1;
	}

	/* Mörkt läge.
	   --primary (#436e8f) är avsedd för ljus bakgrund och landar på 3,0-3,4 i
	   kontrast mot den mörka ytan, alltså under AA. Sajten har --primary-dark
	   för just det här, så alla länkar och knappar byter till den. */
	:global(.dark) .card-link,
	:global(.dark) .link-list a,
	:global(.dark) .callout a,
	:global(.dark) .copy-button {
		color: var(--primary-dark, #7dd3fc);
	}

	:global(.dark) .copy-button {
		border-color: var(--primary-dark-border-soft, rgba(125, 211, 252, 0.28));
	}

	:global(.dark) .copy-button:hover {
		background: var(--primary-dark-soft-hover, rgba(125, 211, 252, 0.16));
		border-color: var(--primary-dark, #7dd3fc);
	}

	:global(.dark) .card {
		background: var(--primary-dark-soft, rgba(125, 211, 252, 0.1));
	}

	:global(.dark) .privacy-note {
		border-left-color: var(--primary-dark-border-soft, rgba(125, 211, 252, 0.28));
	}

	/* Från 640 px och uppåt får korten stå bredvid varandra. Mobilen först:
	   en kolumn är utgångsläget ovan. */
	@media (min-width: 640px) {
		.card-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		p {
			font-size: 1.02rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.copy-button {
			transition: none;
		}
	}
</style>
