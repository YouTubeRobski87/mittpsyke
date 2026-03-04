export type FaqItem = {
	question: string;
	answer: string;
};

export type Pillar = {
	slug: string;
	title: string;
	description: string;
	chatPath: '/chat/a' | '/chat/b' | '/chat/e';
};

export type Guide = {
	pillarSlug: Pillar['slug'];
	slug: string;
	title: string;
	description: string;
	faqs: FaqItem[];
};

export const pillars: Pillar[] = [
	{
		slug: 'angest',
		title: 'Angest',
		description: 'Forsta vanliga reaktioner vid angest och hur du kan hantera dem stegvis.',
		chatPath: '/chat/a'
	},
	{
		slug: 'depression',
		title: 'Nedstamdhet och depression',
		description: 'En lugn oversikt av symtom, vardagsstod och nar extra hjalp kan behovas.',
		chatPath: '/chat/b'
	},
	{
		slug: 'trauma',
		title: 'Trauma och trygghet',
		description: 'Om stressreaktioner efter svaira handelser och satt att bygga mer trygghet.',
		chatPath: '/chat/e'
	}
];

export const guides: Guide[] = [
	{
		pillarSlug: 'angest',
		slug: 'tecken',
		title: 'Tecken pa angest',
		description: 'Vanliga kroppsliga och mentala tecken pa angest.',
		faqs: [
			{
				question: 'Hur kanns angest i kroppen?',
				answer: 'Manga upplever hjartklappning, tryck over brostet, yrsel eller snabb andning.'
			},
			{
				question: 'Ar angest farligt?',
				answer: 'Angest i sig ar oftast inte farligt, men den kan vara mycket jobbig och bor tas pa allvar.'
			},
			{
				question: 'Nar bor jag soka professionell hjalp?',
				answer: 'Om angesten styr vardagen, paverkar somn eller gor att du undviker mycket i livet.'
			},
			{
				question: 'Kan andningstekniker hjalpa snabbt?',
				answer: 'Ja, langsam och regelbunden andning kan ofta minska stressreaktionen inom nagra minuter.'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet',
		title: 'Nedstamdhet eller depression',
		description: 'Skillnader mellan tillfallig nedstamdhet och depression.',
		faqs: [
			{
				question: 'Hur vet jag om det ar depression?',
				answer: 'Om nedstamdhet, hopploshet eller energibrist sitter i under flera veckor och paverkar vardagen.'
			},
			{
				question: 'Ar trotthet ett vanligt tecken?',
				answer: 'Ja, manga far minskad ork, svart att komma igang och mindre intresse for tidigare aktiviteter.'
			},
			{
				question: 'Kan sma steg gora skillnad?',
				answer: 'Ja, fasta rutiner, korta promenader och kontakt med andra kan vara viktiga forbattringssteg.'
			},
			{
				question: 'Nar ar det akut att soka hjalp?',
				answer: 'Vid sjalvskadetankar eller kansla av att inte vilja leva ska du soka akut hjalp direkt.'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'trygghet',
		title: 'Trygghet efter trauma',
		description: 'Om overstarkta stressreaktioner och hur trygghet kan byggas upp igen.',
		faqs: [
			{
				question: 'Vad ar en vanlig reaktion efter trauma?',
				answer: 'Flashbacks, oro, spanningskansla och svarta somnperioder ar vanliga tidiga reaktioner.'
			},
			{
				question: 'Varfor reagerar kroppen sa starkt?',
				answer: 'Nervsystemet kan sta kvar i hog beredskap efter en overvaldigande handelse.'
			},
			{
				question: 'Hur bygger jag mer trygghet i vardagen?',
				answer: 'Små forutsagbara rutiner, grounding och trygg kontakt med andra brukar vara hjalpsamt.'
			},
			{
				question: 'Nar bor jag prata med en terapeut?',
				answer: 'Om symtomen varar eller okar, eller om minnen och undvikande begransar ditt liv.'
			}
		]
	}
];

export function getPillarBySlug(slug: string): Pillar | undefined {
	return pillars.find((pillar) => pillar.slug === slug);
}

export function getGuidesForPillar(pillarSlug: string): Guide[] {
	return guides.filter((guide) => guide.pillarSlug === pillarSlug);
}

export function getGuideBySlugs(pillarSlug: string, guideSlug: string): Guide | undefined {
	return guides.find((guide) => guide.pillarSlug === pillarSlug && guide.slug === guideSlug);
}

export function getGuiderSeoPaths(): string[] {
	const paths = ['/guider-seo'];

	for (const pillar of pillars) {
		paths.push(`/guider-seo/${pillar.slug}`);
	}

	for (const guide of guides) {
		paths.push(`/guider-seo/${guide.pillarSlug}/${guide.slug}`);
	}

	return paths;
}
