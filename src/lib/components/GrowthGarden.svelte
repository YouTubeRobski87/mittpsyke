<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	export let growthScore: number;
	export let growthLevel: number;
	export let entryCount: number = 0;
	export let activeDays: number = 0;

	type CompanionStat = {
		label: string;
		value: string;
		progress: number;
	};

	type CompanionAnimal = {
		id: 'dino' | 'fox' | 'turtle';
		name: string;
		icon: string;
	};

	const COMPANION_STORAGE_KEY = 'mittpsyke:progress-companion';
	const MYSTERY_EGG_VISIBLE_ENTRIES = 100;
	const MYSTERY_EGG_CRACKED_ENTRIES = 125;
	const MYSTERY_EGG_HATCHED_ENTRIES = 150;
	const COMPANION_ANIMALS: CompanionAnimal[] = [
		{ id: 'dino', name: 'Dino', icon: '🦕' },
		{ id: 'fox', name: 'Räv', icon: '🦊' },
		{ id: 'turtle', name: 'Sköldpadda', icon: '🐢' }
	];
	const EXTRA_EGGS = [
		{ id: 2, x: 78, y: 176, visible: 100, cracked: 125, hatched: 150 },
		{ id: 3, x: 142, y: 166, visible: 200, cracked: 250, hatched: 300 },
		{ id: 4, x: 202, y: 158, visible: 400, cracked: 500, hatched: 600 },
		{ id: 5, x: 462, y: 160, visible: 800, cracked: 1000, hatched: 1200 }
	];

	$: nextEgg = EXTRA_EGGS.find((egg) => entryCount < egg.visible);
	$: hatchingEgg = EXTRA_EGGS.find((egg) => entryCount >= egg.visible && entryCount < egg.hatched);
	$: energyValue = Math.min(100, 48 + growthLevel * 10 + Math.min(entryCount, 12));
	$: calmValue = Math.min(100, 62 + Math.min(activeDays, 10) * 3);
	$: presenceValue = Math.min(100, entryCount === 0 ? 40 : 60 + Math.min(activeDays, 8) * 4);
	$: continuitySignals = entryCount + activeDays;
	$: continuityState = continuitySignals >= 10 ? 'settled' : continuitySignals >= 3 ? 'soft' : 'quiet';
	$: companionPresence =
		continuityState === 'settled'
			? 'Mer liv i platsen'
			: continuityState === 'soft'
				? 'Varsam rytm'
				: 'Stilla närvaro';
	$: companionStats = [
		{ label: 'Energi', value: energyValue > 72 ? 'Vaken' : 'Mjuk', progress: energyValue },
		{ label: 'Lugn', value: calmValue > 78 ? 'Djup' : 'Stadig', progress: calmValue },
		{ label: 'Närvaro', value: presenceValue > 76 ? 'Nära' : 'Här', progress: presenceValue },
		{ label: 'Dagens steg', value: entryCount > 0 ? 'Landat' : 'Väntar', progress: entryCount > 0 ? 72 : 38 }
	] satisfies CompanionStat[];
	$: selectedCompanion = COMPANION_ANIMALS.find((animal) => animal.id === selectedAnimalId) ?? null;
	$: companionName = selectedCompanion?.name ?? 'Din följeslagare';
	$: nextStepText =
		entryCount === 0
			? 'Nästa lilla steg: skriv en rad när du vill.'
			: activeDays > 1
				? 'Platsen blir långsamt mer bekant när du återvänder.'
				: 'Nästa lilla steg: återvänd när det passar.';

	let careCount = 0;
	let selectedAnimalId: CompanionAnimal['id'] | null = null;
	let companionStage: 'egg' | 'choose' | 'chosen' = 'egg';
	let companionMessage = 'Ett litet steg räcker idag.';

	onMount(() => {
		if (!browser) return;

		try {
			const savedAnimal = localStorage.getItem(COMPANION_STORAGE_KEY) as CompanionAnimal['id'] | null;
			const animal = COMPANION_ANIMALS.find((option) => option.id === savedAnimal);
			if (animal) {
				selectedAnimalId = savedAnimal;
				companionStage = 'chosen';
				companionMessage = activeDays > 1 ? 'Fint att du kom tillbaka.' : 'Vi tar det i lugn takt.';
			}
		} catch {
			// Companion-valet är bara lokal komfort; sidan ska fungera även om lagring blockeras.
		}
	});

	function hatchCompanionEgg() {
		companionStage = 'choose';
		companionMessage = 'Välj en lugn följeslagare som kan hålla dig sällskap här.';
	}

	function chooseCompanion(animal: CompanionAnimal) {
		selectedAnimalId = animal.id;
		companionStage = 'chosen';
		companionMessage = 'Vi tar det i lugn takt.';
		if (browser) {
			try {
				localStorage.setItem(COMPANION_STORAGE_KEY, animal.id);
			} catch {
				// Se kommentaren i onMount.
			}
		}
	}

	function changeCompanion() {
		companionStage = 'choose';
		companionMessage = 'Välj den följeslagare som känns rätt idag.';
	}

	function giveCalm() {
		careCount += 1;
		companionMessage = ['Fint att du kom tillbaka.', 'Vi tar det i lugn takt.', 'Små steg räcker.', 'Jag är här med dig.'][careCount % 4];
	}
</script>

<section class="garden-card card" aria-labelledby="growth-garden-title" data-growth-score={growthScore} data-continuity={continuityState}>
	<div class="garden-copy">
		<h2 id="growth-garden-title">Din följeslagare i Framsteg</h2>
		<p class="garden-intro">En liten lugn companion som följer dina inlägg och de dagar du återvänder.</p>
	</div>

	<div class="garden-scene">
		<svg viewBox="0 0 520 248" role="presentation" focusable="false">
			<defs>
				<linearGradient id="gardenSky" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-sky-top)" />
					<stop offset="56%" stop-color="var(--garden-sky-mid)" />
					<stop offset="100%" stop-color="var(--garden-sky-bottom)" />
				</linearGradient>
				<linearGradient id="gardenGlow" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-glow-start)" />
					<stop offset="100%" stop-color="var(--garden-glow-end)" />
				</linearGradient>
				<linearGradient id="gardenBackGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-back-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-back-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenFrontGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-front-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-front-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenBush" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-bush-top)" />
					<stop offset="100%" stop-color="var(--garden-bush-bottom)" />
				</linearGradient>
				<linearGradient id="gardenTreeFoliage" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-leaf-top)" />
					<stop offset="100%" stop-color="var(--garden-leaf-bottom)" />
				</linearGradient>
				<linearGradient id="gardenTrunk" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-trunk-top)" />
					<stop offset="100%" stop-color="var(--garden-trunk-bottom)" />
				</linearGradient>
				<linearGradient id="gardenBlossom" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-blossom-top)" />
					<stop offset="100%" stop-color="var(--garden-blossom-bottom)" />
				</linearGradient>
				<linearGradient id="gardenBlossomSoft" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-blossom-soft-top)" />
					<stop offset="100%" stop-color="var(--garden-blossom-soft-bottom)" />
				</linearGradient>
				<linearGradient id="gardenEggShell" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-egg-top)" />
					<stop offset="100%" stop-color="var(--garden-egg-bottom)" />
				</linearGradient>
				<linearGradient id="gardenEggShade" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-egg-shade-top)" />
					<stop offset="100%" stop-color="var(--garden-egg-shade-bottom)" />
				</linearGradient>
				<linearGradient id="gardenDinoBody" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-dino-top)" />
					<stop offset="100%" stop-color="var(--garden-dino-bottom)" />
				</linearGradient>
				<linearGradient id="gardenDinoBelly" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-dino-belly-top)" />
					<stop offset="100%" stop-color="var(--garden-dino-belly-bottom)" />
				</linearGradient>
			</defs>

			<rect x="0" y="0" width="520" height="248" rx="30" fill="url(#gardenSky)" />
			<ellipse cx="402" cy="26" rx="118" ry="74" fill="url(#gardenGlow)" class="glow" />
			<path
				d="M0 134 C58 118 112 114 168 122 S286 142 354 132 S462 114 520 126 L520 248 L0 248 Z"
				class="horizon"
			/>
			<ellipse cx="122" cy="74" rx="96" ry="20" class="mist mist-left" />
			<ellipse cx="356" cy="92" rx="132" ry="26" class="mist mist-right" />

			<path
				d="M0 162 C72 146 128 148 190 160 S318 180 402 166 S474 150 520 154 L520 248 L0 248 Z"
				fill="url(#gardenBackGround)"
			/>
			<path
				d="M0 180 C74 164 144 166 220 180 S374 204 520 176 L520 248 L0 248 Z"
				fill="url(#gardenGround)"
			/>
			<path
				d="M0 198 C76 186 162 188 244 202 S406 220 520 194 L520 248 L0 248 Z"
				fill="url(#gardenFrontGround)"
			/>

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && growthLevel === 0}
				<g class="layer egg-stage">
					<ellipse cx="260" cy="214" rx="54" ry="12" class="egg-shadow" />
					<path
						d="M260 68 C226 68 206 106 206 150 C206 184 228 206 260 206 C292 206 314 184 314 150 C314 106 294 68 260 68 Z"
						class="egg-shell"
					/>
					<path
						d="M261 76 C236 84 224 114 224 152 C224 176 238 194 258 200 C248 183 244 162 244 134 C244 112 250 91 261 76 Z"
						class="egg-shell-shade"
					/>
					<circle cx="236" cy="124" r="4.2" class="egg-speck" />
					<circle cx="280" cy="142" r="3.4" class="egg-speck" />
					<circle cx="254" cy="168" r="3.8" class="egg-speck" />
					<path d="M246 140 L254 150 L246 160 L259 170 L252 183" class="crack-line" />
					<path d="M270 132 L276 141 L270 150" class="crack-line crack-line-soft" />
					<path d="M284 154 L290 164 L284 173" class="crack-line crack-line-soft" />
				</g>
			{/if}

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && growthLevel >= 1}
				<g class="layer grass-back">
					<path d="M42 197 C48 182 50 174 54 197" />
					<path d="M66 193 C72 176 76 168 80 193" />
					<path d="M92 200 C98 182 101 173 106 200" />
					<path d="M130 194 C135 176 140 168 145 194" />
					<path d="M164 198 C170 180 174 172 178 198" />
					<path d="M212 202 C217 184 222 176 226 202" />
					<path d="M286 198 C291 180 295 172 299 198" />
					<path d="M328 202 C332 184 337 176 341 202" />
					<path d="M372 196 C377 178 381 170 386 196" />
					<path d="M406 201 C410 184 415 176 419 201" />
					<path d="M444 196 C449 178 453 170 458 196" />
					<path d="M476 200 C481 183 485 174 490 200" />
				</g>
				<g class="layer grass-front">
					<path d="M52 214 C60 190 64 180 70 214" />
					<path d="M84 218 C91 194 96 184 102 218" />
					<path d="M118 212 C125 188 130 178 136 212" />
					<path d="M154 220 C161 194 168 184 172 220" />
					<path d="M202 216 C208 194 214 184 220 216" />
					<path d="M246 220 C252 198 257 188 262 220" />
					<path d="M304 216 C310 194 316 184 320 216" />
					<path d="M352 220 C358 198 364 188 370 220" />
					<path d="M396 214 C404 190 409 180 414 214" />
					<path d="M432 220 C439 196 444 186 450 220" />
					<path d="M468 214 C474 190 478 180 484 214" />
				</g>
			{/if}

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && growthLevel === 1}
				<g class="layer dino-stage">
					<ellipse cx="260" cy="214" rx="56" ry="12" class="egg-shadow" />
					<path
						d="M214 160 L228 144 L246 154 L260 136 L278 152 L298 144 L308 160 L308 206 L214 206 Z"
						class="egg-shell"
					/>
					<path
						d="M228 146 L240 120 L258 132 L272 110 L292 122 L300 148 L228 146 Z"
						class="egg-shell-piece"
					/>
					<path d="M268 156 C273 146 281 138 292 132" class="dino-neck neck-small" />
					<ellipse cx="302" cy="128" rx="16" ry="13" class="dino-head" />
					<circle cx="307" cy="124" r="2.2" class="dino-eye" />
					<circle cx="296" cy="131" r="3.8" class="dino-cheek" />
					<path d="M298 134 C301 137 306 137 309 134" class="dino-smile" />
					<path d="M314 128 C318 124 320 122 323 120" class="dino-crest" />
					<path d="M230 166 L238 175 L230 184" class="crack-line crack-line-soft" />
					<path d="M292 166 L300 175 L292 184" class="crack-line crack-line-soft" />
				</g>
			{/if}

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && growthLevel === 2}
				<g class="layer dino-stage">
					<ellipse cx="260" cy="214" rx="62" ry="12" class="dino-shadow" />
					<path d="M212 186 L224 170 L240 182 L238 206 L212 206 Z" class="egg-shell-piece" />
					<path d="M284 182 L300 168 L312 184 L308 206 L284 206 Z" class="egg-shell-piece" />
					<path d="M229 174 C215 170 205 164 198 156" class="dino-tail tail-small" />
					<ellipse cx="264" cy="174" rx="36" ry="24" class="dino-body" />
					<ellipse cx="272" cy="182" rx="20" ry="12" class="dino-belly" />
					<path d="M289 156 C296 144 304 136 314 129" class="dino-neck neck-small" />
					<ellipse cx="324" cy="124" rx="14" ry="11" class="dino-head" />
					<path d="M248 188 L246 206" class="dino-leg leg-small" />
					<path d="M276 188 L278 206" class="dino-leg leg-small" />
					<path d="M288 169 C296 171 301 175 304 181" class="dino-arm arm-small" />
					<circle cx="252" cy="166" r="4" class="dino-spot" />
					<circle cx="274" cy="160" r="3.4" class="dino-spot" />
					<circle cx="291" cy="171" r="3.2" class="dino-spot" />
					<circle cx="329" cy="120" r="2" class="dino-eye" />
					<circle cx="319" cy="127" r="3.4" class="dino-cheek" />
					<path d="M319 130 C322 132 326 132 328 130" class="dino-smile" />
				</g>
			{/if}

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && growthLevel === 3}
				<g class="layer dino-stage">
					<path
						d="M168 206 C184 194 204 190 226 192 C238 182 254 178 270 180 C284 174 300 176 314 184 C332 184 348 192 356 206 Z"
						class="level-three-meadow"
					/>
					<ellipse cx="264" cy="216" rx="76" ry="13" class="dino-shadow" />
					<path d="M214 172 C194 166 179 157 166 144" class="dino-tail tail-medium" />
					<ellipse cx="266" cy="170" rx="52" ry="34" class="dino-body" />
					<ellipse cx="276" cy="182" rx="28" ry="16" class="dino-belly" />
					<path d="M306 152 C318 130 331 112 347 100" class="dino-neck neck-medium" />
					<ellipse cx="358" cy="94" rx="17" ry="13" class="dino-head" />
					<path d="M240 190 L238 206" class="dino-leg leg-medium" />
					<path d="M268 192 L268 206" class="dino-leg leg-medium" />
					<path d="M293 190 L294 206" class="dino-leg leg-medium" />
					<path d="M320 186 L322 206" class="dino-leg leg-medium" />
					<path d="M309 168 C317 171 323 176 327 183" class="dino-arm arm-medium" />
					<circle cx="244" cy="162" r="5.2" class="dino-spot" />
					<circle cx="272" cy="155" r="4.6" class="dino-spot" />
					<circle cx="294" cy="165" r="4.4" class="dino-spot" />
					<circle cx="316" cy="174" r="4.2" class="dino-spot" />
					<path d="M346 198 L360 186 L370 198 L366 206 L346 206 Z" class="egg-shell-piece shell-fragment" />
					<circle cx="363" cy="90" r="2.2" class="dino-eye" />
					<circle cx="352" cy="98" r="3.8" class="dino-cheek" />
					<path d="M352 101 C355 104 360 104 363 101" class="dino-smile" />
					<path d="M369 93 C372 91 374 90 377 90" class="dino-crest" />
				</g>
			{/if}

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino'}
				{#each EXTRA_EGGS as egg}
				{#if entryCount >= egg.hatched}
					<!-- Extraägg: kläckt -->
					<g class="mystery-hatch-stage">
						<ellipse cx={egg.x} cy={egg.y + 12} rx="22" ry="5" class="egg-shadow" />
						<path d={`M${egg.x - 22} ${egg.y + 8} L${egg.x - 16} ${egg.y + 1} L${egg.x - 8} ${egg.y + 7} L${egg.x - 10} ${egg.y + 13} L${egg.x - 22} ${egg.y + 13} Z`} class="egg-shell-piece mystery-shell-fragment" />
						<path d={`M${egg.x + 8} ${egg.y + 7} L${egg.x + 17} ${egg.y} L${egg.x + 23} ${egg.y + 8} L${egg.x + 20} ${egg.y + 13} L${egg.x + 8} ${egg.y + 13} Z`} class="egg-shell-piece mystery-shell-fragment" />
						<path d={`M${egg.x - 15} ${egg.y - 1} C${egg.x - 21} ${egg.y - 3} ${egg.x - 25} ${egg.y - 6} ${egg.x - 28} ${egg.y - 10}`} class="dino-tail mystery-tail" />
						<ellipse cx={egg.x - 2} cy={egg.y - 2} rx="16" ry="11" class="dino-body" />
						<ellipse cx={egg.x + 2} cy={egg.y + 3} rx="8" ry="5" class="dino-belly" />
						<path d={`M${egg.x + 10} ${egg.y - 10} C${egg.x + 14} ${egg.y - 16} ${egg.x + 18} ${egg.y - 20} ${egg.x + 23} ${egg.y - 23}`} class="dino-neck mystery-neck" />
						<ellipse cx={egg.x + 28} cy={egg.y - 25} rx="7" ry="5.6" class="dino-head" />
						<path d={`M${egg.x - 7} ${egg.y + 5} L${egg.x - 8} ${egg.y + 13}`} class="dino-leg mystery-leg" />
						<path d={`M${egg.x + 4} ${egg.y + 5} L${egg.x + 5} ${egg.y + 13}`} class="dino-leg mystery-leg" />
						<circle cx={egg.x - 6} cy={egg.y - 5} r="1.8" class="dino-spot" />
						<circle cx={egg.x + 4} cy={egg.y - 7} r="1.6" class="dino-spot" />
						<circle cx={egg.x + 30} cy={egg.y - 27} r="1" class="dino-eye" />
						<path d={`M${egg.x + 25} ${egg.y - 22} C${egg.x + 27} ${egg.y - 21} ${egg.x + 29} ${egg.y - 21} ${egg.x + 31} ${egg.y - 22}`} class="dino-smile mystery-smile" />
					</g>
				{:else if entryCount >= egg.visible}
					<!-- Extraägg: aktivt -->
					<g class="mystery-egg-stage">
						<ellipse cx={egg.x} cy={egg.y - 7} rx="30" ry="34" class="mystery-egg-glow" />
						<ellipse cx={egg.x} cy={egg.y + 12} rx="19" ry="5" class="egg-shadow" />
						<path d={`M${egg.x} ${egg.y - 26} C${egg.x - 9} ${egg.y - 26} ${egg.x - 16} ${egg.y - 12} ${egg.x - 16} ${egg.y - 2} C${egg.x - 16} ${egg.y + 8} ${egg.x - 9} ${egg.y + 12} ${egg.x} ${egg.y + 12} C${egg.x + 9} ${egg.y + 12} ${egg.x + 16} ${egg.y + 8} ${egg.x + 16} ${egg.y - 2} C${egg.x + 16} ${egg.y - 12} ${egg.x + 9} ${egg.y - 26} ${egg.x} ${egg.y - 26} Z`} class="egg-shell" />
						<path d={`M${egg.x + 1} ${egg.y - 23} C${egg.x - 5} ${egg.y - 19} ${egg.x - 10} ${egg.y - 10} ${egg.x - 10} ${egg.y - 2} C${egg.x - 10} ${egg.y + 5} ${egg.x - 7} ${egg.y + 9} ${egg.x - 3} ${egg.y + 11} C${egg.x - 7} ${egg.y + 5} ${egg.x - 9} ${egg.y - 2} ${egg.x - 9} ${egg.y - 8} C${egg.x - 9} ${egg.y - 14} ${egg.x - 5} ${egg.y - 20} ${egg.x + 1} ${egg.y - 23} Z`} class="egg-shell-shade" />
						<circle cx={egg.x - 8} cy={egg.y - 15} r="2.1" class="egg-speck" />
						<circle cx={egg.x + 6} cy={egg.y - 6} r="1.8" class="egg-speck" />
						<circle cx={egg.x - 5} cy={egg.y + 1} r="1.6" class="egg-speck" />
						{#if entryCount >= egg.cracked}
							<path d={`M${egg.x - 1} ${egg.y - 16} L${egg.x + 4} ${egg.y - 10} L${egg.x - 2} ${egg.y - 4} L${egg.x + 5} ${egg.y + 3}`} class="crack-line mystery-crack-line" />
							<path d={`M${egg.x - 9} ${egg.y - 7} L${egg.x - 5} ${egg.y - 2} L${egg.x - 9} ${egg.y + 3}`} class="crack-line mystery-crack-line-soft" />
						{/if}
					</g>
				{:else}
					<!-- Extraägg: låst -->
					<g class="mystery-egg-locked" aria-hidden="true">
						<ellipse cx={egg.x} cy={egg.y + 12} rx="16" ry="4" class="egg-shadow" />
						<path d={`M${egg.x} ${egg.y - 22} C${egg.x - 8} ${egg.y - 22} ${egg.x - 14} ${egg.y - 10} ${egg.x - 14} ${egg.y} C${egg.x - 14} ${egg.y + 9} ${egg.x - 8} ${egg.y + 12} ${egg.x} ${egg.y + 12} C${egg.x + 8} ${egg.y + 12} ${egg.x + 14} ${egg.y + 9} ${egg.x + 14} ${egg.y} C${egg.x + 14} ${egg.y - 10} ${egg.x + 8} ${egg.y - 22} ${egg.x} ${egg.y - 22} Z`} class="egg-shell" />
						<path d={`M${egg.x - 6} ${egg.y - 5} H${egg.x + 6} M${egg.x} ${egg.y - 11} V${egg.y + 1}`} class="mystery-lock-mark" />
					</g>
				{/if}
				{/each}
			{/if}

			{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && growthLevel >= 4}
				<g class="layer dino-stage level-four">
					<path
						d="M270 206 C286 194 304 190 324 192 C336 182 352 178 368 180 C382 170 398 170 414 176 C430 172 446 178 456 188 C474 188 490 194 498 206 Z"
						class="level-four-meadow"
					/>
					<g class="level-four-grass">
						<path d="M286 214 C294 192 300 182 306 214" />
						<path d="M320 218 C326 196 332 186 338 218" />
						<path d="M416 216 C422 194 428 184 434 216" />
						<path d="M470 214 C476 194 480 184 486 214" />
					</g>
					<ellipse cx="300" cy="218" rx="100" ry="14" class="dino-shadow" />
					<path d="M228 168 C198 164 174 154 154 136" class="dino-tail tail-large" />
					<ellipse cx="294" cy="166" rx="74" ry="44" class="dino-body" />
					<ellipse cx="306" cy="178" rx="40" ry="20" class="dino-belly" />
					<path d="M340 146 C356 114 375 88 398 74" class="dino-neck neck-large" />
					<ellipse cx="418" cy="68" rx="22" ry="17" class="dino-head" />
					<path d="M266 190 L264 206" class="dino-leg leg-large" />
					<path d="M292 192 L292 206" class="dino-leg leg-large" />
					<path d="M322 190 L324 206" class="dino-leg leg-large" />
					<path d="M346 188 L348 206" class="dino-leg leg-large" />
					<path d="M338 168 C347 170 354 176 359 184" class="dino-arm arm-large" />
					<path d="M410 70 C414 65 419 63 424 62" class="dino-crest" />
					<circle cx="250" cy="154" r="6.2" class="dino-spot" />
					<circle cx="282" cy="146" r="5.8" class="dino-spot" />
					<circle cx="314" cy="154" r="5.4" class="dino-spot" />
					<circle cx="340" cy="168" r="5.1" class="dino-spot" />
					<circle cx="361" cy="181" r="4.6" class="dino-spot" />
					<circle cx="425" cy="63" r="2.6" class="dino-eye" />
					<circle cx="411" cy="74" r="4.6" class="dino-cheek" />
					<path d="M410 78 C414 82 421 82 425 78" class="dino-smile" />
					<path d="M433 68 C436 66 438 66 441 66" class="dino-nostril" />
				</g>
			{/if}
		</svg>
		{#if companionStage === 'chosen'}
			<span class="companion-orb" aria-hidden="true"></span>
			<span class="ambient-detail detail-one" aria-hidden="true"></span>
			{#if continuityState !== 'quiet'}
				<span class="ambient-detail detail-two" aria-hidden="true"></span>
			{/if}
			{#if continuityState === 'settled'}
				<span class="ambient-detail detail-three" aria-hidden="true"></span>
			{/if}
		{/if}
		{#if companionStage === 'egg'}
			<button class="companion-egg-button" type="button" onclick={hatchCompanionEgg}>
				<span aria-hidden="true">🥚</span>
				<strong>Kläck din följeslagare</strong>
			</button>
		{:else if companionStage === 'chosen' && selectedCompanion && selectedCompanion.id !== 'dino'}
			<div class="chosen-companion" aria-hidden="true">
				<span>{selectedCompanion.icon}</span>
			</div>
		{/if}
		<p class="dino-bubble" aria-live="polite">{companionMessage}</p>
	</div>

	<div class="companion-panel" aria-label="Följeslagarens status">
		<div class="companion-summary">
			<span>{companionPresence}</span>
			<strong>{companionName} följer din plats i lugn takt.</strong>
			<p>{nextStepText}</p>
		</div>
		{#if companionStage === 'choose'}
			<div class="animal-chooser" aria-label="Välj följeslagare">
				{#each COMPANION_ANIMALS as animal}
					<button type="button" onclick={() => chooseCompanion(animal)}>
						<span aria-hidden="true">{animal.icon}</span>
						{animal.name}
					</button>
				{/each}
			</div>
		{/if}
		<div class="companion-stats">
			{#each companionStats as stat}
				<div class="companion-stat">
					<span>{stat.label}</span>
					<strong>{stat.value}</strong>
					<div class="companion-meter" aria-hidden="true">
						<span style={`width: ${stat.progress}%`}></span>
					</div>
				</div>
			{/each}
		</div>
		<div class="companion-care">
			<p>{companionName} hänger med i din takt och räknar även de små stegen.</p>
			<div class="companion-actions">
				<button type="button" onclick={giveCalm}>Ge lite lugn</button>
				{#if companionStage === 'chosen'}
					<button class="secondary" type="button" onclick={changeCompanion}>Byt följeslagare</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="garden-meta">
		<p class="garden-note">Fint att du kom tillbaka.</p>
		<p class="garden-stats">Här får små avtryck finnas kvar.</p>
	</div>

	{#if companionStage === 'chosen' && selectedCompanion?.id === 'dino' && entryCount >= MYSTERY_EGG_VISIBLE_ENTRIES}
		<p class="mystery-hint">
			{#if hatchingEgg}
				Något nytt håller på att hända...
			{:else if nextEgg}
				Något nytt kan börja röra sig längre fram.
			{:else}
				Alla synliga ägg har kläckts.
			{/if}
		</p>
	{/if}
</section>

<style>
	.garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 64%, #f2f5f1 36%);
		--garden-sky-mid: color-mix(in srgb, hsl(var(--surface-soft)) 82%, #eef1ec 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 90%, #dde6df 10%);
		--garden-glow-start: rgba(240, 238, 228, 0.42);
		--garden-glow-end: rgba(240, 238, 228, 0);
		--garden-back-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 12%, #8fa099 88%);
		--garden-back-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 18%, #6e8079 82%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 26%, #657970 74%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 38%, #4f625a 62%);
		--garden-front-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #53665c 66%);
		--garden-front-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 48%, #3e5048 52%);
		--garden-bush-top: color-mix(in srgb, var(--theme-accent, #436e8f) 42%, #7f957f 58%);
		--garden-bush-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 56%, #536a58 44%);
		--garden-leaf-top: color-mix(in srgb, var(--theme-accent, #436e8f) 38%, #91a47c 62%);
		--garden-leaf-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 60%, #50634d 40%);
		--garden-trunk-top: color-mix(in srgb, #7d6857 76%, #5f4d40 24%);
		--garden-trunk-bottom: color-mix(in srgb, #5c493b 82%, #3d3028 18%);
		--garden-blossom-top: color-mix(in srgb, #f8e8ef 78%, #f1bfd4 22%);
		--garden-blossom-bottom: color-mix(in srgb, #efc4d9 74%, #f7f2f4 26%);
		--garden-blossom-soft-top: color-mix(in srgb, #fff8fb 70%, #f6d9e5 30%);
		--garden-blossom-soft-bottom: color-mix(in srgb, #f3d5df 76%, #ffffff 24%);
		--garden-egg-top: color-mix(in srgb, #f7f0e4 84%, #efe3cd 16%);
		--garden-egg-bottom: color-mix(in srgb, #e9dbc0 78%, #f7f1e7 22%);
		--garden-egg-shade-top: rgba(233, 218, 191, 0.68);
		--garden-egg-shade-bottom: rgba(217, 198, 162, 0.12);
		--garden-egg-speck: rgba(188, 164, 127, 0.72);
		--garden-dino-top: color-mix(in srgb, var(--theme-accent, #436e8f) 16%, #c6d6ab 84%);
		--garden-dino-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #7e976d 66%);
		--garden-dino-belly-top: color-mix(in srgb, #f8f0db 84%, #e9dcbb 16%);
		--garden-dino-belly-bottom: color-mix(in srgb, #e8d8b2 76%, #f7efe0 24%);
		--garden-dino-spot: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #70835f 66%);
		--garden-dino-line: color-mix(in srgb, var(--garden-dino-bottom) 74%, #58664f 26%);
		--garden-dino-eye: #243328;
		--garden-dino-cheek: rgba(244, 198, 186, 0.72);
		--garden-ground-shadow: rgba(44, 60, 51, 0.14);
		--garden-life-glow: rgba(248, 235, 190, 0.22);
		--garden-life-detail: rgba(248, 235, 190, 0.5);
		padding: 2rem;
		border-radius: var(--radius-card);
		border: 1px solid var(--color-dashboard-border);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface));
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		display: grid;
		gap: 1rem;
		overflow: hidden;
	}

	.garden-copy {
		display: grid;
		gap: 0.45rem;
	}

	.garden-copy h2,
	.garden-intro,
	.garden-note,
	.garden-stats {
		margin: 0;
	}

	.garden-copy h2 {
		font-size: 1.3rem;
		color: hsl(var(--foreground));
	}

	.garden-intro {
		max-width: 42rem;
		font-size: 0.98rem;
		line-height: 1.7;
		color: hsl(var(--muted-foreground));
	}

	.garden-scene {
		position: relative;
		width: 100%;
		min-height: 248px;
		border-radius: 1.2rem;
		overflow: hidden;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 46%),
			color-mix(in srgb, hsl(var(--surface-soft)) 90%, white 10%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			inset 0 -22px 40px rgba(28, 40, 36, 0.06);
	}

	.garden-scene svg {
		display: block;
		width: 100%;
		height: auto;
		min-height: 248px;
	}

	.glow {
		opacity: 0.88;
		transition: opacity 220ms ease;
	}

	.garden-card[data-continuity='soft'] .glow {
		opacity: 0.95;
	}

	.garden-card[data-continuity='settled'] .glow {
		opacity: 1;
	}

	.horizon {
		fill: rgba(255, 255, 255, 0.08);
	}

	.mist {
		fill: rgba(255, 255, 255, 0.26);
		transition: opacity 220ms ease;
	}

	.mist-left {
		opacity: 0.68;
	}

	.mist-right {
		opacity: 0.46;
	}

	.garden-card[data-continuity='soft'] .mist-left,
	.garden-card[data-continuity='settled'] .mist-left {
		opacity: 0.76;
	}

	.garden-card[data-continuity='settled'] .mist-right {
		opacity: 0.56;
	}

	.layer {
		animation: gardenFade 360ms ease-out both;
	}

	.grass-back path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #728975 66%);
		stroke-width: 2.2;
		stroke-linecap: round;
		opacity: 0.78;
	}

	.grass-front path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #436e8f) 46%, #607862 54%);
		stroke-width: 2.8;
		stroke-linecap: round;
	}

	.level-four-meadow {
		fill: rgba(178, 196, 168, 0.16);
	}

	.level-three-meadow {
		fill: rgba(178, 196, 168, 0.14);
	}

	.egg-stage,
	.dino-stage {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation:
			gardenBloom 520ms ease-out both,
			dinoBreathe 5.2s ease-in-out 700ms infinite;
	}

	.egg-stage {
		animation: gardenBloom 520ms ease-out both;
	}

	.egg-shadow,
	.dino-shadow {
		fill: var(--garden-ground-shadow);
	}

	.egg-shell,
	.egg-shell-piece {
		fill: url(#gardenEggShell);
	}

	.egg-shell-shade {
		fill: url(#gardenEggShade);
	}

	.egg-speck {
		fill: var(--garden-egg-speck);
	}

	.crack-line {
		fill: none;
		stroke: rgba(141, 120, 88, 0.72);
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.crack-line-soft {
		opacity: 0.72;
		stroke-width: 2.2;
	}

	.dino-body,
	.dino-head {
		fill: url(#gardenDinoBody);
	}

	.dino-belly {
		fill: url(#gardenDinoBelly);
	}

	.dino-neck,
	.dino-tail,
	.dino-leg,
	.dino-arm,
	.dino-smile,
	.dino-crest,
	.dino-nostril {
		fill: none;
		stroke: var(--garden-dino-line);
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.neck-small,
	.tail-small {
		stroke-width: 18;
	}

	.neck-medium,
	.tail-medium {
		stroke-width: 24;
	}

	.neck-large,
	.tail-large {
		stroke-width: 30;
	}

	.leg-small {
		stroke-width: 10;
	}

	.leg-medium {
		stroke-width: 12;
	}

	.leg-large {
		stroke-width: 14;
	}

	.arm-small {
		stroke-width: 7;
	}

	.arm-medium {
		stroke-width: 8;
	}

	.arm-large {
		stroke-width: 9;
	}

	.dino-spot {
		fill: var(--garden-dino-spot);
		opacity: 0.95;
	}

	.dino-eye {
		fill: var(--garden-dino-eye);
		transform-box: fill-box;
		transform-origin: center;
		animation: dinoBlink 6.8s ease-in-out 1.2s infinite;
	}

	.dino-cheek {
		fill: var(--garden-dino-cheek);
		animation: dinoCheek 5.2s ease-in-out 900ms infinite;
	}

	.dino-smile,
	.dino-nostril {
		stroke-width: 2.2;
	}

	.dino-crest {
		stroke-width: 3;
		opacity: 0.68;
	}

	.shell-fragment {
		opacity: 0.92;
	}

	.level-four-grass path {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #436e8f) 42%, #617a63 58%);
		stroke-width: 2.6;
		stroke-linecap: round;
	}

	.garden-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		align-items: center;
		justify-content: space-between;
	}

	.garden-note,
	.garden-stats {
		font-size: 0.84rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.garden-stats {
		white-space: nowrap;
	}

	.dino-bubble {
		position: absolute;
		top: 1rem;
		right: 1rem;
		max-width: min(14rem, calc(100% - 2rem));
		margin: 0;
		padding: 0.7rem 0.85rem;
		border-radius: 1rem 1rem 0.35rem 1rem;
		background: color-mix(in srgb, hsl(var(--surface)) 88%, white 12%);
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 18%, var(--color-dashboard-border) 82%);
		box-shadow: 0 10px 24px rgba(28, 40, 36, 0.1);
		color: hsl(var(--foreground));
		font-size: 0.9rem;
		line-height: 1.45;
		animation: bubbleFloat 5.6s ease-in-out infinite;
	}

	.dino-bubble::after {
		content: '';
		position: absolute;
		right: 1.15rem;
		bottom: -0.42rem;
		width: 0.72rem;
		height: 0.72rem;
		background: inherit;
		border-right: inherit;
		border-bottom: inherit;
		transform: rotate(45deg);
	}

	.companion-orb {
		position: absolute;
		left: 58%;
		top: 43%;
		z-index: 2;
		width: 0.72rem;
		height: 0.72rem;
		border-radius: 999px;
		background:
			radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.96), var(--garden-life-detail) 58%, transparent 70%);
		box-shadow:
			0 0 18px var(--garden-life-glow),
			0 0 34px color-mix(in srgb, var(--theme-accent, #436e8f) 18%, transparent 82%);
		opacity: 0.78;
		animation: companionOrbDrift 14s cubic-bezier(0.45, 0, 0.25, 1) infinite;
	}

	.ambient-detail {
		position: absolute;
		z-index: 1;
		width: 0.32rem;
		height: 0.32rem;
		border-radius: 999px;
		background: var(--garden-life-detail);
		box-shadow: 0 0 18px var(--garden-life-glow);
		opacity: 0.34;
		animation: ambientGlow 9s ease-in-out infinite;
	}

	.detail-one {
		left: 22%;
		top: 38%;
	}

	.detail-two {
		left: 68%;
		top: 30%;
		animation-delay: 1.8s;
	}

	.detail-three {
		left: 42%;
		top: 22%;
		animation-delay: 3.4s;
	}

	.companion-egg-button,
	.chosen-companion {
		position: absolute;
		left: 50%;
		top: 58%;
		z-index: 3;
		transform: translate(-50%, -50%);
	}

	.companion-egg-button {
		display: grid;
		gap: 0.45rem;
		justify-items: center;
		min-width: 11rem;
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 22%, var(--color-dashboard-border) 78%);
		border-radius: 1.2rem;
		background: color-mix(in srgb, hsl(var(--surface)) 84%, white 16%);
		box-shadow: 0 14px 34px rgba(28, 40, 36, 0.12);
		color: hsl(var(--foreground));
		padding: 1rem 1.1rem;
		font: inherit;
		cursor: pointer;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			box-shadow 180ms ease;
		animation: companionEggBreathe 4.8s ease-in-out infinite;
	}

	.companion-egg-button:hover {
		border-color: color-mix(in srgb, var(--theme-accent, #436e8f) 42%, var(--color-dashboard-border) 58%);
		box-shadow: 0 16px 38px rgba(28, 40, 36, 0.16);
	}

	.companion-egg-button span {
		font-size: 3rem;
		line-height: 1;
	}

	.companion-egg-button strong {
		font-size: 0.9rem;
		font-weight: 700;
		line-height: 1.25;
	}

	.chosen-companion {
		display: grid;
		place-items: center;
		width: 7rem;
		height: 7rem;
		border-radius: 999px;
		background:
			radial-gradient(circle at 45% 36%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.18) 52%, transparent 70%),
			color-mix(in srgb, var(--theme-bg, hsl(var(--surface-soft))) 78%, hsl(var(--surface)) 22%);
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 18%, transparent 82%);
		box-shadow: 0 16px 34px rgba(28, 40, 36, 0.1);
		animation: companionIdle 5.4s ease-in-out infinite;
	}

	.chosen-companion span {
		font-size: 3.4rem;
		line-height: 1;
	}

	.companion-panel {
		display: grid;
		gap: 0.9rem;
		padding: 1rem;
		border-radius: 1rem;
		background: color-mix(in srgb, var(--theme-bg, hsl(var(--surface-soft))) 68%, hsl(var(--surface)) 32%);
		border: 1px solid color-mix(in srgb, var(--color-dashboard-border) 82%, var(--theme-accent, #436e8f) 18%);
	}

	.companion-summary {
		display: grid;
		gap: 0.24rem;
	}

	.companion-summary span {
		color: color-mix(in srgb, var(--theme-accent, #436e8f) 68%, hsl(var(--muted-foreground)) 32%);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.companion-summary strong {
		color: hsl(var(--foreground));
		font-size: 1rem;
		line-height: 1.35;
	}

	.companion-summary p {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.animal-chooser {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.animal-chooser button {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 18%, var(--color-dashboard-border) 82%);
		border-radius: 999px;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		padding: 0.55rem 0.78rem;
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}

	.animal-chooser button:hover {
		transform: translateY(-1px);
		border-color: color-mix(in srgb, var(--theme-accent, #436e8f) 38%, var(--color-dashboard-border) 62%);
		background: color-mix(in srgb, var(--theme-bg, hsl(var(--surface-soft))) 72%, hsl(var(--surface)) 28%);
	}

	.companion-stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.companion-stat {
		display: grid;
		gap: 0.38rem;
		min-width: 0;
	}

	.companion-stat span,
	.companion-care p {
		color: hsl(var(--muted-foreground));
	}

	.companion-stat span {
		font-size: 0.78rem;
	}

	.companion-stat strong {
		color: hsl(var(--foreground));
		font-size: 0.95rem;
		line-height: 1.2;
		white-space: nowrap;
	}

	.companion-meter {
		height: 0.36rem;
		overflow: hidden;
		border-radius: 999px;
		background: color-mix(in srgb, hsl(var(--surface-muted)) 78%, white 22%);
	}

	.companion-meter span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: color-mix(in srgb, var(--theme-accent, #436e8f) 68%, #a8bf92 32%);
		transition: width 220ms ease;
	}

	.companion-care {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;
	}

	.companion-care p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.companion-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.companion-actions button {
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 24%, var(--color-dashboard-border) 76%);
		border-radius: 999px;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		padding: 0.62rem 0.9rem;
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			background 160ms ease;
	}

	.companion-actions button:hover {
		transform: translateY(-1px);
		border-color: color-mix(in srgb, var(--theme-accent, #436e8f) 42%, var(--color-dashboard-border) 58%);
		background: color-mix(in srgb, var(--theme-bg, hsl(var(--surface-soft))) 72%, hsl(var(--surface)) 28%);
	}

	.companion-actions .secondary {
		color: hsl(var(--muted-foreground));
	}

	/* ── Mysterie-ägg (100 inlägg) ── */
	.mystery-egg-stage {
		animation: gardenFade 500ms ease-out both;
	}

	.mystery-hatch-stage {
		animation: gardenBloom 520ms ease-out both;
	}

	.mystery-egg-locked {
		opacity: 0.42;
	}

	.mystery-egg-glow {
		fill: color-mix(in srgb, var(--theme-accent, #436e8f) 32%, transparent 68%);
		transform-box: fill-box;
		transform-origin: center;
		animation: mysteryPulse 2.8s ease-in-out infinite;
	}

	.mystery-lock-mark {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-text, #26343d) 62%, transparent 38%);
		stroke-linecap: round;
		stroke-width: 2;
	}

	.mystery-crack-line {
		stroke-width: 1.55;
	}

	.mystery-crack-line-soft {
		opacity: 0.74;
		stroke-width: 1.25;
	}

	.mystery-tail,
	.mystery-neck {
		stroke-width: 7;
	}

	.mystery-leg {
		stroke-width: 4;
	}

	.mystery-smile {
		stroke-width: 1.1;
	}

	.mystery-shell-fragment {
		opacity: 0.94;
	}

	@keyframes mysteryPulse {
		0%, 100% {
			opacity: 0.18;
			transform: scale(0.88);
		}
		50% {
			opacity: 0.52;
			transform: scale(1.14);
		}
	}

	@keyframes dinoBreathe {
		0%, 100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(1px, -2px) scale(1.012);
		}
	}

	@keyframes dinoBlink {
		0%, 92%, 100% {
			transform: scaleY(1);
		}
		95% {
			transform: scaleY(0.12);
		}
	}

	@keyframes dinoCheek {
		0%, 100% {
			opacity: 0.72;
		}
		50% {
			opacity: 0.9;
		}
	}

	@keyframes bubbleFloat {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}

	@keyframes companionEggBreathe {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			transform: translate(-50%, calc(-50% - 2px)) scale(1.018);
		}
	}

	@keyframes companionIdle {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
		}
		45% {
			transform: translate(calc(-50% + 3px), calc(-50% - 3px)) scale(1.01);
		}
		72% {
			transform: translate(calc(-50% - 2px), calc(-50% - 1px)) scale(1.004);
		}
	}

	@keyframes companionOrbDrift {
		0%, 100% {
			transform: translate3d(0, 0, 0) scale(1);
			opacity: 0.72;
		}
		38% {
			transform: translate3d(-14px, 10px, 0) scale(0.94);
			opacity: 0.86;
		}
		68% {
			transform: translate3d(10px, -8px, 0) scale(1.04);
			opacity: 0.78;
		}
	}

	@keyframes ambientGlow {
		0%, 100% {
			transform: translateY(0) scale(1);
			opacity: 0.22;
		}
		50% {
			transform: translateY(-3px) scale(1.2);
			opacity: 0.48;
		}
	}

	.mystery-hint {
		margin: 0;
		font-size: 0.82rem;
		font-style: italic;
		color: color-mix(in srgb, var(--theme-accent, #436e8f) 55%, hsl(var(--muted-foreground)) 45%);
		animation: gardenFade 600ms ease-out both;
	}

	@keyframes gardenFade {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes gardenBloom {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	:global(.dark) .garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 84%, #16212a 16%);
		--garden-sky-mid: color-mix(in srgb, hsl(var(--surface-soft)) 82%, #13202a 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 88%, #101a22 12%);
		--garden-glow-start: rgba(174, 182, 166, 0.12);
		--garden-glow-end: rgba(174, 182, 166, 0);
		--garden-back-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 16%, #33423f 84%);
		--garden-back-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 22%, #273632 78%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 26%, #2d4038 74%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 36%, #21312d 64%);
		--garden-front-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #22322d 66%);
		--garden-front-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 44%, #17251f 56%);
		--garden-bush-top: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #5d745f 66%);
		--garden-bush-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 50%, #374c3d 50%);
		--garden-leaf-top: color-mix(in srgb, var(--theme-accent, #436e8f) 32%, #7c8c6d 68%);
		--garden-leaf-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 56%, #405240 44%);
		--garden-trunk-top: color-mix(in srgb, #715d4d 70%, #4a3d33 30%);
		--garden-trunk-bottom: color-mix(in srgb, #4a3b31 78%, #302620 22%);
		--garden-blossom-top: color-mix(in srgb, #f3dae6 58%, #c796b1 42%);
		--garden-blossom-bottom: color-mix(in srgb, #d6a4bd 60%, #f1d9e4 40%);
		--garden-blossom-soft-top: color-mix(in srgb, #fdeff5 52%, #d7b2c5 48%);
		--garden-blossom-soft-bottom: color-mix(in srgb, #d8afc0 60%, #fff6fa 40%);
		--garden-egg-top: color-mix(in srgb, #ede6d8 70%, #cfc2a6 30%);
		--garden-egg-bottom: color-mix(in srgb, #b5aa8d 58%, #f0e8d8 42%);
		--garden-egg-shade-top: rgba(103, 92, 73, 0.42);
		--garden-egg-shade-bottom: rgba(40, 35, 28, 0.06);
		--garden-egg-speck: rgba(148, 130, 100, 0.74);
		--garden-dino-top: color-mix(in srgb, var(--theme-accent, #436e8f) 20%, #97b28e 80%);
		--garden-dino-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 40%, #547154 60%);
		--garden-dino-belly-top: color-mix(in srgb, #e6dbc0 70%, #b8ae8b 30%);
		--garden-dino-belly-bottom: color-mix(in srgb, #b9ad85 62%, #ece3cd 38%);
		--garden-dino-spot: color-mix(in srgb, var(--theme-accent, #436e8f) 30%, #45563f 70%);
		--garden-dino-line: color-mix(in srgb, var(--garden-dino-bottom) 72%, #2a372d 28%);
		--garden-dino-eye: #eaf4e8;
		--garden-dino-cheek: rgba(224, 172, 163, 0.44);
		--garden-ground-shadow: rgba(6, 10, 12, 0.26);
		--garden-life-glow: rgba(180, 200, 170, 0.14);
		--garden-life-detail: rgba(222, 231, 206, 0.46);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.015) 0%, rgba(255, 255, 255, 0) 100%),
			hsl(var(--surface));
		box-shadow:
			0 2px 10px rgba(0, 0, 0, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	:global(.dark) .garden-scene {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 42%),
			color-mix(in srgb, hsl(var(--surface-soft)) 90%, #0f1720 10%);
		border-color: rgba(255, 255, 255, 0.04);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.02),
			inset 0 -28px 44px rgba(4, 9, 12, 0.32);
	}

	:global(.dark) .horizon {
		fill: rgba(223, 231, 220, 0.04);
	}

	:global(.dark) .mist {
		fill: rgba(224, 232, 235, 0.08);
	}

	:global(.dark) .dino-bubble {
		background: color-mix(in srgb, hsl(var(--surface)) 90%, #23323b 10%);
		box-shadow: 0 12px 28px rgba(4, 9, 12, 0.28);
	}

	:global(.dark) .companion-egg-button,
	:global(.dark) .chosen-companion {
		box-shadow: 0 16px 34px rgba(4, 9, 12, 0.32);
	}

	:global(.dark) .level-four-meadow {
		fill: rgba(178, 196, 168, 0.08);
	}

	:global(.dark) .crack-line {
		stroke: rgba(164, 145, 114, 0.68);
	}

	@media (max-width: 640px) {
		.garden-card {
			padding: 1.5rem;
			gap: 0.9rem;
		}

		.garden-copy h2 {
			font-size: 1.18rem;
		}

		.garden-intro {
			font-size: 0.93rem;
		}

		.garden-scene,
		.garden-scene svg {
			min-height: 206px;
		}

		.garden-meta {
			flex-direction: column;
			align-items: flex-start;
		}

		.dino-bubble {
			top: 0.75rem;
			right: 0.75rem;
			max-width: min(12rem, calc(100% - 1.5rem));
			font-size: 0.84rem;
		}

		.companion-panel {
			padding: 0.9rem;
		}

		.companion-egg-button {
			min-width: 9.5rem;
			padding: 0.9rem;
		}

		.companion-egg-button span,
		.chosen-companion span {
			font-size: 2.7rem;
		}

		.chosen-companion {
			width: 5.8rem;
			height: 5.8rem;
		}

		.companion-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.companion-care {
			align-items: stretch;
			flex-direction: column;
		}

		.companion-actions {
			justify-content: stretch;
		}

		.companion-actions button {
			width: 100%;
		}

		.garden-stats {
			white-space: normal;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dino-stage,
		.dino-eye,
		.dino-cheek,
		.dino-bubble,
		.companion-orb,
		.ambient-detail,
		.companion-egg-button,
		.chosen-companion,
		.mystery-egg-glow {
			animation: none;
		}
	}
</style>
