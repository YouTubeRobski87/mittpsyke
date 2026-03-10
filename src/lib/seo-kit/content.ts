export type FaqItem = {
	question: string;
	answer: string;
};

export type RelatedArticle = {
	title: string;
	href: string;
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
	relatedArticles?: RelatedArticle[];
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
	},
	{
		slug: 'sovproblem',
		title: 'Sövnproblem',
		description: 'Forsta varfor somnen uteblir och hur du kan borja hantera det som haller dig vaken.',
		chatPath: '/chat/a'
	},
	{
		slug: 'sjalvkansla',
		title: 'Självkänsla',
		description: 'Om lag sjalvkansla, vad det beror pa och hur du kan borja utforska din relation till dig sjalv.',
		chatPath: '/chat/a'
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
		],
		relatedArticles: [
			{
				title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det',
				href: '/guider/panikangest-och-kroppen'
			},
			{
				title: 'Orostankar som snurrar – när hjärnan inte kan stänga av',
				href: '/guider/orostankar'
			},
			{
				title: 'Ångest och sömn – varför natten kan bli svårare',
				href: '/guider/angest-och-somn'
			},
			{
				title: 'Social ångest – rädslan för att bli bedömd av andra',
				href: '/guider/social-angest'
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
		],
		relatedArticles: [
			{
				title: 'Trötthet och meningslöshet – när ingenting känns värt att göra',
				href: '/guider/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/nedstamdhet-och-relationer'
			},
			{
				title: 'Skillnaden mellan sorg och depression – och varför det spelar roll',
				href: '/guider/sorg-och-depression'
			},
			{
				title: 'Små steg när energin tryter – vad som faktiskt kan hjälpa',
				href: '/guider/sma-steg-vid-nedstamdhet'
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
				answer: 'Sma forutsagbara rutiner, grounding och trygg kontakt med andra brukar vara hjalpsamt.'
			},
			{
				question: 'Nar bor jag prata med en terapeut?',
				answer: 'Om symtomen varar eller okar, eller om minnen och undvikande begransar ditt liv.'
			}
		],
		relatedArticles: [
			{
				title: 'Vad händer i nervsystemet vid trauma – fight, flight och freeze',
				href: '/guider/nervsystemet-och-trauma'
			},
			{
				title: 'Grounding – enkla övningar för att landa i kroppen igen',
				href: '/guider/grounding-ovningar'
			},
			{
				title: 'Undvikande efter trauma – varför vi gör det och vad det kostar',
				href: '/guider/undvikande-efter-trauma'
			},
			{
				title: 'Tillit och trygghet i relationer efter svåra upplevelser',
				href: '/guider/tillit-efter-trauma'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'orsaker',
		title: 'Varfor kan jag inte sova',
		description: 'Vanliga orsaker till somnproblem och vad som haller hjarnan vaken pa natten.',
		faqs: [
			{
				question: 'Varfor kan jag inte somna trots att jag ar trott?',
				answer: 'Hjarnan kan vara i hog beredskap pa grund av stress, oro eller obearbetade tankar som aktiverar nervsystemet.'
			},
			{
				question: 'Ar somnproblem ett tecken pa nagonting allvarligt?',
				answer: 'Inte alltid, men langvariga somnproblem kan vara kopplade till angest, depression eller stress som fortjanar uppmarksamhet.'
			},
			{
				question: 'Kan man tranas upp till battre somn?',
				answer: 'Ja, somn paverkas av vanor, kanslobearbetning och trygghetskansla – alla saker som kan forandra med tid och stod.'
			},
			{
				question: 'Hjalper det att prata om det som oroar en?',
				answer: 'Ofta ja. Att satta ord pa oron kan minska den mentala aktiveringen och gora det lattare att slappna av.'
			}
		],
		relatedArticles: [
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
			},
			{
				title: 'Ältande på kvällen – varför tankarna blir starkare i sängen',
				href: '/guider-seo/sovproblem/altande-pa-kvallen'
			},
			{
				title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget',
				href: '/guider-seo/sovproblem/trott-men-uppvarvad'
			},
			{
				title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet',
				href: '/guider-seo/sovproblem/somnbrist-och-maendet'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'lag-sjalvkansla',
		title: 'Lag sjalvkansla – vad det ar och var det kommer ifran',
		description: 'Om vad lag sjalvkansla innebar, hur den uppstar och hur du kan borja utforska forhallandena till dig sjalv.',
		faqs: [
			{
				question: 'Vad ar skillnaden mellan sjalvkansla och sjalvfortroende?',
				answer: 'Sjalvkansla handlar om kanslan av att vara tillracklig som person. Sjalvfortroende handlar mer om tron pa sin formaga i specifika situationer.'
			},
			{
				question: 'Kan lag sjalvkansla forandra sig?',
				answer: 'Ja. Sjalvkansla ar inte fast – den paverkas av erfarenheter, relationer och hur vi bearbetar dem over tid.'
			},
			{
				question: 'Varfor ar det svart att ta emot berom?',
				answer: 'Vid lag sjalvkansla stammer inte berom overens med den inre bilden av sig sjalv, och hjarnan tenderar att avfarda det som oarligt.'
			},
			{
				question: 'Hur borjar man arbeta med sjalvkansla?',
				answer: 'Ofta genom att bli medveten om den inre rosta – hur du pratar med dig sjalv – och borja utforska varifraN den restan kom.'
			}
		],
		relatedArticles: [
			{
				title: 'Den inre kritikern – varför rösten finns och vad den egentligen vill',
				href: '/guider/inre-kritikern'
			},
			{
				title: 'Perfektionism och självkänsla – när ingenting känns tillräckligt bra',
				href: '/guider/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Att sätta gränser när självkänslan är låg – varför det är svårt',
				href: '/guider/gransen-och-sjalvkansla'
			},
			{
				title: 'Jämförelseträsket – sociala medier och din självbild',
				href: '/guider/jamforelse-och-sjalvbild'
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
