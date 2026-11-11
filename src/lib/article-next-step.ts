// Nästa steg i bloggartiklarna, anpassat efter ämnet.
//
// Tidigare fick alla artiklar samma generiska nästa steg-ruta längst ner, och
// den som läste en lång artikel på mobil såg ingen väg vidare förrän efter
// 15–20 skärmar. Här väljs ämnesrätt ton och övning för rutan längst ner, och
// en kort, lugn rad som visas en bit in i texten.

import type { ArticleTopic } from '$lib/article-topic';

export type EarlyNextStep = {
	text: string;
	href: string;
	label: string;
};

export type ArticleNextStep = {
	// Nyckel till tonen i GuideActionCta. Utan nyckel används den generella.
	pillarSlug?: string;
	exerciseHref: string;
	exerciseLabel: string;
	early: EarlyNextStep;
};

const DIARY_NEW = '/dagbok?action=new';

const NEXT_STEP_BY_TOPIC: Record<ArticleTopic, ArticleNextStep> = {
	sorg: {
		exerciseHref: '/ovningar/icke-valdsam-kommunikation',
		exerciseLabel: 'Prova: Icke-våldsam kommunikation',
		early: {
			text: 'Är det du själv som bär på en förlust? Ibland hjälper det att skriva ner det som är svårt att säga högt.',
			href: DIARY_NEW,
			label: 'Skriv några rader'
		}
	},
	relation: {
		exerciseHref: '/ovningar/icke-valdsam-kommunikation',
		exerciseLabel: 'Prova: Icke-våldsam kommunikation',
		early: {
			text: 'Svårt att hitta orden? Du kan pröva vad du vill säga i chatten först, utan konto.',
			href: '/chat',
			label: 'Öppna chatten'
		}
	},
	samhalle: {
		exerciseHref: '/ovningar/4-7-8-andning',
		exerciseLabel: 'Prova: 4-7-8 andning',
		early: {
			text: 'Ska du ringa eller skriva till en myndighet? Du kan förbereda vad du vill säga i chatten, utan konto.',
			href: '/chat',
			label: 'Förbered i chatten'
		}
	},
	beroende: {
		exerciseHref: '/ovningar/vardekartlaggning',
		exerciseLabel: 'Prova: Värdekartläggning',
		early: {
			text: 'Vill du sortera dina tankar om det här? Du kan skriva i din egen takt, kort eller långt.',
			href: DIARY_NEW,
			label: 'Skriv några rader'
		}
	},
	man: {
		pillarSlug: 'ensamhet',
		exerciseHref: '/ovningar/sjalvmedkansla-ovning',
		exerciseLabel: 'Prova: Självmedkänsla',
		early: {
			text: 'Bär du på något du inte pratat med någon om? Du kan börja med att skriva det, utan konto.',
			href: '/chat',
			label: 'Öppna chatten'
		}
	},
	ensamhet: {
		pillarSlug: 'ensamhet',
		exerciseHref: '/ovningar/sjalvmedkansla-ovning',
		exerciseLabel: 'Prova: Självmedkänsla',
		early: {
			text: 'Känner du igen dig? Du kan sätta ord på hur det känns i chatten, utan konto.',
			href: '/chat',
			label: 'Öppna chatten'
		}
	},
	dagbok: {
		exerciseHref: '/ovningar/daglig-reflektionsmall',
		exerciseLabel: 'Prova: Daglig reflektionsmall',
		early: {
			text: 'Vill du prova medan du läser? Det räcker att börja med en mening.',
			href: DIARY_NEW,
			label: 'Börja skriva'
		}
	},
	tankar: {
		pillarSlug: 'overtankande',
		exerciseHref: '/ovningar/tankefallor-kartlaggning',
		exerciseLabel: 'Prova: Tankefällor',
		early: {
			text: 'Snurrar tankarna redan nu? Skriv ner dem och ta dem ur huvudet en stund.',
			href: DIARY_NEW,
			label: 'Skriv av dig'
		}
	},
	stress: {
		pillarSlug: 'stress',
		exerciseHref: '/ovningar/body-scan',
		exerciseLabel: 'Prova: Body scan',
		early: {
			text: 'Känns det mycket just nu? Ta två minuter och låt andningen sakta ner.',
			href: '/ovningar/4-7-8-andning',
			label: 'Prova 4-7-8 andning'
		}
	},
	oro: {
		pillarSlug: 'angest',
		exerciseHref: '/ovningar/grounding-5-4-3-2-1',
		exerciseLabel: 'Prova: Grounding 5-4-3-2-1',
		early: {
			text: 'Märker du oron i kroppen just nu? En kort övning kan hjälpa dig att landa.',
			href: '/ovningar/grounding-5-4-3-2-1',
			label: 'Prova grounding'
		}
	},
	sjalvkansla: {
		pillarSlug: 'sjalvkansla',
		exerciseHref: '/ovningar/sjalvmedkansla-ovning',
		exerciseLabel: 'Prova: Självmedkänsla',
		early: {
			text: 'Vill du prova att möta dig själv med lite mer värme? Det finns en kort övning för det.',
			href: '/ovningar/sjalvmedkansla-ovning',
			label: 'Prova övningen'
		}
	},
	depression: {
		pillarSlug: 'depression',
		exerciseHref: '/ovningar/tacksamhetsovning',
		exerciseLabel: 'Prova: Tacksamhetsövning',
		early: {
			text: 'Är orken låg just nu? Ett litet steg kan räcka, som att skriva en enda rad om hur dagen varit.',
			href: DIARY_NEW,
			label: 'Skriv en rad'
		}
	},
	allmant: {
		exerciseHref: '/ovningar',
		exerciseLabel: 'Gör en enkel övning',
		early: {
			text: 'Vill du stanna upp en stund? Skriv några rader om hur det känns för dig just nu.',
			href: DIARY_NEW,
			label: 'Skriv några rader'
		}
	}
};

export function getArticleNextStep(topic: ArticleTopic): ArticleNextStep {
	return NEXT_STEP_BY_TOPIC[topic];
}

// Alla mål, för testernas kontroll av att sidorna finns.
export const allArticleNextStepHrefs: string[] = Object.values(NEXT_STEP_BY_TOPIC).flatMap((step) => [
	step.exerciseHref,
	step.early.href
]);

export type SplitArticleContent = {
	before: string;
	after: string;
};

// Element som inte får vara öppna där texten delas, annars skulle delningen
// hamna mitt i en lista, ett citat eller en tabell.
const BLOCK_TAGS = ['ul', 'ol', 'blockquote', 'table', 'div', 'section', 'details', 'figure'];

function hasBalancedBlocks(html: string): boolean {
	return BLOCK_TAGS.every((tag) => {
		const opened = html.match(new RegExp(`<${tag}\\b`, 'gi'))?.length ?? 0;
		const closed = html.match(new RegExp(`</${tag}>`, 'gi'))?.length ?? 0;
		return opened === closed;
	});
}

// Minsta antal avsnitt för att raden ska visas. Korta artiklar har redan
// nästa steg nära slutet.
const MIN_SECTIONS = 3;

// Delar artikeltexten före en avsnittsrubrik ungefär en tredjedel in, så att
// en kort nästa steg-rad kan visas mellan delarna. Texten ändras aldrig: de
// två delarna är alltid exakt originalet när de sätts ihop.
export function splitArticleContent(html: string): SplitArticleContent {
	const headingStarts = [...html.matchAll(/<h2\b/gi)].map((match) => match.index ?? -1);
	if (headingStarts.length < MIN_SECTIONS) return { before: html, after: '' };

	const target = Math.max(1, Math.floor(headingStarts.length / 3));
	const candidates = [
		...headingStarts.slice(target),
		...headingStarts.slice(1, target).reverse()
	];

	for (const index of candidates) {
		const before = html.slice(0, index);
		if (index > 0 && hasBalancedBlocks(before)) {
			return { before, after: html.slice(index) };
		}
	}

	return { before: html, after: '' };
}
