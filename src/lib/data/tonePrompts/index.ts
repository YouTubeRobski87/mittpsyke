import { buildBaseIntro, type TonePromptBuilder } from './types';

import { buildPrompt as classicPrompt } from './classic';
import { buildPrompt as storytellingPrompt } from './storytelling';
import { buildPrompt as philosophicalPrompt } from './philosophical';
import { buildPrompt as questLogPrompt } from './quest-log';
import { buildPrompt as boredPrompt } from './bored';
import { buildPrompt as therapistPrompt } from './therapist';
import { buildPrompt as selfHelpPrompt } from './self-help';
import { buildPrompt as overthinkerPrompt } from './overthinker';

const activeToneIds = [
	'classic',
	'storytelling',
	'philosophical',
	'quest-log',
	'bored',
	'therapist',
	'self-help',
	'overthinker'
] as const;

export type ToneId = (typeof activeToneIds)[number];

const toneBuilders: Record<ToneId, TonePromptBuilder> = {
	classic: classicPrompt,
	storytelling: storytellingPrompt,
	philosophical: philosophicalPrompt,
	'quest-log': questLogPrompt,
	bored: boredPrompt,
	therapist: therapistPrompt,
	'self-help': selfHelpPrompt,
	overthinker: overthinkerPrompt
};

export function buildTonePrompt(toneId: string): string {
	const baseIntro = buildBaseIntro();
	const builder = toneBuilders[toneId as ToneId] ?? toneBuilders.therapist;
	return builder(baseIntro);
}

export const availableToneIds: ToneId[] = [...activeToneIds];

export type { TonePromptBuilder } from './types';
