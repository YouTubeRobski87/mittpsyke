import { describe, expect, it } from 'vitest';
import {
	containsAcuteCrisisPhrase,
	containsElevatedDistressPhrase,
	containsElevatedPresencePhrase,
	containsSensitiveContentPhrase,
	containsThirdPartyRiskPhrase,
	normalizeForCrisisMatch
} from './crisis-keywords';

// Frasmatris för den auktoritativa krisspärren.
//
// En träff här kortsluter hela chatten: inget AI-anrop görs och användaren får
// CRISIS_RESPONSE i stället för ett samtal. Därför är både missar och falsklarm
// verkliga fel, men av olika slag:
//
// - En miss betyder att det garanterat säkra svaret uteblir och att vi förlitar
//   oss på modellens omdöme.
// - Ett falsklarm betyder att någon som ville prata möts av en telefonlista.
//
// Matrisen beskriver önskat beteende, inte nuvarande. Fall som faller är
// avsedda att falla tills ordlistan kalibrerats.

describe('normalizeForCrisisMatch', () => {
	it('fäller ihop versaler, diakriter och blanksteg', () => {
		expect(normalizeForCrisisMatch('  Jag Vill INTE   Leva  ')).toBe('jag vill inte leva');
		expect(normalizeForCrisisMatch('självmord')).toBe('sjalvmord');
		expect(normalizeForCrisisMatch('dö\tnu')).toBe('do nu');
	});

	it('påverkar inte tomma indata', () => {
		expect(containsAcuteCrisisPhrase('')).toBe(false);
		expect(containsThirdPartyRiskPhrase('')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Måste fångas: uttryck där ett garanterat säkert svar är viktigare än samtalet.
// ---------------------------------------------------------------------------

const måsteFångas = [
	'Jag vill ta livet av mig',
	'Jag tänker på självmord hela tiden',
	'Jag vill inte leva längre',
	'Jag orkar inte leva',
	'Jag vill bara dö',
	'Jag har skrivit ett avskedsbrev',
	'Jag tänker ta en överdos',
	'Jag vill somna för alltid',
	'Jag har självskadat mig i flera år',
	// Nedan fångas inte i dag. Naturliga formuleringar som ordlistan inte täcker
	// för att den kodar exakta fraser i stället för mönster.
	'Allt känns hopplöst och jag ser ingen väg ut',
	'Jag har skurit mig igen',
	'Jag har tänkt på att göra mig illa',
	'Världen skulle vara bättre utan mig'
];

// Medvetet utelämnat: "Jag vet hur jag skulle göra om jag bestämde mig". Att
// känna till ett tillvägagångssätt är en tung signal i riskbedömning, men
// formuleringen är identisk med en helt ofarlig mening om vad som helst. En
// ordlista kan inte skilja dem åt, och en fras som fångar den skulle bryta
// samtal på löpande band. Det fallet hör till modellen och
// säkerhetsinstruktionerna, inte till den deterministiska spärren.

describe('akut självrisk fångas', () => {
	it.each(måsteFångas)('%s', (text) => {
		expect(containsAcuteCrisisPhrase(text)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Får inte fångas: vardagsspråk som i dag blockerar samtalet.
//
// Flera av dessa rör ämnen som hör hemma på MittPsyke — medicin, studier,
// utmattning, ensamhet. Att möta dem med en telefonlista är inte försiktighet,
// det är att stänga dörren i det ögonblick någon öppnade den.
// ---------------------------------------------------------------------------

const fårInteFångas = [
	// 'hoppa av'
	'Jag funderar på att hoppa av utbildningen',
	'Jag hoppade av kursen förra terminen',
	// 'ta tabletter' / 'ta piller'
	'Läkaren sa att jag ska ta tabletter mot huvudvärken',
	'Jag glömmer alltid att ta piller på morgonen',
	// 'ingen mening'
	'Det är ingen mening att försöka boka tid, de svarar ändå aldrig',
	// 'sista chansen'
	'Det här är sista chansen att söka till utbildningen',
	// 'orkar inte mer' / 'kan inte fortsatta'
	'Jag orkar inte mer med plugget just nu',
	'Jag kan inte fortsätta så här med den här chefen',
	// 'ingen bryr sig om mig'
	'Det känns som att ingen bryr sig om mig på jobbet',
	// 'vill forsvinna'
	'Jag vill försvinna in i en bok en stund',
	// 'vill do' matchade tidigare som substräng inuti längre ord. Den första
	// meningen är ett av de sämsta tänkbara falsklarmen: någon formulerar att
	// de döljer hur de mår, och möts av en telefonlista.
	'Jag vill dölja hur jag mår för mina vänner',
	'Jag vill dokumentera mina känslor i dagboken',
	// 'ge upp allt'
	'Jag är inte redo att ge upp allt jag byggt upp',
	// 'inget hopp'
	'Det finns inget hopp om att tåget kommer i tid'
];

describe('vardagsspråk blockerar inte samtalet', () => {
	it.each(fårInteFångas)('%s', (text) => {
		expect(containsAcuteCrisisPhrase(text)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Gränsfall: falsklarm vi medvetet accepterar.
//
// Här är den ofarliga tolkningen ovanlig i ett samtal om psykisk hälsa, och
// missen vore allvarligare än avbrottet. De ligger kvar som träffar med flit,
// och testet finns för att beslutet ska vara synligt i stället för underförstått.
// ---------------------------------------------------------------------------

const accepteradeFalsklarm = [
	'Vi ska hoppa från klippan i sommar',
	'Jag har lagt en plan för hur jag ska plugga inför tentan'
];

describe('accepterade falsklarm', () => {
	it.each(accepteradeFalsklarm)('%s', (text) => {
		expect(containsAcuteCrisisPhrase(text)).toBe(true);
	});
});

// Öppen fråga, medvetet låst i test i väntan på produktbeslut.
//
// "orkar inte längre" bryter samtalet, "orkar inte mer" gör det inte. Fraserna
// ligger nära varandra i svenskan, och gränsen kommer inte från en språklig
// analys utan från tests/ai-evals/crisis.json, där "Jag vet inte om jag orkar
// längre" är klassat som krisscenario. Testet finns för att skillnaden ska
// synas och kunna omprövas, inte för att den är självklar.

describe('gränsen mellan orkar-fraserna', () => {
	it('"orkar inte längre" bryter samtalet', () => {
		expect(containsAcuteCrisisPhrase('Jag vet inte om jag orkar längre')).toBe(true);
	});

	it('"orkar inte mer" gör det inte', () => {
		expect(containsAcuteCrisisPhrase('Jag orkar inte mer med plugget just nu')).toBe(false);
	});

	it('"orkar inte mer" höjer däremot stödnivån', () => {
		expect(containsElevatedDistressPhrase('Jag orkar inte mer med plugget just nu')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Ordgränser: substrängmatchning träffar inuti längre ord.
// ---------------------------------------------------------------------------

describe('matchningen respekterar ordgränser', () => {
	it('träffar inte inuti sammansatta ord utan risksammanhang', () => {
		expect(containsAcuteCrisisPhrase('Vi pratade om hoppar och trampoliner')).toBe(false);
	});

	it('fångas oavsett skiljetecken runt frasen', () => {
		expect(containsAcuteCrisisPhrase('Jag vill inte leva.')).toBe(true);
		expect(containsAcuteCrisisPhrase('"Jag vill inte leva", tänkte jag')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Tredjepartsrisk. Hålls medvetet kort, se kommentaren i crisis-keywords.ts.
// ---------------------------------------------------------------------------

describe('risk mot någon annan', () => {
	it.each(['Jag är rädd att jag ska skada någon annan', 'Jag vill göra någon illa'])(
		'fångas: %s',
		(text) => {
			expect(containsThirdPartyRiskPhrase(text)).toBe(true);
		}
	);

	it.each(['Jag är rädd att jag ska göra någon besviken', 'Filmen gjorde mig illa berörd'])(
		'fångas inte: %s',
		(text) => {
			expect(containsThirdPartyRiskPhrase(text)).toBe(false);
		}
	);
});

// ---------------------------------------------------------------------------
// Ordlistan används åt två motsatta håll, och det begränsar kalibreringen.
//
// Chatten: träff = blockera AI:t (crisis-guard.ts). Falsklarm skadar.
// Dagbok och Framsteg: träff = dölj citatet (diary-support-suggestions.ts
// isQuoteSafe, progress-lighter-days.ts isSafeToShow). Missar skadar.
//
// Kraven går inte att uppfylla med en enda lista: 'Jag orkar inte mer med
// plugget' ska släppas igenom i chatten medan 'Jag orkar inte mer' ska döljas i
// ett citat. Därför finns SENSITIVE_CONTENT_PHRASES, som är en övermängd av den
// akuta listan och bara används till dämpning.
// ---------------------------------------------------------------------------

describe('dämpningsfiltret behåller bred täckning', () => {
	const måsteDöljas = [
		'Jag orkar inte mer',
		'Det känns som att ingen bryr sig om mig',
		'Jag kan inte fortsätta så här',
		'Jag har gett upp hoppet om att det blir bättre'
	];

	it.each(måsteDöljas)('citat döljs i dagbok och Framsteg: %s', (text) => {
		expect(containsSensitiveContentPhrase(text)).toBe(true);
	});

	it('täcker allt som bryter ett samtal', () => {
		for (const text of [...måsteFångas, ...accepteradeFalsklarm]) {
			expect(containsSensitiveContentPhrase(text)).toBe(true);
		}
	});
});

// ---------------------------------------------------------------------------
// Förhöjd stödnivå: de urlyfta fraserna ska synas i chatten, inte tystas.
// ---------------------------------------------------------------------------

describe('förhöjd tyngd i chatten', () => {
	it.each([
		'Jag orkar inte mer med plugget just nu',
		'Jag kan inte fortsätta så här med den här chefen',
		'Det känns som att ingen bryr sig om mig på jobbet',
		'Jag har gett upp allt',
		'Det finns inget hopp längre',
		'Jag vill försvinna in i en bok en stund'
	])('höjer panelen: %s', (text) => {
		expect(containsElevatedDistressPhrase(text)).toBe(true);
		expect(containsAcuteCrisisPhrase(text)).toBe(false);
	});

	it.each([
		'Jag funderar på att hoppa av utbildningen',
		'Det här är sista chansen att söka till utbildningen',
		'Läkaren sa att jag ska ta tabletter mot huvudvärken',
		'Jag glömmer alltid att ta piller på morgonen'
	])('dämpas men höjer inte panelen: %s', (text) => {
		expect(containsSensitiveContentPhrase(text)).toBe(true);
		expect(containsElevatedDistressPhrase(text)).toBe(false);
		expect(containsAcuteCrisisPhrase(text)).toBe(false);
	});
});

describe('närvarofraser i chatten', () => {
	it.each(['Jag känner mig ensam', 'Allt är för mycket just nu', 'Text räcker inte längre'])(
		'höjer panelen utan att dämpa citat: %s',
		(text) => {
			expect(containsElevatedPresencePhrase(text)).toBe(true);
			expect(containsSensitiveContentPhrase(text)).toBe(false);
		}
	);

	it('träffar inte ensam inuti gemensam', () => {
		expect(containsElevatedPresencePhrase('Vi har en gemensam plan för kvällen')).toBe(false);
	});
});
