import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeDirectory = join(process.cwd(), 'src/routes/dashboard/kvallsstugan');
const route = readFileSync(join(routeDirectory, '+page.svelte'), 'utf8');
const panel = readFileSync(
	join(process.cwd(), 'src/lib/components/evening/SleepModePanel.svelte'),
	'utf8'
);
const playback = readFileSync(
	join(process.cwd(), 'src/lib/evening-sleep-playback.ts'),
	'utf8'
);

describe('Sovläget i Kvällsstugan', () => {
	it('håller tillståndet lokalt: ingen persistens, ingen DB, ingen endpoint', () => {
		expect(route).toContain("let sleepStage = $state<SleepStage>('closed')");
		// Steg, timer och uppspelning sparas aldrig. Enda undantaget är
		// användarens upprepningsval för musiken, som ligger i
		// evening-music-sources och aldrig rör panelens tillstånd.
		const sleepCode = route + panel;
		expect(sleepCode).not.toMatch(/localStorage|sessionStorage/);
		expect(panel).not.toMatch(/fetch\(|supabase/);
	});

	it('håller den underkända bädden borta men gör Sovläge synligt och nåbart', () => {
		expect(route).toContain('const FLOOR_BED_ASSET: string | null = null');
		expect(route).toContain('{#if FLOOR_BED_ASSET}');
		// Den underkända asseten får inte refereras från produktionskoden.
		expect(route).not.toContain('floor-bed.webp');
		expect(route).not.toContain('floor-bed-master.png');
		expect(route).toContain("{#if sleepStage === 'closed'}");
		expect(route).toContain('aria-label="Öppna Sovläge"');
		expect(route).toContain('<span class="scene-object-label" aria-hidden="true">Sovläge</span>');
	});

	it('lägger bäddens hotspot mellan följeslagaren och boken', () => {
		expect(route).toMatch(
			/\.scene-object-bed\s*\{[\s\S]*?left: 38%;[\s\S]*?top: 72%;[\s\S]*?width: 19%;[\s\S]*?height: 22%;/
		);
		expect(route).toContain('aria-label="Öppna Sovläge"');
		// Följeslagaren står på x 10-36 % och bokens yta börjar på x 59 %.
		expect(route).toContain('.scene-object-book { left: 59%; top: 58.5%; width: 8%; height: 9.5%; }');
		// Delar den tysta ytans träffytegolv på 44 px med dörrarna och boken.
		expect(route).toContain('min-width: 44px;');
		expect(route).toContain('min-height: 44px;');
	});

	it('behöver ingen separat utvecklingsgenväg i Kvällsstugan', () => {
		expect(route).not.toContain("import { dev } from '$app/environment'");
		expect(route).not.toContain('sleep-dev-trigger');
		expect(route).not.toContain('Öppna Sovläge (dev)');
	});

	it('lugnar scenen när Sovläge är aktivt', () => {
		expect(route).toContain("const isSleepMode = $derived(sleepStage === 'active')");
		expect(route).toContain("data-sleep={isSleepMode ? 'on' : 'off'}");
		expect(route).toContain('eventsBlocked={isSleepMode}');
		// Vattenringarna tas bort ur DOM, inte bara döljs.
		expect(route).toContain('{#if !isSleepMode}');
		expect(route).toContain(".evening-scene[data-sleep='on'] .evening-scene-image");
		expect(route).toContain('.evening-flow-column.is-dimmed { opacity: 0.42; }');
	});

	it('lyfter fram sovplatsen i stället för att bara dämpa hela rummet', () => {
		// Ett enda lager över scenen släcker rummet men sparar hörnet där
		// personen redan ligger i scenbilden.
		expect(route).toContain('<div class="sleep-focus" aria-hidden="true"></div>');
		expect(route).toContain(
			".evening-scene[data-sleep='on'][data-view='interior'] .sleep-focus { opacity: 1; }"
		);
		expect(route).toMatch(/\.sleep-focus\s*\{[\s\S]*?pointer-events: none;/);
		// Sovplatsen blir ljusare än förut, inte mörkare.
		expect(route).toContain('filter: brightness(0.78) saturate(0.88);');
		// Ute på verandan finns ingen sovplats att lysa upp.
		expect(route).not.toContain(".evening-scene[data-sleep='on'] .sleep-focus { opacity: 1; }");
	});

	it('beskriver Sovläget för skärmläsare, inte bara visuellt', () => {
		expect(route).toContain('Sovläge i Kvällsstugan: rummet är nedsläckt');
		// sceneLabel läser isSleepMode, som därför måste deklareras före den.
		expect(route.indexOf('const isSleepMode')).toBeLessThan(route.indexOf('const sceneLabel'));
	});

	it('låter följeslagaren lägga sig först i aktivt Sovläge', () => {
		expect(route).toContain('posePreference={sleepPosePreference}');
		expect(route).toContain("isSleepMode ? 'resting' : 'calm'");
	});

	it('håller högerspalten nåbar med tangentbord även när den är nedtonad', () => {
		expect(route).toContain('.evening-flow-column.is-dimmed:focus-within { opacity: 1; }');
		expect(route).not.toContain('pointer-events: none;\n\t}\n\t.evening-flow-column');
	});
});

describe('Sovlägets panel', () => {
	it('ligger i normalt flöde under scenen, inte som overlay i 16:9-rutan', () => {
		expect(route).toContain('<SleepModePanel bind:stage={sleepStage} />');
		// Panelen ligger i scenkolumnen men utanför <section class="evening-scene">.
		const sceneEnd = route.indexOf('</section>', route.indexOf('class="evening-scene"'));
		expect(route.indexOf('<SleepModePanel')).toBeGreaterThan(sceneEnd);
		expect(panel).not.toContain('position: absolute');
	});

	it('startar aldrig ljud utan ett uttryckligt val', () => {
		// Uppspelningen skapas först i startSleep, som bara nås via längdvalet.
		expect(panel).toContain('async function startSleep(lengthId: SleepLengthId)');
		expect(panel).toContain('onclick={() => startSleep(option.id)}');
		expect(panel).not.toMatch(/autoplay|onMount\(\s*\(\)\s*=>\s*playback/);
	});

	it('använder tystnad som ett riktigt val och rör då aldrig talmotorn', () => {
		// Vakten frågar uttryckligen efter tystnad. Formen "allt utom
		// meditation" hade tyst skickat musikvalet hit och spelat ingenting.
		expect(panel).toContain("if (source === 'silence')");
		expect(panel).not.toContain("if (source !== 'meditation')");
		expect(panel).toContain('playback = createSilentPlayback();');
	});

	it('spelar musik som ljudfil, aldrig via talsyntes, och loopar bara efter eget val', () => {
		expect(panel).toContain("if (source === 'music')");
		expect(panel).toContain('createAudioFilePlayback(EVENING_MUSIC_TRACK.audioSrc, {');

		const musicBranch = panel.slice(
			panel.indexOf("if (source === 'music')"),
			panel.indexOf('if (meditation?.audioSrc)')
		);
		expect(musicBranch).toContain('return;');
		expect(musicBranch).not.toContain('createBrowserSpeechEngine');
		expect(musicBranch).not.toContain('createTtsPlayback');
		// Upprepning är av som standard och styrs bara av användarens val.
		// Panelen sätter aldrig elementets loop själv – det gör adaptern.
		expect(panel).toContain('let musicLoop = $state(false);');
		expect(musicBranch).toContain('loop: musicLoop,');
		expect(panel).not.toMatch(/\.loop\s*=|loop=\{?true|loop:\s*true/);
	});

	it('låter användaren slå på och av upprepning av musiken och sparar valet lokalt', () => {
		expect(panel).toContain('aria-pressed={musicLoop}');
		expect(panel).toContain("Upprepa låten: {musicLoop ? 'på' : 'av'}");
		expect(panel).toContain('playback?.setLoop?.(musicLoop);');
		expect(panel).toContain('writeEveningMusicLoop(musicLoop);');
		// Knappen visas bara för musik, aldrig för meditation eller tystnad.
		expect(panel.match(/\{#if source === 'music'\}\s*\{@render musicLoopToggle\(\)\}/g)).toHaveLength(2);
	});

	it('startar aldrig musiken när upprepningsvalet läses in', () => {
		const loadEffect = panel.slice(
			panel.indexOf('musicLoop = readEveningMusicLoop();'),
			panel.indexOf('function toggleMusicLoop')
		);
		expect(loadEffect).not.toMatch(/start\(|resume\(|play\(/);
		const toggle = panel.slice(
			panel.indexOf('function toggleMusicLoop'),
			panel.indexOf('function toggleMusicLoop') + 400
		);
		expect(toggle).not.toMatch(/\.start\(|\.resume\(|\.play\(/);
	});

	it('spelar inspelade meditationer som ljudfil och aldrig via talsyntes', () => {
		// Ljudgrenen ligger före TTS-grenen och returnerar direkt, så
		// createBrowserSpeechEngine aldrig hinner anropas för ett inspelat spår.
		expect(panel).toContain('if (meditation?.audioSrc) {');
		expect(panel).toContain('playback = createAudioFilePlayback(meditation.audioSrc, {');

		const audioBranch = panel.slice(
			panel.indexOf('if (meditation?.audioSrc) {'),
			panel.indexOf('const script =')
		);
		expect(audioBranch).toContain('return;');
		expect(audioBranch).not.toContain('createBrowserSpeechEngine');
		expect(audioBranch).not.toContain('createTtsPlayback');
	});

	it('låter all Sovläge-guidning använda den centrala guidade röstprofilen', () => {
		expect(panel).toContain('getEveningMeditationScript(meditation)');
		expect(panel).toContain('createBrowserSpeechEngine()');
		expect(panel).toContain('createTtsPlayback(script, engine');
		expect(playback).toContain('selectGuidedVoiceForLang(synth.getVoices(), SWEDISH_LOCALE)');
	});

	it('flyttar fokus till varje steg och håller status artig', () => {
		expect(panel).toContain('void tick().then(() => heading?.focus())');
		expect(panel).toContain('bind:this={heading} tabindex="-1"');
		expect(panel).toContain('role="status" aria-live="polite"');
	});

	it('räknar mot tidsstämplar och avslutar tyst', () => {
		expect(panel).toContain('createSleepTimer(Date.now(), length.minutes)');
		expect(panel).toContain('if (timer && isSleepFinished(timer, now)) endSleep();');
		// Ingen ljudsignal och ingen bekräftelseruta när tiden går ut. Panelen
		// skapar ett Audio-element, men bara för att läsa speltiden ur filen -
		// det spelar aldrig upp något och ligger utanför avslutsvägen.
		expect(panel).not.toMatch(/klart!|Klart!/);
		const endSleep = panel.slice(panel.indexOf('function endSleep()'));
		expect(endSleep.slice(0, 300)).not.toMatch(/new Audio|\.play\(/);
		expect(panel).toContain("probe.preload = 'metadata';");
	});

	it('ger musik och meditation paus och play men tystnad bara byt val och avsluta', () => {
		// Tystnad har ingenting att pausa; musik och meditation har båda det.
		expect(panel).toContain("const canPause = $derived(source !== null && source !== 'silence')");
		expect(panel).toContain('{#if canPause}');
		expect(panel).toContain('onclick={togglePlayback}');
		expect(panel).toContain('onclick={changeChoice}');
		expect(panel).toContain('onclick={endSleep}');
	});

	it('benämner pausknappen efter vad som faktiskt spelas', () => {
		expect(panel).toContain("{isPaused ? 'Fortsätt musiken' : 'Pausa musiken'}");
		expect(panel).toContain("{isPaused ? 'Fortsätt uppläsningen' : 'Pausa uppläsningen'}");
	});

	it('pausar stundens klocka tillsammans med uppläsningen', () => {
		expect(panel).toContain('timer = pauseSleepTimer(timer, Date.now());');
		expect(panel).toContain('timer = resumeSleepTimer(timer, Date.now());');
	});

	it('stoppar uppspelningen när komponenten rivs', () => {
		expect(panel).toContain('onDestroy(stopPlayback)');
	});

	it('flyttar fokus även när steget sätts utifrån, inte bara vid egna övergångar', () => {
		// Routen öppnar Sovläge genom att skriva till den bundna `stage`, och
		// passerar då aldrig goToStage. Fokus ligger därför i en effekt.
		expect(panel).toContain('void tick().then(() => heading?.focus())');
		const effect = panel.slice(panel.indexOf("if (stage === 'closed') return;"));
		expect(effect).toContain('heading?.focus()');
	});
});

describe('QA-harnessen', () => {
	const harness = readFileSync(join(process.cwd(), 'src/routes/dev/sovlage/+page.ts'), 'utf8');

	it('svarar 404 utanför utvecklingsläge', () => {
		expect(harness).toContain("import { dev } from '$app/environment'");
		expect(harness).toContain("if (!dev) throw error(404, 'Not found');");
	});

	it('monterar den riktiga panelen i stället för en kopia', () => {
		const page = readFileSync(join(process.cwd(), 'src/routes/dev/sovlage/+page.svelte'), 'utf8');
		expect(page).toContain("import SleepModePanel from '$lib/components/evening/SleepModePanel.svelte'");
	});
});
