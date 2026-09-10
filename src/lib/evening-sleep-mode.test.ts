import { describe, expect, it } from 'vitest';
import {
	SLEEP_LENGTHS,
	SLEEP_SOURCES,
	createSleepTimer,
	formatSleepRemaining,
	getSleepActiveStatus,
	getSleepElapsedMs,
	getSleepLength,
	getSleepRemainingMs,
	getSleepSource,
	getSleepStageAfterSource,
	getSleepStageBefore,
	getSleepStageHeading,
	getSleepStatusLine,
	isSleepChoiceStage,
	isSleepFinished,
	pauseSleepTimer,
	resumeSleepTimer
} from './evening-sleep-mode';

const START = 1_700_000_000_000;

describe('Sovlägets val', () => {
	it('erbjuder musik, meditation och tystnad', () => {
		expect(SLEEP_SOURCES.map((source) => source.id)).toEqual([
			'music',
			'meditation',
			'silence'
		]);
	});

	it('visar inte naturljud förrän det finns något att spela', () => {
		// Ett gråat val hade blivit en vägg i stället för ett val.
		expect(SLEEP_SOURCES.map((source) => source.id)).not.toContain('nature');
	});

	it('låter musik välja spår i ett eget steg innan längden', () => {
		expect(getSleepStageAfterSource('music')).toBe('music');
		expect(getSleepStageBefore('length', 'music')).toBe('music');
		expect(getSleepStageBefore('music', 'music')).toBe('source');
		expect(isSleepChoiceStage('music')).toBe(true);
		expect(getSleepStageHeading('music', 'music')).toBe('Vilken musik vill du lyssna på?');
	});

	it('namnger spåret i statusraden för både musik och meditation', () => {
		expect(getSleepActiveStatus('music', 'Stilla sjö')).toBe('Stilla sjö spelas');
		expect(getSleepActiveStatus('meditation', 'Guidad avslappning')).toBe(
			'Guidad avslappning spelas'
		);
	});

	it('erbjuder de fyra längderna, där den öppna saknar sluttid', () => {
		expect(SLEEP_LENGTHS.map((length) => length.id)).toEqual(['10', '20', '30', 'open']);
		expect(SLEEP_LENGTHS.filter((length) => length.minutes === null)).toHaveLength(1);
		expect(getSleepLength('open')?.minutes).toBeNull();
		expect(getSleepLength('20')?.minutes).toBe(20);
	});

	it('returnerar null för okända val i stället för att gissa', () => {
		expect(getSleepSource(null)).toBeNull();
		expect(getSleepLength(null)).toBeNull();
	});
});

describe('Sovlägets stegövergångar', () => {
	it('ger meditation ett eget mellansteg men skickar tystnad direkt till längden', () => {
		expect(getSleepStageAfterSource('meditation')).toBe('meditation');
		expect(getSleepStageAfterSource('silence')).toBe('length');
	});

	it('speglar vägen bakåt så Tillbaka alltid landar på föregående steg', () => {
		expect(getSleepStageBefore('length', 'meditation')).toBe('meditation');
		expect(getSleepStageBefore('length', 'silence')).toBe('source');
		expect(getSleepStageBefore('meditation', 'meditation')).toBe('source');
		expect(getSleepStageBefore('source', null)).toBe('closed');
	});

	it('skiljer valstegen från det aktiva läget', () => {
		expect(isSleepChoiceStage('source')).toBe(true);
		expect(isSleepChoiceStage('meditation')).toBe(true);
		expect(isSleepChoiceStage('length')).toBe(true);
		expect(isSleepChoiceStage('active')).toBe(false);
		expect(isSleepChoiceStage('closed')).toBe(false);
	});
});

describe('Sovlägets timer', () => {
	it('räknar mot tidsstämplar, inte mot antal anrop', () => {
		const timer = createSleepTimer(START, 20);

		expect(getSleepElapsedMs(timer, START)).toBe(0);
		// Ett hopp framåt i tiden - som när en strypt bakgrundsflik vaknar -
		// ska ge exakt den passerade tiden, inte en ackumulerad tickräkning.
		expect(getSleepElapsedMs(timer, START + 8 * 60_000)).toBe(8 * 60_000);
		expect(getSleepRemainingMs(timer, START + 8 * 60_000)).toBe(12 * 60_000);
	});

	it('avslutar när den valda längden passerats', () => {
		const timer = createSleepTimer(START, 10);

		expect(isSleepFinished(timer, START + 9 * 60_000)).toBe(false);
		expect(isSleepFinished(timer, START + 10 * 60_000)).toBe(true);
		expect(isSleepFinished(timer, START + 40 * 60_000)).toBe(true);
	});

	it('låter den öppna längden aldrig ta slut av sig själv', () => {
		const timer = createSleepTimer(START, null);

		expect(getSleepRemainingMs(timer, START + 5 * 60 * 60_000)).toBeNull();
		expect(isSleepFinished(timer, START + 5 * 60 * 60_000)).toBe(false);
	});

	it('fryser tiden under paus och återupptar utan att hoppa', () => {
		const timer = createSleepTimer(START, 20);
		const paused = pauseSleepTimer(timer, START + 5 * 60_000);

		// Tiden står still oavsett hur länge pausen varar.
		expect(getSleepElapsedMs(paused, START + 5 * 60_000)).toBe(5 * 60_000);
		expect(getSleepElapsedMs(paused, START + 30 * 60_000)).toBe(5 * 60_000);
		expect(isSleepFinished(paused, START + 60 * 60_000)).toBe(false);

		const resumed = resumeSleepTimer(paused, START + 30 * 60_000);
		// Efter en 25 minuters paus har fortfarande bara 5 minuter av stunden gått.
		expect(getSleepElapsedMs(resumed, START + 30 * 60_000)).toBe(5 * 60_000);
		expect(getSleepElapsedMs(resumed, START + 32 * 60_000)).toBe(7 * 60_000);
	});

	it('ignorerar dubbel paus och dubbel återupptagning', () => {
		const timer = createSleepTimer(START, 20);
		const paused = pauseSleepTimer(timer, START + 60_000);

		expect(pauseSleepTimer(paused, START + 120_000)).toBe(paused);
		const resumed = resumeSleepTimer(paused, START + 120_000);
		expect(resumeSleepTimer(resumed, START + 180_000)).toBe(resumed);
	});

	it('går aldrig under noll', () => {
		const timer = createSleepTimer(START, 10);
		expect(getSleepElapsedMs(timer, START - 60_000)).toBe(0);
		expect(getSleepRemainingMs(timer, START + 99 * 60_000)).toBe(0);
	});
});

describe('Sovlägets copy', () => {
	it('avrundar återstående tid uppåt och räknar aldrig ned sekunder', () => {
		expect(formatSleepRemaining(null)).toBeNull();
		expect(formatSleepRemaining(12 * 60_000)).toBe('12 minuter kvar');
		expect(formatSleepRemaining(61_000)).toBe('2 minuter kvar');
		expect(formatSleepRemaining(30_000)).toBe('1 minut kvar');
		expect(formatSleepRemaining(0)).toBe('Snart klart');
	});

	it('beskriver läget utan att lova sömn eller effekt', () => {
		const texts = [
			getSleepStageHeading('source', null),
			getSleepStageHeading('meditation', 'meditation'),
			getSleepStageHeading('length', 'silence'),
			getSleepStageHeading('active', 'meditation'),
			getSleepActiveStatus('silence', null),
			getSleepActiveStatus('meditation', 'Body scan meditation')
		];

		for (const text of texts) {
			expect(text.length).toBeGreaterThan(0);
			expect(text.toLowerCase()).not.toMatch(/somna|sover|sömn|garanter|botar|hjälper dig att sova/);
		}
	});

	it('speglar valet i statusraden', () => {
		expect(getSleepActiveStatus('silence', null)).toBe('Det är tyst nu');
		expect(getSleepActiveStatus('meditation', 'Body scan meditation')).toBe(
			'Body scan meditation spelas'
		);
	});
});

describe('statusraden följer uppspelningens läge', () => {
	it('säger "spelas" med återstående tid medan låten spelar', () => {
		expect(
			getSleepStatusLine(
				getSleepActiveStatus('music', 'Stilla sjö', 'playing'),
				formatSleepRemaining(10 * 60_000)
			)
		).toBe('Stilla sjö spelas · 10 minuter kvar');
	});

	it('säger "är pausad" med återstående tid när låten är pausad', () => {
		expect(
			getSleepStatusLine(
				getSleepActiveStatus('music', 'Trygg natt', 'paused'),
				formatSleepRemaining(7 * 60_000)
			)
		).toBe('Trygg natt är pausad · 7 minuter kvar');
	});

	it('kallar aldrig en pausad låt för "spelas" – regression', () => {
		// Tidigare stod "Trygg natt spelas." kvar medan knappen sa "Fortsätt musiken".
		const paused = getSleepActiveStatus('music', 'Trygg natt', 'paused');
		expect(paused).not.toContain('spelas');
	});

	it('växlar tillbaka till "spelas" när låten fortsätter', () => {
		const statuses: Array<'playing' | 'paused'> = ['playing', 'paused', 'playing'];
		expect(
			statuses.map((status) =>
				getSleepStatusLine(getSleepActiveStatus('music', 'Mjuka andetag', status), '5 minuter kvar')
			)
		).toEqual([
			'Mjuka andetag spelas · 5 minuter kvar',
			'Mjuka andetag är pausad · 5 minuter kvar',
			'Mjuka andetag spelas · 5 minuter kvar'
		]);
	});

	it('gäller även pausad meditation', () => {
		expect(getSleepActiveStatus('meditation', 'Andrum', 'paused')).toBe('Andrum är pausad');
	});

	it('beskriver en låt som tagit slut eller inte gick att spela', () => {
		expect(getSleepActiveStatus('music', 'Stilla sjö', 'ended')).toBe('Stilla sjö har spelat klart');
		expect(getSleepActiveStatus('music', 'Stilla sjö', 'unavailable')).toBe(
			'Stilla sjö kan inte spelas just nu'
		);
	});

	it('visar bara läget när stunden saknar sluttid', () => {
		expect(getSleepStatusLine(getSleepActiveStatus('music', 'Stilla sjö', 'paused'), null)).toBe(
			'Stilla sjö är pausad'
		);
	});

	it('ignorerar uppspelningsläget för tystnad', () => {
		expect(getSleepActiveStatus('silence', null, 'paused')).toBe('Det är tyst nu');
	});
});
