<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { dataflowCopy } from '$lib/dataflow-copy';
</script>

<SEO canonical="https://mittpsyke.se/ai-samtalsstod-online" />

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>AI-samtalsstöd online och lokal dagbok</h1>
			<p>
				Här kan du chatta med AI utan konto eller skriva lokalt i en digital dagbok. Du behöver inte förklara allt direkt – ibland räcker det att börja med några ord.
			</p>
			<p>
				Här kan du använda en digital dagbok, få stöd i dina tankar eller bara vara i det som känns, utan press.
			</p>
			<p>
				<a href="/chatta-anonymt-med-nagon">Chatta anonymt med någon</a> eller
				<a href="/skriv">skriva av dig i en digital dagbok</a>.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat">Öppna chatten</a>
			<a class="cta-button ghost" href="/psykiskt-stod-online">Läs om psykiskt stöd online</a>
		</div>

		<section class="section">
			<h2>Ett digitalt stöd i lugn takt</h2>
			<p>
				MittPsyke är till för reflektion, inte för att pressa fram snabba svar. Du kan börja utan konto
				och välja om du vill chatta med AI, skriva lokalt i dagboken eller läsa någon av guiderna.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/anonymt-samtalstod-online">Anonymt samtalsstöd online</a> när du vill börja utan press.</li>
				<li><a href="/dagbok">Dagbok</a> för att skriva av dig och få mer kontinuitet.</li>
				<li><a href="/guider">Guider</a> när du vill läsa mer i lugn takt.</li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a> om du vill förstå tjänsten bättre innan du börjar.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Om du vill spara historik över tid kan du <a href="/register">skapa konto</a>. Du kan också börja
				med chatten direkt eller läsa mer om hur tjänsten fungerar.
			</p>
			<p class="links-row">
				<a href="/chat">Starta samtal</a>
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja utan konto och skapa en egen plats senare om du vill spara historik.</p>
			<h3>Ersätter detta vård?</h3>
			<p>Nej. MittPsyke är ett digitalt samtalsstöd och ett komplement till vård.</p>
			<h3>Kan jag börja i lugn takt?</h3>
			<p>Ja. Tjänsten är byggd för små steg och ett varsamt tempo.</p>
			<h3>Vad händer med det jag skriver?</h3>
			<p>
				<strong>Lokalt skrivande:</strong> {dataflowCopy.anonymousDiary.short}
				<strong>AI-chatt utan konto:</strong> {dataflowCopy.guestChat.aiTransfer}
				{dataflowCopy.guestChat.retention} {dataflowCopy.accountChat.storage}
				{dataflowCopy.accountChat.retention} Läs mer i <a href="/integritet">integritetspolicyn</a> och om hur
				AI-stödet är byggt i <a href="/ansvarsfull-ai">Ansvarsfull AI</a>.
			</p>
		</section>
		<!-- Källor och uppdatering -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 14 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li><a href="https://www.1177.se/liv--halsa/psykisk-halsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa – 1177 Vårdguiden</a></li>
				<li><a href="https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa – Folkhälsomyndigheten</a></li>
				<li><a href="https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa och suicidprevention – Socialstyrelsen</a></li>
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
		gap: clamp(1.3rem, 3vw, 1.8rem);
	}

	.hero,
	.section {
		max-width: 720px;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
	}

	h3 {
		font-size: 1rem;
		margin-top: 0.9rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.cta-container {
		max-width: 720px;
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
		color: white;
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

	.faq p + h3 {
		margin-top: 1rem;
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

	.source-block {
		margin-top: clamp(2rem, 4vw, 3rem);
		padding-top: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
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
</style>
