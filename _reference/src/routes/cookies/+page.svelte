<script lang="ts">
	import { accentStore } from '$lib/stores/accent.svelte';
	import {
		EmojiCookie,
		EmojiDiamondPink,
		EmojiDiamondAmber,
		EmojiDiamondBlue,
		EmojiDiamondLime,
		EmojiDiamondRed
	} from '$lib/assets/emojis';
	import LegalFooter from '$lib/components/LegalFooter.svelte';

	const diamondComponents = {
		pink: EmojiDiamondPink,
		amber: EmojiDiamondAmber,
		blue: EmojiDiamondBlue,
		lime: EmojiDiamondLime,
		red: EmojiDiamondRed
	};

	let DiamondIcon = $derived(diamondComponents[accentStore.current]);
</script>

<main class="legal-page">
	<div class="page-header">
		<EmojiCookie size={96} />
		<h1>Cookiepolicy</h1>
	</div>
	<p class="updated">Senast uppdaterad: 8 februari 2026</p>

	<section>
		<h2>Den korta versionen</h2>
		<p>Storify använder inga cookies för reklam, spårning eller analys. De enda cookies som finns är de som krävs för att hålla dig inloggad om du skapar ett konto. Använder du appen utan konto sätts inga cookies alls.</p>
	</section>

	<section>
		<h2>Vad är cookies egentligen?</h2>
		<p>Cookies är små textfiler som webbplatser kan spara i din webbläsare. De används ofta för att komma ihåg inställningar, hålla dig inloggad, eller spåra ditt beteende för reklam och analys. Cookies skickas fram och tillbaka mellan din enhet och webbservern vid varje sidladdning.</p>
	</section>

	<section>
		<h2>Om du använder Storify utan konto</h2>
		<p>Använder du appen utan att logga in sätts inga cookies. Istället använder Storify lokal lagring direkt på din enhet för att spara din profil och dina inställningar. Denna data skickas aldrig automatiskt till någon server och är bara tillgänglig för appen själv.</p>
		<p>Vi sparar följande lokalt på din enhet:</p>
		<div class="custom-ul">
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content"><strong>Din profil:</strong> Namn, ålder, intressen och annan information du fyller i för att personalisera dina dagbokstexter</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content"><strong>Temainställningar:</strong> Om du föredrar ljust eller mörkt läge</span>
			</div>
		</div>
		<p>Du kan när som helst radera all lokalt sparad data genom att trycka på "Rensa sparad data" på startsidan.</p>
	</section>

	<section>
		<h2>Om du skapar ett konto och loggar in</h2>
		<p>När du loggar in sätts en funktionell cookie av vår autentiseringstjänst (Supabase) för att hålla din session aktiv. Utan den skulle du behöva logga in på nytt vid varje sidladdning.</p>
		<p>Denna cookie:</p>
		<div class="custom-ul">
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Innehåller enbart sessionsinformation – ingen personlig data</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Används inte för spårning, reklam eller analys</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Tas bort när du loggar ut</span>
			</div>
		</div>
		<p>Som inloggad sparas din profil och dina dagboksinlägg i molnet (via Supabase) istället för enbart lokalt, så att du kan komma åt dem från olika enheter.</p>
	</section>

	<section>
		<h2>Tredjepartscookies</h2>
		<p>Vi använder inga tredjepartscookies. Det betyder:</p>
		<div class="custom-ul">
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Ingen spårning från reklamtjänster</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Inga analysverktyg som Google Analytics</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Inga sociala media-knappar som laddar externa cookies</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content">Ingen delning av din data med annonsörer</span>
			</div>
		</div>
	</section>

	<section>
		<h2>Cookies kontra lokal lagring</h2>
		<p>Det finns en viktig skillnad mellan cookies och lokal lagring:</p>
		<div class="custom-ul">
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content"><strong>Cookies:</strong> Skickas till servern vid varje förfrågan, kan läsas av webbplatsen och ibland av tredje part</span>
			</div>
			<div class="custom-li">
				<span class="list-icon"><DiamondIcon size={12} /></span>
				<span class="list-content"><strong>Lokal lagring:</strong> Stannar på din enhet, skickas aldrig automatiskt till någon server, och är endast tillgänglig för appen själv</span>
			</div>
		</div>
		<p>Storify använder lokal lagring för din profil och dina inställningar. Den enda cookien som kan sättas är den funktionella sessionscookien vid inloggning.</p>
	</section>

	<section>
		<h2>Varför vi valt att minimera cookies</h2>
		<p>Vi tror att din dagbok är privat. Genom att undvika spårningscookies och hålla så mycket data som möjligt lokalt på din enhet minimerar vi risken för dataläckor och säkerställer att du har kontroll över din information. Det är helt enkelt det rätta sättet att bygga en dagboksapp.</p>
	</section>

	<section>
		<h2>Frågor?</h2>
		<p>Har du funderingar kring hur vi hanterar data? Kontakta oss på <a href="mailto:johanna@mystorify.se">johanna@mystorify.se</a>.</p>
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
		margin-bottom: 0.5rem;
	}

	h1 {
		font-family: var(--font-primary);
		font-size: var(--text-2xl);
		font-weight: var(--weight-medium);
		color: var(--color-text);
		margin-bottom: 0;
		text-align: center;
	}

	.updated {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		margin-bottom: 2.5rem;
		letter-spacing: var(--tracking-wide);
		text-align: center;
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

	.custom-ul {
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.custom-li {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--color-text-muted);
	}

	.list-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 21px;
		padding-top: 2px;
		color: var(--color-accent);
	}

	.list-content {
		flex: 1;
	}

	.list-content strong {
		color: var(--color-text);
		font-weight: var(--weight-medium);
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
</style>
