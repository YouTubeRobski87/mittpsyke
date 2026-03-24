import { buildBaseIntro, type TonePromptBuilder } from './types';

import { buildPrompt as philosophicalPrompt } from './philosophical';
import { buildPrompt as therapistPrompt } from './therapist';
import { buildPrompt as selfHelpPrompt } from './self-help';
import { buildPrompt as overthinkerPrompt } from './overthinker';

const activeToneIds = ['therapist', 'self-help', 'overthinker', 'philosophical'] as const;

export type ToneId = (typeof activeToneIds)[number];

const toneBuilders: Record<ToneId, TonePromptBuilder> = {
	therapist: therapistPrompt,
	'self-help': selfHelpPrompt,
	overthinker: overthinkerPrompt,
	philosophical: philosophicalPrompt
};

export function buildTonePrompt(toneId: string): string {
	const baseIntro = buildBaseIntro();
	const builder = toneBuilders[toneId as ToneId] ?? toneBuilders.therapist;
	return builder(baseIntro);
}

export const availableToneIds: ToneId[] = [...activeToneIds];

export type { TonePromptBuilder } from './types';
