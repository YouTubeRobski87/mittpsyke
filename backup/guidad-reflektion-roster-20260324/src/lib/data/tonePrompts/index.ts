import { buildBaseIntro, type ToneId, type TonePromptBuilder } from './types';

import { buildPrompt as classicPrompt } from './classic';
import { buildPrompt as storytellingPrompt } from './storytelling';
import { buildPrompt as philosophicalPrompt } from './philosophical';
import { buildPrompt as sportscasterPrompt } from './sportscaster';
import { buildPrompt as catPerspectivePrompt } from './cat-perspective';
import { buildPrompt as cynicalPrompt } from './cynical';
import { buildPrompt as dramaQueenPrompt } from './drama-queen';
import { buildPrompt as memePrompt } from './meme';
import { buildPrompt as cringePrompt } from './cringe';
import { buildPrompt as britishPrompt } from './british';
import { buildPrompt as questLogPrompt } from './quest-log';
import { buildPrompt as boredPrompt } from './bored';
import { buildPrompt as natureDocumentaryPrompt } from './nature-documentary';
import { buildPrompt as therapistPrompt } from './therapist';
import { buildPrompt as aiRobotPrompt } from './ai-robot';
import { buildPrompt as shakespearePrompt } from './shakespeare';
import { buildPrompt as tabloidPrompt } from './tabloid';
import { buildPrompt as formalPrompt } from './formal';
import { buildPrompt as troubadourPrompt } from './troubadour';
import { buildPrompt as nerdPrompt } from './nerd';
import { buildPrompt as tinfoilHatPrompt } from './tinfoil-hat';
import { buildPrompt as selfHelpPrompt } from './self-help';
import { buildPrompt as detectivePrompt } from './detective';
import { buildPrompt as overthinkerPrompt } from './overthinker';
import { buildPrompt as passiveAggressivePrompt } from './passive-aggressive';
import { buildPrompt as melodramaticPrompt } from './melodramatic';
import { buildPrompt as chaoticPrompt } from './chaotic';
import { buildPrompt as bureaucraticPrompt } from './bureaucratic';

const toneBuilders: Record<ToneId, TonePromptBuilder> = {
	classic: classicPrompt,
	storytelling: storytellingPrompt,
	philosophical: philosophicalPrompt,
	sportscaster: sportscasterPrompt,
	'cat-perspective': catPerspectivePrompt,
	cynical: cynicalPrompt,
	'drama-queen': dramaQueenPrompt,
	meme: memePrompt,
	cringe: cringePrompt,
	british: britishPrompt,
	'quest-log': questLogPrompt,
	bored: boredPrompt,
	'nature-documentary': natureDocumentaryPrompt,
	therapist: therapistPrompt,
	'ai-robot': aiRobotPrompt,
	shakespeare: shakespearePrompt,
	tabloid: tabloidPrompt,
	formal: formalPrompt,
	troubadour: troubadourPrompt,
	nerd: nerdPrompt,
	'tinfoil-hat': tinfoilHatPrompt,
	'self-help': selfHelpPrompt,
	detective: detectivePrompt,
	overthinker: overthinkerPrompt,
	'passive-aggressive': passiveAggressivePrompt,
	melodramatic: melodramaticPrompt,
	chaotic: chaoticPrompt,
	bureaucratic: bureaucraticPrompt
};

export function buildTonePrompt(toneId: string): string {
	const baseIntro = buildBaseIntro();
	const builder = toneBuilders[toneId as ToneId] ?? toneBuilders.classic;
	return builder(baseIntro);
}

export const availableToneIds: ToneId[] = Object.keys(toneBuilders) as ToneId[];

export type { ToneId, TonePromptBuilder } from './types';
