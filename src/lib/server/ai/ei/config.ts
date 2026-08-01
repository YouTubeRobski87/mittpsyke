import { createHash } from 'node:crypto';
import {
	CONTENT_ZONES,
	RESPONSE_TYPES,
	type ContentZone,
	type Principle,
	type ResponseType
} from './contracts';

// Versionerad EI-konfiguration.
//
// Detta är MEDVETET minimalt. docs/ai/emotional-intelligence.md är 1768 rader
// resonemang skrivet för människor — det ska inte klistras in i en systemprompt.
// Konfigurationen här fångar bara det som behövs för att en körning ska kunna
// kopplas till en exakt uppsättning principer och tillåtna val.

export const EI_CONFIG_SCHEMA_VERSION = '1.0.0';

export type EIConfig = {
	schemaVersion: string;
	eiConfigVersion: string;
	principles: Principle[];
	allowedResponseTypes: ResponseType[];
	allowedContentZones: ContentZone[];
	instructions: string[];
};

/**
 * De fem överordnade principerna från docs/conversation-philosophy.md plus de
 * EI-specifika från sektion 2 i docs/ai/emotional-intelligence.md.
 *
 * ID:na är stabila. Ändras en princip materiellt ska den få ett nytt ID (eller
 * en versionerad definition) — aldrig en tyst omskrivning under samma ID, för
 * då pekar historiska DecisionLogs på något annat än det som faktiskt gällde.
 */
const PRINCIPLES: Principle[] = [
	{ id: 'cp-1-no-rush-to-advice', name: 'Skynda inte till råd', source: 'conversation-philosophy' },
	{
		id: 'cp-2-silence-need-not-be-filled',
		name: 'Tystnad behöver inte fyllas',
		source: 'conversation-philosophy'
	},
	{
		id: 'cp-3-readiness-decided-by-person',
		name: 'Beredskap avgörs av personen, aldrig av ett turnummer',
		source: 'conversation-philosophy'
	},
	{
		id: 'cp-4-offers-are-responses',
		name: 'Erbjudanden är svar, inte schema',
		source: 'conversation-philosophy'
	},
	{
		id: 'cp-5-no-self-commentary',
		name: 'AI:n kommenterar aldrig sitt eget arbete',
		source: 'conversation-philosophy'
	},
	{
		id: 'ei-respond-to-what-is-expressed',
		name: 'Svara på det personen faktiskt uttrycker',
		source: 'emotional-intelligence'
	},
	{
		id: 'ei-validate-experience-not-interpretation',
		name: 'Bekräfta upplevelsen utan att automatiskt bekräfta tolkningen',
		source: 'emotional-intelligence'
	},
	{ id: 'ei-epistemic-humility', name: 'Epistemisk ödmjukhet', source: 'emotional-intelligence' },
	{
		id: 'ei-do-not-overdiagnose-emotions',
		name: 'Överdiagnostisera inte känslor',
		source: 'emotional-intelligence'
	},
	{
		id: 'ei-match-intensity-to-situation',
		name: 'Låt intensiteten matcha situationen',
		source: 'emotional-intelligence'
	},
	{
		id: 'ei-caution-with-strong-words',
		name: 'Var försiktig med starka ord',
		source: 'emotional-intelligence'
	},
	{
		id: 'ei-remember-what-was-said',
		name: 'Kom ihåg vad som redan sagts',
		source: 'emotional-intelligence'
	},
	{
		id: 'ei-specific-over-generic-empathy',
		name: 'Var hellre specifik än empatiskt allmän',
		source: 'emotional-intelligence'
	}
];

export const ACTIVE_EI_CONFIG: EIConfig = {
	schemaVersion: EI_CONFIG_SCHEMA_VERSION,
	eiConfigVersion: '2026.08.01-rc1',
	principles: PRINCIPLES,
	allowedResponseTypes: [...RESPONSE_TYPES],
	allowedContentZones: [...CONTENT_ZONES],
	instructions: [
		'Läs vad personen faktiskt uttrycker. Fyll inte i orsaker, motiv eller bakgrund som inte nämnts.',
		'Bekräfta upplevelsen (zon A) utan att automatiskt bekräfta tolkningen (zon C).',
		'Zon C ska varken hållas med om reflexmässigt eller korrigeras reflexmässigt.',
		'Svarets längd bestäms av vad personen behöver höra, inte av vad modellen kan producera.',
		'Ge råd när personen ber om dem eller tydligt söker vägledning — inte innan.',
		'Kommentera aldrig det egna arbetet eller den egna tekniken.',
		'Stark känsla är inte samma sak som kris. Krisbedömningen görs av säkerhetslagret, inte här.'
	]
};

/**
 * Kanonisk serialisering: objektnycklar sorteras rekursivt, arrayordning
 * bevaras (ordningen är innehåll, inte formatering). Utan detta skulle två
 * identiska konfigurationer kunna ge olika hash bara för att fälten råkade
 * skrivas i annan ordning.
 */
function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(canonicalize);
	}

	if (value && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, entryValue]) => entryValue !== undefined)
			.sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));

		return Object.fromEntries(entries.map(([key, entryValue]) => [key, canonicalize(entryValue)]));
	}

	return value;
}

export function serializeEIConfig(config: EIConfig): string {
	return JSON.stringify(canonicalize(config));
}

/** Deterministisk SHA-256 över den kanoniska serialiseringen. */
export function hashEIConfig(config: EIConfig): string {
	return createHash('sha256').update(serializeEIConfig(config), 'utf8').digest('hex');
}

export const ACTIVE_EI_CONFIG_HASH = hashEIConfig(ACTIVE_EI_CONFIG);

export function getPrincipleIds(config: EIConfig = ACTIVE_EI_CONFIG): Set<string> {
	return new Set(config.principles.map((principle) => principle.id));
}
