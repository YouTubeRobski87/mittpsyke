<script lang="ts">
	interface MoodColor {
		id: string;
		name: string;
		hex: string;
		hexDark: string;
		keywords: string[];
		meaning: string;
	}

	const moodColors: MoodColor[] = [
		{ id: 'red',    name: 'Röd',     hex: '#e52020', hexDark: '#f04848', keywords: ['passion', 'energi', 'intensitet', 'ilska', 'kärlek', 'mod'],                    meaning: 'En dag präglad av stark intensitet och känslor. Kan indikera passion, djup kärlek, frustration eller ilska, men också mod och handlingskraft.' },
		{ id: 'pink',   name: 'Rosa',    hex: '#f43f7a', hexDark: '#ff5c8d', keywords: ['ömhet', 'kärlek', 'lekfullhet', 'mjukhet', 'omtanke'],                          meaning: 'En mjuk och kärleksfull dag. Antyder ömhet, romantik eller lekfullhet. Kan handla om nära relationer, självomhändertagande eller en dag då du känt dig extra omtänksam.' },
		{ id: 'purple', name: 'Lila',    hex: '#9b50d8', hexDark: '#be82f8', keywords: ['kreativitet', 'mystik', 'drömmar', 'fantasi', 'inspiration'],                   meaning: 'En kreativ eller drömsk dag med inslag av mystik och fantasi. Du kan ha ägnat dig åt konstnärliga aktiviteter, haft livliga dagdrömmar eller känt en koppling till något större.' },
		{ id: 'indigo', name: 'Indigo',  hex: '#5c5ce0', hexDark: '#8080f4', keywords: ['intuition', 'djupa tankar', 'visdom', 'eftertanke', 'insikt'],                  meaning: 'En introspektiv dag fylld av djupa tankar och eftertanke. Antyder att du funderat över livets stora frågor, lyssnat på din intuition eller fått nya insikter om dig själv.' },
		{ id: 'blue',   name: 'Blå',     hex: '#3570d0', hexDark: '#5a96f0', keywords: ['lugn', 'tillit', 'stabilitet', 'melankoli', 'trygghet'],                        meaning: 'En lugn och stabil dag, men kan också ha nyanser av melankoli eller vemod. Du har troligen känt dig trygg och tillfreds, eller möjligen lite nedstämd på ett stillsamt, reflekterande sätt.' },
		{ id: 'sky',    name: 'Azur',    hex: '#2b8db8', hexDark: '#42aad6', keywords: ['frihet', 'hopp', 'lätthet', 'möjligheter', 'optimism'],                         meaning: 'En lätt och hoppfull dag som en klarblå himmel. Du har troligen känt dig fri, sett möjligheter framför dig eller upplevt en befriande lätthet och öppenhet.' },
		{ id: 'cyan',   name: 'Cyan',    hex: '#0ca8c0', hexDark: '#28cce0', keywords: ['klarhet', 'förnyelse', 'friskhet', 'fokus', 'energi'],                          meaning: 'En frisk och klar dag med känsla av förnyelse. Kan indikera mental klarhet, nya perspektiv eller en uppfriskande förändring. Du har troligen känt dig alert och fokuserad.' },
		{ id: 'teal',   name: 'Turkos',  hex: '#18a898', hexDark: '#2cc8b4', keywords: ['harmoni', 'balans', 'sofistikering', 'elegans', 'mognad'],                      meaning: 'En balanserad och harmonisk dag med en känsla av sofistikering. Antyder känslomässig mognad och jämvikt — du har troligen navigerat dagen med grace.' },
		{ id: 'green',  name: 'Grön',    hex: '#30a852', hexDark: '#4cd472', keywords: ['tillväxt', 'natur', 'harmoni', 'hälsa', 'lugn'],                                meaning: 'En naturlig och harmonisk dag präglad av tillväxt. Kan handla om personlig utveckling, tid i naturen eller en känsla av välmående. Du har troligen känt dig jordad.' },
		{ id: 'lime',   name: 'Lime',    hex: '#7cb342', hexDark: '#96cc5a', keywords: ['energi', 'ungdomlighet', 'optimism', 'nytänkande', 'vår'],                      meaning: 'En energisk och ungdomlig dag full av optimism. Antyder nytänkande, fräschhet och en nästan barnslig entusiasm. Du har troligen känt dig pigg och kreativ.' },
		{ id: 'yellow', name: 'Gul',     hex: '#e8a820', hexDark: '#f5c844', keywords: ['glädje', 'sol', 'optimism', 'värme', 'lycka'],                                  meaning: 'En solig och glad dag fylld av värme och optimism. Som en strålande solskendag antyder detta ren glädje, positivitet och intellektuell stimulans.' },
		{ id: 'orange', name: 'Orange',  hex: '#e8862f', hexDark: '#f5a04a', keywords: ['entusiasm', 'äventyr', 'social', 'värme', 'gemenskap'],                         meaning: 'En varm och entusiastisk dag med social energi. Antyder äventyrslust, gemenskap och utåtriktad energi. Du har troligen umgåtts med andra eller provat något nytt.' },
		{ id: 'brown',  name: 'Brun',    hex: '#9a6518', hexDark: '#d48820', keywords: ['trygghet', 'jordnärhet', 'stabilitet', 'komfort', 'hem'],                       meaning: 'En jordnära och trygg dag med fokus på det grundläggande. Som jordens färg antyder detta stabilitet, hemkänsla och komfort. Du har troligen uppskattat livets enkla nöjen.' },
		{ id: 'gray',   name: 'Grå',     hex: '#6e6e78', hexDark: '#9a9aa4', keywords: ['neutralitet', 'stillhet', 'eftertänksamhet', 'paus', 'vila'],                   meaning: 'En neutral och stillsam dag utan starka toppar eller dalar. Kan indikera en vilopaus eller helt enkelt en vardaglig dag. Inte nödvändigtvis negativt — ibland behövs gråa dagar.' },
		{ id: 'black',  name: 'Svart',   hex: '#1a1a1e', hexDark: '#28282c', keywords: ['kraft', 'elegans', 'allvar', 'mysterium', 'djup'],                              meaning: 'En kraftfull och allvarlig dag med djup. Kan indikera elegans och styrka, men också tyngre känslor eller en känsla av mysterium. Du har troligen känt ett behov av att dra dig inåt.' },
		{ id: 'white',  name: 'Vit',     hex: '#fafaf8', hexDark: '#f4f4f2', keywords: ['renhet', 'enkelhet', 'klarhet', 'nystart', 'frid'],                             meaning: 'En ren och enkel dag med känsla av klarhet eller nystart. Som ett blankt papper antyder detta nya möjligheter, mental frid eller en avskalad enkelhet.' },
	];

	let { value = $bindable('') }: { value?: string } = $props();

	const selected = $derived(moodColors.find(c => c.id === value) ?? null);

	function toggle(id: string) {
		value = value === id ? '' : id;
	}
</script>

<div class="cp-root">
	<div class="cp-swatches">
		{#each moodColors as color}
			<button
				type="button"
				class="cp-swatch"
				class:cp-selected={value === color.id}
				style="--c: {color.hex}; --cd: {color.hexDark}"
				aria-label={color.name}
				aria-pressed={value === color.id}
				onclick={() => toggle(color.id)}
			>
				<span class="cp-inner"></span>
			</button>
		{/each}
	</div>

	{#if selected}
		<p class="cp-keywords">
			{#each selected.keywords as keyword}
				<span class="cp-tag">#{keyword}</span>
			{/each}
		</p>
		<p class="cp-meaning">{selected.meaning}</p>
	{:else}
		<p class="cp-hint">Klicka på en färg för att se dess betydelse</p>
	{/if}
</div>

<style>
	.cp-root {
		width: 100%;
	}

	.cp-swatches {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: clamp(0.25rem, 1vw, 0.5rem);
	}

	@media (max-width: 480px) {
		.cp-swatch {
			padding: 4px;
			border-radius: 5px;
		}
	}

	@media (min-width: 480px) {
		.cp-swatches {
			grid-template-columns: repeat(8, 1fr);
		}

		.cp-swatch {
			min-width: 2.75rem;
			min-height: 2.75rem;
		}
	}

	@media (min-width: 640px) {
		.cp-swatches {
			grid-template-columns: repeat(16, 1fr);
		}

		.cp-swatch {
			min-width: 0;
			min-height: 0;
		}
	}

	.cp-swatch {
		position: relative;
		aspect-ratio: 1;
		padding: clamp(2px, 0.5vw, 4px);
		border: none;
		border-radius: 4px;
		background-color: #ffffff;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	@media (prefers-color-scheme: dark) {
		.cp-swatch {
			background-color: #1c1c1f;
		}
	}

	.cp-swatch:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
	}

	.cp-swatch.cp-selected {
		box-shadow: 0 0 0 2px var(--c), 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	@media (prefers-color-scheme: dark) {
		.cp-swatch.cp-selected {
			box-shadow: 0 0 0 2px var(--cd), 0 1px 3px rgba(0, 0, 0, 0.15);
		}
	}

	.cp-inner {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 2px;
		background-color: var(--c);
	}

	@media (prefers-color-scheme: dark) {
		.cp-inner {
			background-color: var(--cd);
		}
	}

	.cp-keywords {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.375rem;
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
		font-weight: 300;
		color: #5f5f5f;
		letter-spacing: 0.025em;
	}

	@media (prefers-color-scheme: dark) {
		.cp-keywords {
			color: #a7a7ad;
		}
	}

	.cp-tag {
		font-size: 0.87rem;
		color: #5f5f5f;
	}

	@media (prefers-color-scheme: dark) {
		.cp-tag {
			color: #a7a7ad;
		}
	}

	.cp-meaning {
		margin: 0.375rem 0 0;
		font-size: 0.87rem;
		font-weight: 300;
		color: #5f5f5f;
		letter-spacing: 0.025em;
		text-align: center;
		line-height: 1.5;
		font-style: italic;
	}

	@media (prefers-color-scheme: dark) {
		.cp-meaning {
			color: #a7a7ad;
		}
	}

	.cp-hint {
		margin: 0.25rem 0 0;
		font-size: 0.95rem;
		font-weight: 300;
		color: #5f5f5f;
		letter-spacing: 0.025em;
		opacity: 0.7;
		font-style: italic;
		text-align: center;
	}

	@media (prefers-color-scheme: dark) {
		.cp-hint {
			color: #a7a7ad;
		}
	}
</style>
