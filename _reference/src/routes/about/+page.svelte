<script lang="ts">
	import {
		EmojiRosePink,
		EmojiRoseAmber,
		EmojiRoseBlue,
		EmojiRoseLime,
		EmojiRoseRed,
		EmojiWomanLaptopPink,
		EmojiWomanLaptopAmber,
		EmojiWomanLaptopBlue,
		EmojiWomanLaptopLime,
		EmojiWomanLaptopRed,
		EmojiTools
	} from '$lib/assets/emojis';
	import { accentStore } from '$lib/stores/accent.svelte';
	import LegalFooter from '$lib/components/LegalFooter.svelte';

	const roseComponents = {
		pink: EmojiRosePink,
		amber: EmojiRoseAmber,
		blue: EmojiRoseBlue,
		lime: EmojiRoseLime,
		red: EmojiRoseRed
	};

	const laptopComponents = {
		pink: EmojiWomanLaptopPink,
		amber: EmojiWomanLaptopAmber,
		blue: EmojiWomanLaptopBlue,
		lime: EmojiWomanLaptopLime,
		red: EmojiWomanLaptopRed
	};

	let RoseIcon = $derived(roseComponents[accentStore.current]);
	let LaptopIcon = $derived(laptopComponents[accentStore.current]);
</script>

<main class="legal-page">
	<div class="page-header">
		<RoseIcon size={96} />
		<h1>Om Storify</h1>
	</div>

	<section>
		<h2>En dagbok för oss som aldrig skriver dagbok</h2>
		<p>Du vet de där fina anteckningsböckerna du köpt med de bästa intentioner? De som ligger i en låda någonstans med kanske tre inlägg – varav det sista börjar med "Oj, det var länge sen..."?</p>
		<p>Storify är för oss. För alla som vill minnas sin vardag men som inte har tid, ork eller inspiration att faktiskt sätta sig ner och skriva. Gå igenom en guide med frågor om din dag, välj en av 28 unika röster som passar ditt humör, och låt AI:n göra det jobbiga – själva skrivandet.</p>
	</section>

	<section>
		<h2>Vad kan appen göra?</h2>
		<p>Storify erbjuder fyra sätt att skapa din dagbokstext. Den <strong>fullständiga guiden</strong> tar dig genom en steg-för-steg-wizard där du berättar om din dag – allt från humör och energinivå till aktiviteter, vinster, motgångar och reflektioner. Du kan välja emojis som sammanfattar din dag, beskriva vad du ätit och lyssnat på, och till och med skriva en tidskapsel – ett meddelande till ditt framtida jag som vävs in i dagbokstexten.</p>
		<p>Har du ont om tid? <strong>Snabbläget</strong> låter dig fånga dagens känsla på under en minut – berätta kort om din dag, välj en röst, och få en dagbokstext direkt. Perfekt för hektiska dagar när du ändå vill hålla vanan vid liv.</p>
		<p>Föredrar du att prata istället för att fylla i fält? I <strong>AI-intervjun</strong> chattar du med en AI som ställer frågor om din dag – som att prata med en nyfiken vän som vill veta allt. När samtalet är klart skapas din dagbokstext utifrån det ni pratat om.</p>
		<p>Vill du skriva själv? <strong>Skriv fritt</strong> ger dig en textredigerare där du skriver fritt, med AI-stöd som kan förfina och polera din text när du är klar.</p>
		<p>Appen hämtar vädret automatiskt baserat på din position och kan fylla i din plats åt dig. Vill du krydda din dagbok lite extra? Lägg till ett personligt horoskop, historiska händelser som inträffat på samma datum, eller en liten "hemläxa" – en reflektion eller utmaning baserad på din dag.</p>
		<p>När texten är klar kan du spara den som bild eller PDF, kopiera den, eller skicka den som e-post. Skapar du ett konto kan du dessutom spara dina dagboksinlägg i ett personligt dagboksarkiv online och komma åt dem när som helst. Du får även tillgång till en kalender där du kan följa din skrivresa, se din streak och få en överblick över hur ofta du skriver.</p>
		<p>Storify finns som webbapp och som Android-app.</p>
	</section>

	<section>
		<h2>28 röster – från poetisk till pinsam</h2>
		<p>Det som gör Storify unikt är rösterna. Välj mellan 28 helt olika skrivstilar: klassisk dagbok, sportkommentator, kattperspektiv, Shakespeare, kvällstidning, meme-språk, byråkratisk myndighetsstil – och mycket mer. Samma dag kan bli helt olika beroende på vilken röst du väljer. Kan du inte bestämma dig? Låt appen överraska dig med en slumpmässig röst.</p>
	</section>

	<section>
		<h2>Varför jag byggde det här</h2>
		<div class="about-johanna">
			<div class="johanna-avatar">
				<LaptopIcon size={96} />
			</div>
			<div class="johanna-text">
				<p>Jag heter Johanna, är 36 år och bor i Göteborg. På fritiden kodar jag (självlärd, på hobbynivå), syr mina egna kläder, och försöker hålla mina krukväxter vid liv. Ibland lyckas jag med alla tre samtidigt.</p>
			</div>
		</div>
		<p>Storify började som ett litet hobbyprojekt en kväll när jag tänkte: "Tänk om jag kunde få hjälp att skriva dagbok istället för att bara tänka att jag borde göra det?" Några kaffekoppar och kodningskvällar senare var appen född.</p>
	</section>

	<section>
		<h2>Vill du vara med och utveckla projektet?</h2>
		<div class="contribute-box">
			<div class="contribute-icon">
				<EmojiTools size={64} />
			</div>
			<div class="contribute-text">
				<p>Storify är open source! Har du idéer, hittat en bugg, eller vill bidra med kod? Projektet finns på GitHub och alla bidrag är välkomna.</p>
				<a href="https://github.com/johannaefageras/storify" target="_blank" rel="noopener noreferrer">Se källkoden på GitHub</a>
			</div>
		</div>
	</section>

	<section>
		<h2>Filosofin bakom</h2>
		<p>Dagboksskrivande ska vara enkelt, träffsäkert och – vågar jag säga det – roligt. Ibland vill man ha en poetisk reflektion över livet. Ibland vill man bara att en uttråkad AI konstaterar att man åt pasta igen. Båda är lika giltiga.</p>
		<p>Målet är att du ska le när du läser din dagbokstext. Eller skratta. Eller känna igen dig. Helst allt på en gång.</p>
	</section>

	<section>
		<h2>Tack för att du är här</h2>
		<p>Att du använder något jag byggt på sena kvällar med för mycket kaffe betyder enormt mycket. Har du tankar, idéer eller bara vill säga hej? <a href="/contact">Hör av dig!</a></p>
	</section>

	<LegalFooter />
</main>

<style>
	.legal-page {
		max-width: 720px;
		margin: 0 auto;
		padding: 2rem;
		padding-top: calc(env(safe-area-inset-top, 0px) + 2rem);
		padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	h1 {
		font-family: var(--font-primary);
		font-size: var(--text-2xl);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin-bottom: 0;
		text-align: center;
	}

	.about-johanna {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		background: var(--color-bg-elevated);
		padding: 1.25rem;
		border-radius: var(--radius-md);
		margin-bottom: 1rem;
	}

	.johanna-avatar {
		flex-shrink: 0;
	}

	.johanna-text p {
		margin-bottom: 0;
	}

	.contribute-box {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		background: var(--color-bg-elevated);
		padding: 1.25rem;
		border-radius: var(--radius-md);
	}

	.contribute-icon {
		flex-shrink: 0;
	}

	.contribute-text p {
		margin-bottom: 0.5rem;
	}

	h2 {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin-bottom: 0.75rem;
	}

	section {
		margin-bottom: 2rem;
	}

	p {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	p:last-child {
		margin-bottom: 0;
	}

	a {
		color: var(--color-accent);
		text-decoration: none;
		font-weight: var(--weight-medium);
		transition: color 0.2s ease;
	}

	a:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (max-width: 480px) {
		.about-johanna,
		.contribute-box {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
