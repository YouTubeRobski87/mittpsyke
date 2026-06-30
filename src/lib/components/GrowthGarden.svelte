<script lang="ts">
	import { browser } from '$app/environment';
	import {
		PROGRESS_COMPANION_ANIMALS,
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getProgressCompanionCarePhrases,
		getProgressCompanionDayState,
		getProgressCompanionDayStateImage,
		getProgressCompanionStatusMessage,
		normalizeProgressCompanion,
		readProgressCompanionFromMetadata,
		type ProgressCompanionDayState,
		type ProgressCompanionAnimal,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import CompanionScene from '$lib/components/CompanionScene.svelte';
	import { getTimeOfDay, type TimeOfDay } from '$lib/utils/getTimeOfDay';

	type CompanionAnimalId = string;
	type CompanionStage = 'choose' | 'chosen';

	export let growthScore: number;
	export let growthLevel: number;
	export let entryCount: number = 0;
	export let activeDays: number = 0;
	export let lastEntryDaysAgo: number | null = null;
	export let progressCompanion: ProgressCompanionSelection | string | null = null;

	type CareSignal = {
		label: string;
		text: string;
	};

	type GardenPoint = {
		id: string;
		x: number;
		y: number;
		delay?: string;
	};

	const COMPANION_STORAGE_KEY = 'mittpsyke:progress-companion';
	const LAST_VISIT_STORAGE_KEY = 'mittpsyke:garden-last-visit';

	const AVAILABLE_COMPANION_IDS = new Set<CompanionAnimalId>(['bear']);
	const COMPANION_ANIMALS = PROGRESS_COMPANION_ANIMALS.filter((animal) =>
		AVAILABLE_COMPANION_IDS.has(animal.id)
	);

	const FLOWER_POINTS: GardenPoint[] = [
		{ id: 'f1', x: 78, y: 210 },
		{ id: 'f2', x: 132, y: 200, delay: '0.2s' },
		{ id: 'f3', x: 188, y: 215, delay: '0.4s' },
		{ id: 'f4', x: 332, y: 205, delay: '0.1s' },
		{ id: 'f5', x: 382, y: 216, delay: '0.35s' },
		{ id: 'f6', x: 438, y: 202, delay: '0.55s' },
		{ id: 'f7', x: 254, y: 210, delay: '0.7s' },
		{ id: 'f8', x: 474, y: 218, delay: '0.85s' }
	];

	const LEAF_POINTS: GardenPoint[] = [
		{ id: 'l1', x: 52, y: 178 },
		{ id: 'l2', x: 112, y: 168, delay: '0.15s' },
		{ id: 'l3', x: 162, y: 184, delay: '0.3s' },
		{ id: 'l4', x: 222, y: 174, delay: '0.45s' },
		{ id: 'l5', x: 294, y: 180, delay: '0.6s' },
		{ id: 'l6', x: 356, y: 170, delay: '0.75s' },
		{ id: 'l7', x: 420, y: 182, delay: '0.9s' },
		{ id: 'l8', x: 486, y: 174, delay: '1.05s' },
		{ id: 'l9', x: 28, y: 204, delay: '1.2s' },
		{ id: 'l10', x: 510, y: 200, delay: '1.35s' }
	];

	const SPROUT_POINTS: GardenPoint[] = [
		{ id: 's1', x: 42, y: 218 },
		{ id: 's2', x: 96, y: 224, delay: '0.25s' },
		{ id: 's3', x: 156, y: 222, delay: '0.5s' },
		{ id: 's4', x: 216, y: 228, delay: '0.75s' },
		{ id: 's5', x: 304, y: 226, delay: '1s' },
		{ id: 's6', x: 374, y: 220, delay: '1.25s' },
		{ id: 's7', x: 446, y: 226, delay: '1.5s' },
		{ id: 's8', x: 494, y: 216, delay: '1.75s' }
	];

	const FIREFLY_POINTS: GardenPoint[] = [
		{ id: 'g1', x: 92, y: 88 },
		{ id: 'g2', x: 202, y: 76, delay: '1.5s' },
		{ id: 'g3', x: 318, y: 92, delay: '0.8s' },
		{ id: 'g4', x: 430, y: 72, delay: '2.1s' },
		{ id: 'g5', x: 148, y: 118, delay: '2.8s' },
		{ id: 'g6', x: 388, y: 122, delay: '3.4s' }
	];

	const COMPANION_ACCENT_POINTS: GardenPoint[] = [
		{ id: 'a1', x: 232, y: 132 },
		{ id: 'a2', x: 306, y: 128, delay: '0.7s' },
		{ id: 'a3', x: 226, y: 198, delay: '1.2s' },
		{ id: 'a4', x: 322, y: 188, delay: '1.7s' }
	];

	$: continuitySignals = entryCount + activeDays;
	$: continuityState = continuitySignals >= 16 ? 'settled' : continuitySignals >= 4 ? 'soft' : 'quiet';
	$: careIntensity = Math.min(4, Math.max(growthLevel, Math.floor(growthScore / 24)));
	$: companionLevel = getCompanionLevel(entryCount);
	$: flowerCount = entryCount <= 0 ? 0 : Math.min(FLOWER_POINTS.length, 2 + Math.floor(entryCount / 4));
	$: leafCount = Math.min(LEAF_POINTS.length, 3 + Math.max(growthLevel, Math.floor(activeDays / 2)));
	$: sproutCount = entryCount <= 0 ? 1 : Math.min(SPROUT_POINTS.length, 2 + Math.floor(continuitySignals / 4));
	$: fireflyCount =
		entryCount <= 0 ? 0 : continuityState === 'settled' ? FIREFLY_POINTS.length : continuityState === 'soft' ? 3 : 1;
	$: flowers = FLOWER_POINTS.slice(0, flowerCount);
	$: leaves = LEAF_POINTS.slice(0, leafCount);
	$: sprouts = SPROUT_POINTS.slice(0, sproutCount);
	$: fireflies = FIREFLY_POINTS.slice(0, fireflyCount);
	$: companionAccents = COMPANION_ACCENT_POINTS.slice(0, Math.max(0, companionLevel - 1));
	$: selectedCompanion = selectedAnimalId
		? selectedAnimal?.id === selectedAnimalId
			? selectedAnimal
			: (COMPANION_ANIMALS.find((animal) => animal.id === selectedAnimalId) ?? null)
		: null;
	$: companionName = selectedCompanion?.name ?? 'Din följeslagare';
	$: companionArtId = getProgressCompanionArtId(selectedCompanion?.id);
	$: companionLevelText = getCompanionLevelText(companionLevel);
	$: companionDayStateImage = getProgressCompanionDayStateImage(companionDayState);
	$: careSignals = getCareSignals();
	$: placeCopy =
		entryCount === 0
			? 'Trädgården väntar lugnt. En rad räcker när du vill börja.'
			: activeDays > 1
				? 'Platsen känner igen att du återvänder i din egen takt.'
				: 'Du har lämnat ett första avtryck här.';

	let careCount = 0;
	let observedEntryCount: number | null = null;
	let selectedAnimalId: ProgressCompanionAnimal['id'] | null = null;
	let selectedAnimal: ProgressCompanionAnimal | null = null;
	let appliedProgressCompanion: string | null = null;
	let companionStage: CompanionStage = 'choose';
	let companionMessage = 'Jag är här när du vill börja.';
	let statusMessageKey: string | null = null;
	let companionDayState: ProgressCompanionDayState = getProgressCompanionDayState();
	let timeOfDay: TimeOfDay = getTimeOfDay();

	$: {
		const nextProgressCompanion = normalizeProgressCompanion(progressCompanion);
		if (nextProgressCompanion?.id !== appliedProgressCompanion) {
			appliedProgressCompanion = nextProgressCompanion?.id ?? null;
			const animal = getAvailableCompanionAnimal(nextProgressCompanion);
			if (animal) {
				applyCompanion(animal, getReturnMessage());
			}
		}
	}

	$: {
		if (observedEntryCount === null) {
			observedEntryCount = entryCount;
		} else if (entryCount > observedEntryCount) {
			observedEntryCount = entryCount;
			companionMessage = 'Du har gett trädgården lite mer ljus.';
		}
	}

	$: {
		const nextStatusMessageKey = `${lastEntryDaysAgo ?? 'none'}:${entryCount > 0 ? 'has' : 'empty'}`;
		if (companionStage === 'chosen' && careCount === 0 && statusMessageKey !== nextStatusMessageKey) {
			statusMessageKey = nextStatusMessageKey;
			companionMessage = getReturnMessage();
		}
	}

	onMount(async () => {
		if (!browser) return;
		companionDayState = getProgressCompanionDayState();
		timeOfDay = getTimeOfDay();
		let authenticatedUserFound = false;
		const returnMessage = getReturnMessage();

		try {
			const {
				data: { user },
				error
			} = await supabase.auth.getUser();
			if (error) {
				console.error('Could not load progress companion from Supabase:', error);
			}

			authenticatedUserFound = Boolean(user);
			const remoteSelection = readProgressCompanionFromMetadata(
				(user?.user_metadata ?? null) as Record<string, unknown> | null
			);
			const remoteAnimal = getAvailableCompanionAnimal(remoteSelection);
			if (remoteAnimal) {
				applyCompanion(remoteAnimal, returnMessage);
				cacheCompanion(remoteAnimal.id);
				rememberVisit();
				return;
			}
		} catch (error) {
			console.error('Could not load progress companion from Supabase:', error);
		}

		try {
			if (authenticatedUserFound || selectedAnimalId) {
				rememberVisit();
				return;
			}
			const savedAnimal = localStorage.getItem(COMPANION_STORAGE_KEY);
			const animal = getAvailableCompanionAnimal(savedAnimal);
			if (animal) {
				applyCompanion(animal, returnMessage);
			}
		} catch {
			// Local cache is only a fallback; Supabase metadata is the source for logged-in users.
		}

		rememberVisit();
	});

	function getCompanionLevel(entryCountValue: number) {
		if (entryCountValue >= 60) return 5;
		if (entryCountValue >= 30) return 4;
		if (entryCountValue >= 15) return 3;
		if (entryCountValue >= 5) return 2;
		return 1;
	}

	function getCompanionLevelText(level: number) {
		if (level >= 5) return 'Följeslagaren känns tryggare i platsen och bär mer ljus.';
		if (level === 4) return 'Följeslagaren har blivit mer stadig när du återvänder.';
		if (level === 3) return 'Följeslagaren börjar ta mer plats, lugnt och diskret.';
		if (level === 2) return 'Följeslagaren har börjat växa med din rytm.';
		return 'Följeslagaren väntar stilla medan platsen tar form.';
	}

	function applyCompanion(animal: ProgressCompanionAnimal, message: string) {
		selectedAnimalId = animal.id;
		selectedAnimal = animal;
		companionStage = 'chosen';
		companionMessage = message;
		statusMessageKey = `${lastEntryDaysAgo ?? 'none'}:${entryCount > 0 ? 'has' : 'empty'}`;
	}

	function getAvailableCompanionAnimal(value: unknown): ProgressCompanionAnimal | null {
		const selection = normalizeProgressCompanion(value);
		if (!selection) return null;
		const animal = getProgressCompanionAnimal(selection);
		if (animal && AVAILABLE_COMPANION_IDS.has(animal.id)) return animal;
		return COMPANION_ANIMALS[0] ?? null;
	}

	function cacheCompanion(animalId: CompanionAnimalId) {
		if (!browser) return;
		try {
			localStorage.setItem(COMPANION_STORAGE_KEY, animalId);
		} catch {
			// Local cache is optional.
		}
	}

	async function persistCompanion(animal: ProgressCompanionAnimal) {
		try {
			const { data, error } = await supabase.auth.updateUser({
				data: { progress_companion: animal.id }
			});
			if (error) {
				console.error('Could not save progress companion:', error);
				return;
			}

			const savedSelection = readProgressCompanionFromMetadata(
				(data.user?.user_metadata ?? null) as Record<string, unknown> | null
			);
			const savedAnimal = getAvailableCompanionAnimal(savedSelection) ?? animal;
			applyCompanion(savedAnimal, 'Skönt att ha dig här.');
			cacheCompanion(savedAnimal.id);

			const { error: refreshError } = await supabase.auth.refreshSession();
			if (refreshError) {
				console.error('Could not refresh progress companion session:', refreshError);
			}
		} catch (error) {
			console.error('Could not save progress companion:', error);
		}
	}

	function chooseCompanion(animal: ProgressCompanionAnimal) {
		applyCompanion(animal, 'Nu finns jag kvar här med dig.');
		void persistCompanion(animal);
	}

	function changeCompanion() {
		companionStage = 'choose';
		companionMessage = 'Välj den följeslagare som känns rätt idag.';
	}

	function giveCalm() {
		careCount += 1;
		const phrases = getProgressCompanionCarePhrases({
			lastEntryDaysAgo,
			hasEntries: entryCount > 0
		});
		companionMessage = phrases[careCount % phrases.length];
	}

	function getReturnMessage() {
		const statusMessage = getProgressCompanionStatusMessage({
			lastEntryDaysAgo,
			hasEntries: entryCount > 0
		});
		if (entryCount > 0 || lastEntryDaysAgo !== null) return statusMessage;

		if (!browser) return 'Jag är här när du vill börja.';

		try {
			const lastVisit = localStorage.getItem(LAST_VISIT_STORAGE_KEY);
			if (!lastVisit) return 'Jag är här när du vill börja.';

			const last = new Date(lastVisit);
			const daysAway = Math.floor((Date.now() - last.getTime()) / 86_400_000);
			if (Number.isFinite(daysAway) && daysAway >= 3) {
				return getProgressCompanionStatusMessage({
					lastEntryDaysAgo: daysAway,
					hasEntries: true
				});
			}
		} catch {
			// Visit memory is optional.
		}

		return 'Fint att du kom tillbaka.';
	}

	function rememberVisit() {
		if (!browser) return;
		try {
			localStorage.setItem(LAST_VISIT_STORAGE_KEY, new Date().toISOString());
		} catch {
			// Visit memory is optional.
		}
	}

	function getCareSignals(): CareSignal[] {
		const lightText =
			entryCount === 0
				? 'Väntar stilla'
				: entryCount < 6
					? 'Ett mjukt första ljus'
					: entryCount < 16
						? 'Lite varmare här'
						: 'Platsen bär mer ljus';
		const plantText =
			flowerCount <= 0
				? 'Frön i vila'
				: flowerCount < 5
					? 'Några blad har kommit'
					: 'Fler små detaljer syns';
		const returnText =
			activeDays <= 0
				? 'Ingen brådska'
				: activeDays === 1
					? 'Ett varsamt avtryck'
					: 'Du har återvänt hit';

		return [
			{ label: 'Ljus', text: lightText },
			{ label: 'Växtlighet', text: plantText },
			{ label: 'Närvaro', text: returnText }
		];
	}
</script>

<section
	id="growth-garden"
	class="garden-card card"
	aria-labelledby="growth-garden-title"
	data-continuity={continuityState}
	data-care-intensity={careIntensity}
	data-companion-level={companionLevel}
	data-day-state={companionDayState}
>
	<div class="garden-copy">
		<h2 id="growth-garden-title">Din växande plats</h2>
		<p class="garden-intro">
			Trädgården växer när du skriver. Din följeslagare finns kvar när du kommer tillbaka och
			utvecklas varsamt när du fortsätter använda dagboken.
		</p>
	</div>

	<div class="garden-scene">
		<svg viewBox="0 0 520 260" role="presentation" focusable="false" preserveAspectRatio="xMidYMid slice">
			<defs>
				<linearGradient id="gardenSky" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-sky-top)" />
					<stop offset="58%" stop-color="var(--garden-sky-mid)" />
					<stop offset="100%" stop-color="var(--garden-sky-bottom)" />
				</linearGradient>
				<linearGradient id="gardenGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-ground-top)" />
					<stop offset="100%" stop-color="var(--garden-ground-bottom)" />
				</linearGradient>
				<linearGradient id="gardenFrontGround" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="var(--garden-front-top)" />
					<stop offset="100%" stop-color="var(--garden-front-bottom)" />
				</linearGradient>
			</defs>

			<rect x="0" y="0" width="520" height="260" rx="30" fill="url(#gardenSky)" />
			<ellipse class="garden-light" cx="394" cy="46" rx="124" ry="76" />
			<ellipse class="garden-mist mist-left" cx="124" cy="82" rx="92" ry="20" />
			<ellipse class="garden-mist mist-right" cx="366" cy="106" rx="132" ry="24" />
			<path
				class="garden-horizon"
				d="M0 148 C62 130 130 130 198 146 S330 170 410 150 S476 132 520 142 L520 260 L0 260 Z"
			/>
			<path
				fill="url(#gardenGround)"
				d="M0 178 C70 158 142 162 220 180 S374 206 520 176 L520 260 L0 260 Z"
			/>
			<path
				fill="url(#gardenFrontGround)"
				d="M0 202 C78 186 164 190 250 204 S410 226 520 196 L520 260 L0 260 Z"
			/>

			<g class="garden-sprouts">
				{#each sprouts as sprout}
					<g style={`animation-delay: ${sprout.delay ?? '0s'}`}>
						<path d={`M${sprout.x} ${sprout.y} C${sprout.x - 2} ${sprout.y - 9} ${sprout.x + 1} ${sprout.y - 15} ${sprout.x + 5} ${sprout.y - 21}`} />
						<path d={`M${sprout.x + 4} ${sprout.y - 13} C${sprout.x - 4} ${sprout.y - 17} ${sprout.x - 8} ${sprout.y - 11} ${sprout.x - 3} ${sprout.y - 7}`} />
						<path d={`M${sprout.x + 6} ${sprout.y - 17} C${sprout.x + 15} ${sprout.y - 20} ${sprout.x + 17} ${sprout.y - 12} ${sprout.x + 9} ${sprout.y - 9}`} />
					</g>
				{/each}
			</g>

			<g class="garden-leaves">
				{#each leaves as leaf}
					<path
						style={`animation-delay: ${leaf.delay ?? '0s'}`}
						d={`M${leaf.x} ${leaf.y + 34} C${leaf.x + 4} ${leaf.y + 16} ${leaf.x + 14} ${leaf.y + 8} ${leaf.x + 24} ${leaf.y + 6} C${leaf.x + 20} ${leaf.y + 20} ${leaf.x + 10} ${leaf.y + 30} ${leaf.x} ${leaf.y + 34} Z`}
					/>
				{/each}
			</g>

			<g class="garden-flowers">
				{#each flowers as flower}
					<g style={`animation-delay: ${flower.delay ?? '0s'}`}>
						<path d={`M${flower.x} ${flower.y + 18} C${flower.x - 2} ${flower.y + 8} ${flower.x + 1} ${flower.y + 2} ${flower.x + 5} ${flower.y - 6}`} />
						<circle cx={flower.x + 5} cy={flower.y - 8} r="4.2" />
						<circle cx={flower.x + 1} cy={flower.y - 5} r="3.4" />
						<circle cx={flower.x + 9} cy={flower.y - 4} r="3.2" />
					</g>
				{/each}
			</g>

			<g class="fireflies">
				{#each fireflies as firefly}
					<circle
						style={`animation-delay: ${firefly.delay ?? '0s'}`}
						cx={firefly.x}
						cy={firefly.y}
						r="2.6"
					/>
				{/each}
			</g>

			{#if companionStage === 'chosen' && selectedCompanion}
				<g class="companion-aura" aria-hidden="true">
					{#each companionAccents as accent}
						<circle
							style={`animation-delay: ${accent.delay ?? '0s'}`}
							cx={accent.x}
							cy={accent.y}
							r={2.4 + companionLevel * 0.35}
						/>
					{/each}
				</g>
				{#if companionArtId !== 'bear'}
				<g class={`companion-figure companion-${companionArtId}`} aria-hidden="true">
					<ellipse class="companion-shadow" cx="270" cy="224" rx="58" ry="10" />

					{#if companionArtId === 'fox'}
						<g class="companion-tail">
							<path class="tail-fill" d="M224 190 C184 184 178 146 210 134 C226 148 230 170 224 190 Z" />
							<path class="tail-tip" d="M196 139 C184 148 184 166 196 178 C202 164 204 151 196 139 Z" />
						</g>
						<path class="ear left-ear" d="M238 142 L250 112 L262 144 Z" />
						<path class="ear right-ear" d="M284 144 L300 114 L306 148 Z" />
					{:else if companionArtId === 'owl'}
						<path class="ear left-ear" d="M238 140 L244 116 L262 138 Z" />
						<path class="ear right-ear" d="M282 138 L302 116 L306 140 Z" />
					{:else if companionArtId === 'rabbit'}
						<path class="ear left-ear rabbit-ear" d="M248 136 C238 106 240 78 254 70 C266 94 264 118 256 140 Z" />
						<path class="ear right-ear rabbit-ear" d="M278 138 C280 106 292 82 306 78 C310 108 298 128 286 144 Z" />
					{:else if companionArtId === 'squirrel'}
						<path class="companion-tail squirrel-tail" d="M220 192 C178 174 188 122 230 128 C214 148 226 166 246 172 C236 176 228 184 220 192 Z" />
						<path class="ear left-ear" d="M244 140 L250 118 L264 140 Z" />
						<path class="ear right-ear" d="M286 140 L300 118 L304 142 Z" />
					{:else if companionArtId === 'turtle'}
						<ellipse class="shell" cx="270" cy="178" rx="58" ry="42" />
						<path class="shell-line" d="M232 178 H308 M270 138 V218 M244 150 C260 164 280 164 296 150" />
					{:else}
						<path class="ear left-ear" d="M242 142 L250 122 L262 144 Z" />
						<path class="ear right-ear" d="M284 144 L298 124 L304 148 Z" />
					{/if}

					<g class="companion-breath">
						{#if companionArtId !== 'turtle'}
							<ellipse class="body-fill" cx="270" cy="182" rx="45" ry="48" />
						{/if}
						{#if companionArtId === 'owl'}
							<path class="wing left-wing" d="M236 174 C220 188 220 206 242 214" />
							<path class="wing right-wing" d="M304 174 C320 188 320 206 298 214" />
						{:else if companionArtId === 'turtle'}
							<path class="leg" d="M232 210 C226 220 218 222 210 216" />
							<path class="leg" d="M300 214 C308 222 318 222 324 214" />
						{:else}
							<ellipse class="belly-fill" cx="270" cy="194" rx="25" ry="28" />
						{/if}
						<g class="companion-head">
							{#if companionArtId === 'turtle'}
								<circle class="head-fill" cx="326" cy="176" r="18" />
							{:else}
								<ellipse class="face-fill" cx="270" cy="156" rx="36" ry="34" />
							{/if}
							{#if companionArtId === 'owl'}
								<circle class="eye-ring" cx="257" cy="154" r="12" />
								<circle class="eye-ring" cx="283" cy="154" r="12" />
								<path class="beak" d="M270 158 L264 168 H276 Z" />
							{/if}
							<g class="open-eyes">
								<ellipse class="eye companion-eye left-eye" cx={companionArtId === 'turtle' ? 331 : 258} cy={companionArtId === 'turtle' ? 172 : 154} rx="2.8" ry="3.6" />
								<ellipse class="eye companion-eye right-eye" cx={companionArtId === 'turtle' ? 342 : 282} cy={companionArtId === 'turtle' ? 172 : 154} rx="2.8" ry="3.6" />
							</g>
							<g class="sleep-eyes">
								<path d={companionArtId === 'turtle' ? 'M326 172 C330 175 334 175 338 172' : 'M252 154 C256 157 260 157 264 154'} />
								<path d={companionArtId === 'turtle' ? 'M338 172 C342 175 346 175 350 172' : 'M276 154 C280 157 284 157 288 154'} />
							</g>
							{#if companionArtId !== 'owl'}
								<path class="mouth" d={companionArtId === 'turtle' ? 'M330 182 C334 185 340 185 344 182' : 'M262 170 C266 174 274 174 278 170'} />
							{/if}
							{#if companionArtId === 'fox'}
								<path class="muzzle" d="M250 164 C258 154 282 154 290 164 C284 176 256 176 250 164 Z" />
							{/if}
						</g>
					</g>
				</g>
				{/if}
			{/if}
		</svg>

		{#if companionStage === 'chosen' && companionArtId === 'bear'}
			<div
				class="garden-photo"
				style={`--garden-photo-image: url('${companionDayStateImage}')`}
				aria-hidden="true"
			></div>
			{#if companionDayState === 'day'}
				<img
					class="garden-butterfly"
					src="/images/companion-butterfly.png"
					alt=""
					aria-hidden="true"
					loading="lazy"
					decoding="async"
				/>
			{/if}
		{/if}

		<CompanionScene {timeOfDay} />

		{#if companionStage === 'choose'}
			<div class="scene-invitation">
				<p>Välj en följeslagare som får bo här med dig.</p>
			</div>
		{/if}
		<p class="companion-bubble" aria-live="polite">{companionMessage}</p>
	</div>

	<div class="companion-panel" aria-label="Följeslagarens plats">
		<div class="companion-summary">
			<span>{continuityState === 'settled' ? 'Mer liv i platsen' : continuityState === 'soft' ? 'Varsam rytm' : 'Stilla början'}</span>
			<strong>{companionName} håller platsen sällskap.</strong>
			<p>{placeCopy}</p>
			{#if companionStage === 'chosen'}
				<p class="companion-level-text">
					<span>Varsam närvaro</span>
					{companionLevelText}
				</p>
			{/if}
		</div>

		{#if companionStage === 'choose'}
			<div class="animal-chooser" aria-label="Välj följeslagare">
				{#each COMPANION_ANIMALS as animal}
					<button type="button" onclick={() => chooseCompanion(animal)}>
						<span aria-hidden="true" class={`animal-mark animal-${getProgressCompanionArtId(animal.id)}`}></span>
						<span>
							<strong>{animal.name}</strong>
							<small>{animal.temperament}</small>
						</span>
					</button>
				{/each}
			</div>
		{/if}

		<div class="care-signals">
			{#each careSignals as signal}
				<div class="care-signal">
					<span>{signal.label}</span>
					<strong>{signal.text}</strong>
				</div>
			{/each}
		</div>

		<div class="companion-care">
			<p>{companionStage === 'chosen' ? 'Du behöver inte hålla en takt. Platsen finns kvar ändå.' : 'Det går bra att börja stilla.'}</p>
			<div class="companion-actions">
				<button type="button" onclick={giveCalm}>Säg hej</button>
				{#if companionStage === 'chosen'}
					<button class="secondary" type="button" onclick={changeCompanion}>Byt följeslagare</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="garden-meta">
		<p class="garden-note">Här får små avtryck finnas kvar.</p>
		<p class="garden-stats">Trädgården förändras långsamt med dina reflektioner.</p>
	</div>
</section>

<style>
	.garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 62%, #f2f5ef 38%);
		--garden-sky-mid: color-mix(in srgb, hsl(var(--surface-soft)) 82%, #eef1ea 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 90%, #dfe8dd 10%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 20%, #8fa08d 80%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 38%, #526854 62%);
		--garden-front-top: color-mix(in srgb, var(--theme-accent, #436e8f) 32%, #63775f 68%);
		--garden-front-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 48%, #405542 52%);
		--garden-light: rgba(246, 234, 190, 0.38);
		--garden-mist: rgba(255, 255, 255, 0.28);
		--garden-leaf: color-mix(in srgb, var(--theme-accent, #436e8f) 36%, #7f966f 64%);
		--garden-leaf-dark: color-mix(in srgb, var(--theme-accent, #436e8f) 52%, #4f674d 48%);
		--garden-flower: #e8bccb;
		--garden-flower-center: #f3dcc4;
		--garden-firefly: rgba(248, 235, 190, 0.74);
		--companion-body: #bf7a4f;
		--companion-body-dark: #93583b;
		--companion-belly: #f0d9c3;
		--companion-face: #d9905f;
		--companion-line: #4a342a;
		--companion-eye: #2e2a27;
		--companion-soft: rgba(255, 255, 255, 0.7);
		padding: 2rem;
		border-radius: var(--radius-card);
		border: 1px solid var(--color-dashboard-border);
		background: hsl(var(--surface));
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
		max-width: 46rem;
		font-size: 0.98rem;
		line-height: 1.7;
		color: hsl(var(--muted-foreground));
	}

	.garden-scene {
		position: relative;
		width: 100%;
		/* Rutan är mindre bred än björnbilden så fotot inte blir för inzoomat */
		aspect-ratio: 4 / 3;
		border-radius: 1.2rem;
		overflow: hidden;
		/* Bilden fyller hela rutan – ingen ram eller inre fade som ritar mörk kant */
		background: color-mix(in srgb, hsl(var(--surface-soft)) 90%, white 10%);
	}

	.garden-scene svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}

	/* Björnfotot som eget helbildslager (frikopplat från SVG-koordinaterna) */
	.garden-photo {
		position: absolute;
		inset: 0;
		background-image: var(--garden-photo-image, url('/images/resting-bear-photo-fill.png'));
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transform-origin: 42% 72%;
		animation: garden-photo-breathe 22s ease-in-out 1s infinite;
	}

	.garden-photo::before,
	.garden-photo::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.garden-photo::before {
		background:
			radial-gradient(circle at 58% 28%, rgba(255, 239, 197, 0.36), rgba(255, 239, 197, 0) 42%),
			linear-gradient(115deg, rgba(255, 255, 255, 0) 8%, rgba(255, 247, 221, 0.28) 48%, rgba(255, 255, 255, 0) 88%);
		mix-blend-mode: screen;
		opacity: 0.78;
		animation: garden-sanctuary-light 18s ease-in-out infinite;
	}

	.garden-photo::after {
		inset: 0;
		background:
			radial-gradient(ellipse at 30% 72%, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08) 28%, rgba(255, 255, 255, 0) 62%),
			radial-gradient(ellipse at 74% 64%, rgba(255, 247, 221, 0.18), rgba(255, 247, 221, 0.07) 30%, rgba(255, 247, 221, 0) 64%),
			linear-gradient(104deg, rgba(255, 255, 255, 0) 12%, rgba(255, 255, 255, 0.1) 52%, rgba(255, 255, 255, 0) 84%);
		background-size: 138% 100%, 128% 100%, 170% 100%;
		background-position: -24% 2%, 112% 1%, -36% 0;
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			transparent 32%,
			rgba(0, 0, 0, 0.12) 48%,
			rgba(0, 0, 0, 0.68) 72%,
			black 100%
		);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			transparent 32%,
			rgba(0, 0, 0, 0.12) 48%,
			rgba(0, 0, 0, 0.68) 72%,
			black 100%
		);
		opacity: 0.54;
		transform-origin: center;
		animation: garden-quiet-water-light 18s ease-in-out infinite;
	}

	.garden-card:not([data-day-state='night']) .garden-photo {
		background-position: left center;
	}

	.garden-butterfly {
		position: absolute;
		left: 33%;
		top: 35%;
		z-index: 2;
		width: clamp(1.25rem, 4.8vw, 2.15rem);
		height: auto;
		pointer-events: none;
		opacity: 0;
		transform: translate3d(0, 0, 0);
		filter: drop-shadow(0 0.1rem 0.12rem rgba(35, 24, 12, 0.18));
		image-rendering: auto;
		animation: garden-butterfly-pass 56s ease-in-out 8s infinite;
	}

	.garden-light {
		fill: var(--garden-light);
		opacity: 0.78;
		transition: opacity 220ms ease;
	}

	.garden-card[data-continuity='soft'] .garden-light {
		opacity: 0.9;
	}

	.garden-card[data-continuity='settled'] .garden-light {
		opacity: 1;
	}

	.garden-mist {
		fill: var(--garden-mist);
	}

	.mist-left {
		opacity: 0.64;
	}

	.mist-right {
		opacity: 0.44;
	}

	.garden-horizon {
		fill: rgba(255, 255, 255, 0.09);
	}

	.garden-sprouts g {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: plant-arrive 520ms ease-out both, sprout-sway 15s ease-in-out infinite;
	}

	.garden-sprouts path {
		fill: none;
		stroke: var(--garden-leaf-dark);
		stroke-width: 2.1;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0.72;
	}

	.garden-leaves path {
		fill: var(--garden-leaf);
		opacity: 0.72;
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: plant-arrive 480ms ease-out both, leaf-idle 16s ease-in-out infinite;
	}

	.garden-leaves path:nth-child(even) {
		fill: var(--garden-leaf-dark);
	}

	.garden-flowers g {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: plant-arrive 520ms ease-out both;
	}

	.garden-flowers path {
		fill: none;
		stroke: var(--garden-leaf-dark);
		stroke-width: 2.2;
		stroke-linecap: round;
	}

	.garden-flowers circle {
		fill: var(--garden-flower);
	}

	.garden-flowers circle:first-of-type {
		fill: var(--garden-flower-center);
	}

	.fireflies circle {
		fill: var(--garden-firefly);
		filter: drop-shadow(0 0 8px var(--garden-firefly));
		opacity: 0.5;
		animation: firefly-drift 9s ease-in-out infinite;
	}

	.photo-resting-companion {
		opacity: 0;
		pointer-events: none;
		transform-box: fill-box;
		transform-origin: 31% 92%;
		filter:
			drop-shadow(0 18px 20px rgba(7, 10, 12, 0.28)) saturate(0.92) contrast(1.06)
			brightness(0.94);
		animation: photo-companion-arrive 960ms ease-out both;
	}

	.photo-resting-image {
		opacity: 0.94;
		transform-box: fill-box;
		transform-origin: 31% 88%;
		animation: photo-companion-breathe 18s ease-in-out 1.2s infinite;
	}

	.garden-card[data-day-state='night'] .photo-resting-companion {
		filter:
			drop-shadow(0 20px 24px rgba(4, 7, 10, 0.34)) saturate(0.9) contrast(1.08)
			brightness(0.86);
	}

	.garden-card[data-day-state='night'] .photo-resting-image {
		opacity: 0.9;
		animation-duration: 22s;
	}

	.resting-tree {
		--resting-tree-opacity: 0.72;
		opacity: 0;
		pointer-events: none;
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: tree-presence 720ms ease-out both;
	}

	.resting-tree-shadow {
		fill: rgba(12, 17, 16, 0.34);
	}

	.resting-tree-trunk {
		fill: color-mix(in srgb, var(--theme-accent, #436e8f) 18%, #34271f 82%);
	}

	.resting-tree-bark,
	.resting-tree-branch {
		fill: none;
		stroke: color-mix(in srgb, var(--theme-accent, #436e8f) 10%, #211a16 90%);
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.resting-tree-bark {
		opacity: 0.42;
		stroke-width: 2.4;
	}

	.resting-tree-branch {
		opacity: 0.46;
		stroke-width: 7;
	}

	.resting-tree-canopy {
		fill: color-mix(in srgb, var(--theme-accent, #436e8f) 28%, #172319 72%);
		opacity: 0.78;
	}

	.resting-tree-leaves {
		fill: color-mix(in srgb, var(--theme-accent, #436e8f) 28%, #6f7f59 72%);
		opacity: 0.42;
		animation: tree-leaves-idle 15s ease-in-out infinite;
		transform-box: fill-box;
		transform-origin: center;
	}

	.companion-figure {
		--companion-body: #bf7a4f;
		--companion-body-dark: #93583b;
		--companion-belly: #f0d9c3;
		--companion-face: #d9905f;
		--companion-scale: 1;
		--companion-glow: 0px;
		--companion-x: 0px;
		--companion-y: 0px;
		--companion-tilt: 0deg;
		transform-box: fill-box;
		transform-origin: center bottom;
		transform: translate(var(--companion-x, 0px), var(--companion-y, 0px))
			scale(var(--companion-scale, 1)) rotate(var(--companion-tilt, 0deg));
		filter: drop-shadow(0 0 var(--companion-glow) rgba(246, 234, 190, 0.34));
		animation: companion-presence 420ms ease-out both;
	}

	.garden-card[data-companion-level='2'] .companion-figure {
		--companion-scale: 1.025;
		--companion-glow: 3px;
	}

	.garden-card[data-companion-level='3'] .companion-figure {
		--companion-scale: 1.05;
		--companion-glow: 5px;
	}

	.garden-card[data-companion-level='4'] .companion-figure {
		--companion-scale: 1.075;
		--companion-glow: 7px;
	}

	.garden-card[data-companion-level='5'] .companion-figure {
		--companion-scale: 1.1;
		--companion-glow: 9px;
	}

	.companion-aura circle {
		fill: rgba(248, 235, 190, 0.64);
		filter: drop-shadow(0 0 6px rgba(248, 235, 190, 0.44));
		opacity: 0.44;
		animation: companion-accent-drift 7s ease-in-out infinite;
	}

	.companion-breath {
		--companion-breath-tilt: 0deg;
		transform-box: fill-box;
		transform-origin: center bottom;
		transform: rotate(var(--companion-breath-tilt, 0deg));
		animation: companion-breathe 6s ease-in-out infinite;
	}

	.companion-head {
		transform-box: fill-box;
		transform-origin: center bottom;
	}

	.companion-fox {
		--companion-body: #c87948;
		--companion-body-dark: #9c5838;
		--companion-belly: #f2d8bf;
		--companion-face: #d68a55;
	}

	.companion-bear {
		--companion-body: #8c6750;
		--companion-body-dark: #5e4234;
		--companion-belly: #c8aa8c;
		--companion-face: #96705a;
		--companion-x: -118px;
		--companion-y: 11px;
		--companion-tilt: -9deg;
		--companion-scale: 0.92;
	}

	.companion-bear .companion-breath {
		--companion-breath-tilt: -2deg;
		transform-origin: 32% 100%;
		animation-duration: 11s;
	}

	.companion-bear .companion-shadow {
		fill: rgba(13, 17, 16, 0.28);
	}

	.companion-bear .body-fill {
		transform-box: fill-box;
		transform-origin: center bottom;
		transform: rotate(-8deg) translate(-2px, 2px);
	}

	.companion-bear .belly-fill {
		opacity: 0.76;
		transform-box: fill-box;
		transform-origin: center;
		transform: rotate(-8deg) translate(-4px, 4px);
	}

	.companion-bear .companion-head {
		transform: translate(-8px, 8px) rotate(-8deg);
	}

	.companion-bear .left-ear {
		transform-box: fill-box;
		transform-origin: center;
		transform: translate(-10px, 8px);
	}

	.companion-bear .right-ear {
		transform-box: fill-box;
		transform-origin: center;
		transform: translate(-8px, 10px);
	}

	.companion-bear .open-eyes {
		display: none;
	}

	.companion-bear .sleep-eyes {
		display: block;
	}

	.resting-bear-arm,
	.resting-bear-foot {
		fill: var(--companion-body-dark);
		opacity: 0.82;
		transform-box: fill-box;
		transform-origin: center;
	}

	.resting-bear-arm {
		opacity: 0.56;
	}

	.resting-bear-arm.left-arm {
		transform: rotate(22deg) translate(-7px, 5px);
	}

	.resting-bear-arm.right-arm {
		transform: rotate(-22deg) translate(5px, 3px);
	}

	.resting-bear-foot.left-foot {
		transform: rotate(12deg) translate(-4px, 0);
	}

	.resting-bear-foot.right-foot {
		transform: rotate(-12deg) translate(4px, 0);
	}

	.companion-owl {
		--companion-body: #8b745f;
		--companion-body-dark: #635040;
		--companion-belly: #d9c7aa;
		--companion-face: #9d856d;
	}

	.companion-rabbit {
		--companion-body: #c9b9ad;
		--companion-body-dark: #9d8b80;
		--companion-belly: #efe4d8;
		--companion-face: #d2c3b7;
	}

	.companion-squirrel {
		--companion-body: #b8754e;
		--companion-body-dark: #895538;
		--companion-belly: #e9c7ac;
		--companion-face: #c7865c;
	}

	.companion-turtle {
		--companion-body: #87986f;
		--companion-body-dark: #5f704f;
		--companion-belly: #cbd6b1;
		--companion-face: #91a075;
	}

	.companion-dino {
		--companion-body: #96ad7e;
		--companion-body-dark: #687f5a;
		--companion-belly: #d9d9b6;
		--companion-face: #a5ba8b;
	}

	.companion-shadow {
		fill: rgba(44, 60, 51, 0.16);
	}

	.body-fill,
	.head-fill,
	.ear,
	.tail-fill,
	.squirrel-tail {
		fill: var(--companion-body);
	}

	.face-fill {
		fill: var(--companion-face);
	}

	.belly-fill,
	.tail-tip,
	.muzzle,
	.eye-ring {
		fill: var(--companion-belly);
	}

	.shell {
		fill: var(--companion-body);
		stroke: var(--companion-body-dark);
		stroke-width: 2.6;
	}

	.shell-line,
	.leg,
	.wing,
	.mouth {
		fill: none;
		stroke: var(--companion-line);
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.shell-line {
		opacity: 0.34;
		stroke-width: 2.1;
	}

	.leg,
	.wing {
		opacity: 0.32;
		stroke-width: 5;
	}

	.mouth {
		stroke-width: 2;
		opacity: 0.76;
	}

	.eye {
		fill: var(--companion-eye);
		transform-box: fill-box;
		transform-origin: center;
		animation: companion-blink 7.2s ease-in-out infinite;
	}

	.sleep-eyes {
		display: none;
	}

	.sleep-eyes path {
		fill: none;
		stroke: var(--companion-line);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
		opacity: 0.78;
	}

	.companion-owl .eye {
		animation-duration: 6.2s;
	}

	.garden-card[data-day-state='evening'] .companion-breath {
		animation-duration: 10.5s;
	}

	.garden-card[data-day-state='evening'] .eye {
		animation-duration: 11.5s;
	}

	.garden-card[data-day-state='evening'] .companion-head,
	.garden-card[data-day-state='evening'] .ear,
	.garden-card[data-day-state='evening'] .rabbit-ear,
	.garden-card[data-day-state='evening'] .companion-tail,
	.garden-card[data-day-state='evening'] .companion-bubble {
		animation-duration: 13s;
	}

	.garden-card[data-day-state='night'] .companion-breath {
		animation-duration: 12s;
	}

	.garden-card[data-day-state='night'] .resting-tree {
		--resting-tree-opacity: 0.86;
	}

	.garden-card[data-day-state='night'] .resting-tree-canopy {
		opacity: 0.38;
	}

	.garden-card[data-day-state='night'] .companion-bear {
		--companion-scale: 0.9;
		--companion-glow: 0px;
	}

	.garden-card[data-day-state='night'] .companion-bear .companion-breath {
		--companion-breath-tilt: -2deg;
	}

	.garden-card[data-day-state='night'] .companion-head,
	.garden-card[data-day-state='night'] .ear,
	.garden-card[data-day-state='night'] .rabbit-ear {
		animation: none;
	}

	.garden-card[data-day-state='night'] .companion-tail,
	.garden-card[data-day-state='night'] .companion-bubble {
		animation-duration: 14s;
	}

	.garden-card[data-day-state='night'] .companion-aura circle {
		opacity: 0.22;
		animation-duration: 12s;
	}

	.garden-card[data-day-state='night'] .open-eyes {
		display: none;
	}

	.garden-card[data-day-state='night'] .sleep-eyes {
		display: block;
	}

	.companion-fox .companion-head {
		animation: fox-listen 9.5s ease-in-out infinite;
	}

	.companion-owl .companion-head {
		animation: owl-look 10.5s ease-in-out infinite;
	}

	.companion-rabbit .companion-head {
		animation: rabbit-listen 8.8s ease-in-out infinite;
	}

	.companion-squirrel .companion-head {
		animation: squirrel-attend 7.8s ease-in-out infinite;
	}

	.companion-turtle .companion-head {
		animation: turtle-peek 11s ease-in-out infinite;
	}

	.companion-dino .companion-head {
		animation: dino-nod 10.8s ease-in-out infinite;
	}

	.companion-fox .ear,
	.companion-squirrel .ear,
	.companion-dino .ear {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: ear-listen 9.8s ease-in-out infinite;
	}

	.companion-fox .right-ear,
	.companion-squirrel .right-ear,
	.companion-dino .right-ear {
		animation-delay: 0.35s;
	}

	.rabbit-ear {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: rabbit-ear-idle 7.4s ease-in-out infinite;
	}

	.companion-fox .right-eye,
	.companion-owl .right-eye {
		animation-delay: 0.1s;
	}

	.companion-fox .companion-tail,
	.companion-squirrel .companion-tail {
		transform-box: fill-box;
		transform-origin: right bottom;
		animation: tail-idle 8.8s ease-in-out infinite;
	}

	.beak {
		fill: #d9a35d;
		opacity: 0.9;
	}

	.scene-invitation {
		position: absolute;
		left: 50%;
		top: 54%;
		z-index: 2;
		width: min(17rem, calc(100% - 2rem));
		padding: 0.85rem 1rem;
		border-radius: 1rem;
		transform: translate(-50%, -50%);
		background: color-mix(in srgb, hsl(var(--surface)) 88%, white 12%);
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 18%, var(--color-dashboard-border) 82%);
		box-shadow: 0 12px 28px rgba(28, 40, 36, 0.1);
		text-align: center;
	}

	.scene-invitation p {
		margin: 0;
		color: hsl(var(--foreground));
		font-size: 0.9rem;
		line-height: 1.45;
	}

	.companion-bubble {
		position: absolute;
		top: 1rem;
		right: 1rem;
		max-width: min(15rem, calc(100% - 2rem));
		margin: 0;
		padding: 0.7rem 0.85rem;
		border-radius: 1rem 1rem 0.35rem 1rem;
		background: color-mix(in srgb, hsl(var(--surface)) 88%, white 12%);
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 18%, var(--color-dashboard-border) 82%);
		box-shadow: 0 10px 24px rgba(28, 40, 36, 0.1);
		color: hsl(var(--foreground));
		font-size: 0.9rem;
		line-height: 1.45;
		animation: bubble-float 6.4s ease-in-out infinite;
	}

	.companion-bubble::after {
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

	.companion-summary p,
	.companion-care p {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.companion-summary .companion-level-text {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.55rem;
		align-items: baseline;
		margin-top: 0.15rem;
	}

	.companion-summary .companion-level-text span {
		color: color-mix(in srgb, var(--theme-accent, #436e8f) 74%, hsl(var(--foreground)) 26%);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: none;
	}

	.animal-chooser {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.55rem;
	}

	.animal-chooser button {
		display: inline-flex;
		gap: 0.55rem;
		align-items: center;
		border: 1px solid color-mix(in srgb, var(--theme-accent, #436e8f) 18%, var(--color-dashboard-border) 82%);
		border-radius: 0.85rem;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
		padding: 0.6rem 0.68rem;
		font: inherit;
		text-align: left;
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

	.animal-chooser button span:last-child {
		display: grid;
		gap: 0.08rem;
	}

	.animal-chooser strong {
		font-size: 0.9rem;
		font-weight: 650;
	}

	.animal-chooser small {
		color: hsl(var(--muted-foreground));
		font-size: 0.76rem;
		line-height: 1.25;
	}

	.animal-mark {
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 999px;
		background: var(--companion-body, #9b735d);
		box-shadow: inset 0 -0.35rem 0 var(--companion-body-dark, #765443);
		flex-shrink: 0;
	}

	.animal-fox { --companion-body: #c87948; --companion-body-dark: #9c5838; }
	.animal-bear { --companion-body: #9b735d; --companion-body-dark: #765443; }
	.animal-owl { --companion-body: #8b745f; --companion-body-dark: #635040; }
	.animal-rabbit { --companion-body: #c9b9ad; --companion-body-dark: #9d8b80; }
	.animal-squirrel { --companion-body: #b8754e; --companion-body-dark: #895538; }
	.animal-turtle { --companion-body: #87986f; --companion-body-dark: #5f704f; }
	.animal-dino { --companion-body: #96ad7e; --companion-body-dark: #687f5a; }

	.care-signals {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.7rem;
	}

	.care-signal {
		display: grid;
		gap: 0.2rem;
		min-width: 0;
		padding: 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-dashboard-border) 80%, var(--theme-accent, #436e8f) 20%);
		border-radius: 0.8rem;
		background: color-mix(in srgb, hsl(var(--surface)) 72%, transparent 28%);
	}

	.care-signal span {
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
	}

	.care-signal strong {
		color: hsl(var(--foreground));
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.25;
	}

	.companion-care,
	.garden-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem 1rem;
		align-items: center;
		justify-content: space-between;
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

	.garden-note,
	.garden-stats {
		font-size: 0.84rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
	}

	.garden-stats {
		white-space: nowrap;
	}

	@keyframes plant-arrive {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.86);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes leaf-idle {
		0%,
		100% {
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		50% {
			transform: translate3d(0.6px, 0, 0) rotate(0.55deg);
		}
	}

	@keyframes sprout-sway {
		0%,
		100% {
			transform: rotate(0deg);
		}
		48% {
			transform: rotate(-0.55deg);
		}
		72% {
			transform: rotate(0.35deg);
		}
	}

	@keyframes firefly-drift {
		0%,
		100% {
			transform: translate3d(0, 0, 0);
			opacity: 0.22;
		}
		45% {
			transform: translate3d(-8px, 6px, 0);
			opacity: 0.62;
		}
		72% {
			transform: translate3d(7px, -5px, 0);
			opacity: 0.42;
		}
	}

	@keyframes garden-butterfly-pass {
		0%,
		18%,
		100% {
			opacity: 0;
			transform: translate3d(0, 0, 0) scale(0.84) rotate(-4deg);
		}
		24% {
			opacity: 0.42;
		}
		46% {
			opacity: 0.48;
			transform: translate3d(2rem, -0.35rem, 0) scale(0.9) rotate(2deg);
		}
		72% {
			opacity: 0.34;
			transform: translate3d(4.5rem, 0.08rem, 0) scale(0.86) rotate(-1deg);
		}
		86% {
			opacity: 0;
			transform: translate3d(5.5rem, -0.18rem, 0) scale(0.78) rotate(1deg);
		}
	}

	@keyframes photo-companion-arrive {
		from {
			opacity: 0;
			transform: translate3d(0, 0, 0) scale(1);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0) scale(1);
		}
	}

	@keyframes photo-companion-breathe {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		46% {
			transform: translate3d(0.4px, -0.7px, 0) scale(1.004);
		}
		62% {
			transform: translate3d(0, -0.3px, 0) scale(1.002);
		}
	}

	@keyframes garden-photo-breathe {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
			filter: saturate(1) brightness(1);
		}
		36% {
			transform: translate3d(0.8px, -2.2px, 0) scale(1.012);
			filter: saturate(1.025) brightness(1.018);
		}
		62% {
			transform: translate3d(0.3px, -2.8px, 0) scale(1.015);
			filter: saturate(1.03) brightness(1.022);
		}
	}

	@keyframes garden-sanctuary-light {
		0%,
		100% {
			opacity: 0.68;
			transform: translate3d(-18px, 7px, 0);
		}
		50% {
			opacity: 0.94;
			transform: translate3d(20px, -8px, 0);
		}
	}

	@keyframes garden-quiet-water-light {
		0%,
		100% {
			opacity: 0.46;
			background-position: -24% 2%, 112% 1%, -36% 0;
		}
		50% {
			opacity: 0.66;
			background-position: 34% 4%, 54% 3%, 42% 0;
		}
	}

	@keyframes tree-presence {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: var(--resting-tree-opacity, 0.72);
			transform: translateY(0);
		}
	}

	@keyframes tree-leaves-idle {
		0%,
		100% {
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		52% {
			transform: translate3d(0.7px, 0, 0) rotate(0.35deg);
		}
	}

	@keyframes companion-presence {
		from {
			opacity: 0;
			transform: translate(var(--companion-x, 0px), calc(var(--companion-y, 0px) + 8px))
				scale(var(--companion-scale, 1)) rotate(var(--companion-tilt, 0deg));
		}
		to {
			opacity: 1;
			transform: translate(var(--companion-x, 0px), var(--companion-y, 0px))
				scale(var(--companion-scale, 1)) rotate(var(--companion-tilt, 0deg));
		}
	}

	@keyframes companion-accent-drift {
		0%,
		100% {
			transform: translate3d(0, 0, 0);
			opacity: 0.32;
		}
		48% {
			transform: translate3d(0, -4px, 0);
			opacity: 0.62;
		}
	}

	@keyframes fox-listen {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		46% {
			transform: translateY(-0.5px) rotate(-1.8deg);
		}
		62% {
			transform: translateY(0) rotate(0.8deg);
		}
	}

	@keyframes owl-look {
		0%,
		100% {
			transform: translateX(0) rotate(0deg);
		}
		34% {
			transform: translateX(-1.5px) rotate(-1.2deg);
		}
		68% {
			transform: translateX(1.5px) rotate(1.2deg);
		}
	}

	@keyframes rabbit-listen {
		0%,
		100% {
			transform: translateY(0);
		}
		55% {
			transform: translateY(-1px);
		}
	}

	@keyframes squirrel-attend {
		0%,
		100% {
			transform: rotate(0deg);
		}
		42% {
			transform: rotate(1.4deg);
		}
		66% {
			transform: rotate(-0.8deg);
		}
	}

	@keyframes turtle-peek {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(2px);
		}
	}

	@keyframes dino-nod {
		0%,
		100% {
			transform: rotate(0deg);
		}
		52% {
			transform: rotate(-1deg);
		}
	}

	@keyframes companion-breathe {
		0%,
		100% {
			transform: translateY(0) rotate(var(--companion-breath-tilt, 0deg)) scale(1);
		}
		50% {
			transform: translateY(1px) rotate(var(--companion-breath-tilt, 0deg)) scale(1.012);
		}
	}

	@keyframes companion-blink {
		0%,
		92%,
		100% {
			transform: scaleY(1);
		}
		95% {
			transform: scaleY(0.08);
		}
	}

	@keyframes ear-listen {
		0%,
		100% {
			transform: rotate(0deg);
		}
		47% {
			transform: rotate(-2deg);
		}
		58% {
			transform: rotate(1deg);
		}
	}

	@keyframes rabbit-ear-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}
		54% {
			transform: rotate(-2.5deg);
		}
		64% {
			transform: rotate(1.2deg);
		}
	}

	@keyframes tail-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-2deg);
		}
	}

	@keyframes bubble-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}

	:global(.dark) .garden-card {
		--garden-sky-top: color-mix(in srgb, hsl(var(--surface)) 84%, #16212a 16%);
		--garden-sky-mid: color-mix(in srgb, hsl(var(--surface-soft)) 82%, #13202a 18%);
		--garden-sky-bottom: color-mix(in srgb, hsl(var(--surface-soft)) 88%, #101a22 12%);
		--garden-ground-top: color-mix(in srgb, var(--theme-accent, #436e8f) 24%, #2d4038 76%);
		--garden-ground-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 38%, #21312d 62%);
		--garden-front-top: color-mix(in srgb, var(--theme-accent, #436e8f) 34%, #22322d 66%);
		--garden-front-bottom: color-mix(in srgb, var(--theme-accent, #436e8f) 44%, #17251f 56%);
		--garden-light: rgba(180, 200, 170, 0.14);
		--garden-mist: rgba(224, 232, 235, 0.08);
		--garden-leaf: color-mix(in srgb, var(--theme-accent, #436e8f) 38%, #68825f 62%);
		--garden-leaf-dark: color-mix(in srgb, var(--theme-accent, #436e8f) 52%, #425b45 48%);
		--garden-flower: #b8899d;
		--garden-flower-center: #d1b187;
		--garden-firefly: rgba(222, 231, 206, 0.46);
		background: hsl(var(--surface));
		box-shadow:
			0 2px 10px rgba(0, 0, 0, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	:global(.dark) .garden-scene {
		background: color-mix(in srgb, hsl(var(--surface-soft)) 90%, #0f1720 10%);
	}

	:global(.dark) .scene-invitation,
	:global(.dark) .companion-bubble {
		background: color-mix(in srgb, hsl(var(--surface)) 90%, #23323b 10%);
		box-shadow: 0 12px 28px rgba(4, 9, 12, 0.28);
	}

	@media (max-width: 640px) {
		.garden-card {
			padding: 1.35rem;
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
			min-height: 218px;
		}

		.companion-bubble {
			top: 0.75rem;
			right: 0.75rem;
			max-width: min(12rem, calc(100% - 1.5rem));
			font-size: 0.84rem;
		}

		.companion-panel {
			padding: 0.9rem;
		}

		.animal-chooser,
		.care-signals {
			grid-template-columns: 1fr;
		}

		.companion-care,
		.garden-meta {
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
		.garden-sprouts g,
		.garden-photo,
		.garden-photo::before,
		.garden-photo::after,
		.garden-leaves path,
		.garden-flowers g,
		.fireflies circle,
		.photo-resting-companion,
		.photo-resting-image,
		.resting-tree,
		.resting-tree-leaves,
		.companion-aura circle,
		.companion-figure,
		.companion-breath,
		.companion-head,
		.eye,
		.ear,
		.rabbit-ear,
		.companion-tail,
		.companion-bubble,
		.garden-butterfly {
			animation: none;
		}

		.garden-butterfly {
			display: none;
		}

		.resting-tree {
			opacity: var(--resting-tree-opacity, 0.72);
		}

		.photo-resting-companion {
			opacity: 1;
			transform: none;
		}

		.photo-resting-image {
			transform: none;
		}

		.animal-chooser button,
		.companion-actions button {
			transition: none;
		}
	}
</style>
