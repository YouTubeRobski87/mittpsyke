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
				href: '/guider-seo/angest/panikangest-och-kroppen'
			},
			{
				title: 'Orostankar som snurrar – när hjärnan inte kan stänga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Ångest och sömn – varför natten kan bli svårare',
				href: '/guider-seo/angest/angest-och-somn'
			},
			{
				title: 'Social ångest – rädslan för att bli bedömd av andra',
				href: '/guider-seo/angest/social-angest'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'panikangest-och-kroppen',
		title: 'Panikangest - vad som hander i kroppen och hur du kan hantera det',
		description: 'Om kroppens starka reaktioner vid panikangest och hur du kan forsta det som hander.',
		faqs: [
			{
				question: 'Varfor reagerar kroppen sa starkt vid panikangest?',
				answer: 'Kroppen gar in i alarmberedskap, vilket kan ge hjartklappning, yrsel, tryck over brostet och snabb andning.'
			},
			{
				question: 'Ar panikangest farligt?',
				answer: 'Det brukar inte vara farligt i sig, men upplevelsen kan vara mycket intensiv och skrämmande.'
			},
			{
				question: 'Varfor kanns det som att jag tappar kontrollen?',
				answer: 'Nar stressystemet slar pa starkt kan hjarnan tolka reaktionerna som ett hot, vilket forstarker kanslan.'
			},
			{
				question: 'Vad kan hjalpa i stunden?',
				answer: 'Att sakta ner andningen, stanna kvar i nuet och paminna dig om att reaktionen gar over kan minska intensiteten.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken pa angest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar - nar hjarnan inte kan stanga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Angest och somn - varfor natten kan bli svarare',
				href: '/guider-seo/angest/angest-och-somn'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'orostankar',
		title: 'Orostankar som snurrar - nar hjarnan inte kan stanga av',
		description: 'Om oro som gar runt i cirklar och gor det svart att komma till ro.',
		faqs: [
			{
				question: 'Varfor fastnar jag i orostankar?',
				answer: 'Hjarnan forsoker ofta forutse problem for att skydda dig, men det kan i stallet leda till att tankarna aldrig far vila.'
			},
			{
				question: 'Ar oro alltid nagot negativt?',
				answer: 'Inte alltid, men nar oron tar over och paverkar somn, fokus eller vardag blir den ofta mer belastande an hjalpsam.'
			},
			{
				question: 'Kan orostankar oka pa kvallen?',
				answer: 'Ja, nar det blir tyst och stilla far tankarna ofta mer utrymme och kan kannas starkare.'
			},
			{
				question: 'Vad kan vara ett forsta steg?',
				answer: 'Att lagga marke till nar oron borjar dra ivag och ge den en tydlig plats i stallet for att folja varje tanke kan hjalpa.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken pa angest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Panikangest - vad som hander i kroppen och hur du kan hantera det',
				href: '/guider-seo/angest/panikangest-och-kroppen'
			},
			{
				title: 'Angest och somn - varfor natten kan bli svarare',
				href: '/guider-seo/angest/angest-och-somn'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-och-somn',
		title: 'Angest och somn - varfor natten kan bli svarare',
		description: 'Om hur angest ofta blir tydligare pa kvallen och kan gora det svart att somna eller sova lugnt.',
		faqs: [
			{
				question: 'Varfor blir angesten starkare pa natten?',
				answer: 'Nar tempot sjunker och intrycken minskar far kanslor och tankar ofta mer plats, vilket kan gora angesten tydligare.'
			},
			{
				question: 'Kan angest vacka mig under natten?',
				answer: 'Ja, vissa vaknar med hjartklappning, oro eller stark kroppslig anspanning mitt i natten.'
			},
			{
				question: 'Gor dalig somn angesten varre?',
				answer: 'Ofta ja. Somnbrist kan gora nervsystemet mer kansligt och det kan bli svarare att hantera oro dagen efter.'
			},
			{
				question: 'Vad kan hjalpa mest?',
				answer: 'Att minska pressen kring somnen och samtidigt fa stod i det som skapar angesten brukar vara viktigare an att bara forsoka sova mer.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken pa angest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Varfor kan jag inte sova',
				href: '/guider-seo/sovproblem/orsaker'
			},
			{
				title: 'Stress och somn - nar kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'social-angest',
		title: 'Social angest - radslan for att bli bedomd av andra',
		description: 'Om oro i sociala situationer och varfor blicken fran andra kan kannas sa stark.',
		faqs: [
			{
				question: 'Vad ar social angest?',
				answer: 'Det handlar ofta om stark oro for att bli granskad, bortgjord eller negativt bedomd i sociala sammanhang.'
			},
			{
				question: 'Varfor undviker jag vissa situationer?',
				answer: 'Undvikande blir ofta ett satt att forsoka minska obehaget snabbt, men det kan samtidigt halla oron vid liv.'
			},
			{
				question: 'Ar det bara blyghet?',
				answer: 'Inte nodvandigtvis. Social angest brukar vara mer intensiv och kan paverka arbete, relationer och vardag.'
			},
			{
				question: 'Kan det bli battre?',
				answer: 'Ja, med forstaelse, sma steg och stod gar det ofta att minska radsla och bygga mer trygghet i sociala situationer.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken pa angest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar - nar hjarnan inte kan stanga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Lag sjalvkansla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
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
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			},
			{
				title: 'Skillnaden mellan sorg och depression – och varför det spelar roll',
				href: '/guider-seo/depression/sorg-och-depression'
			},
			{
				title: 'Små steg när energin tryter – vad som faktiskt kan hjälpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
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
				href: '/guider-seo/trauma/nervsystemet-och-trauma'
			},
			{
				title: 'Grounding – enkla övningar för att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Undvikande efter trauma – varför vi gör det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Tillit och trygghet i relationer efter svåra upplevelser',
				href: '/guider-seo/trauma/tillit-efter-trauma'
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
		pillarSlug: 'sovproblem',
		slug: 'stress-och-somn',
		title: 'Stress och somn - nar kroppen inte kan varva ner',
		description: 'Om hur stress kan halla kroppen i beredskap och gora det svart att komma till ro pa kvallen.',
		faqs: [
			{
				question: 'Varfor blir somnen svarare nar jag ar stressad?',
				answer: 'Stress aktiverar nervsystemet och gor att kroppen stannar i hog beredskap trots att du egentligen behover vila.'
			},
			{
				question: 'Kan kroppen vara trott men anda inte slappna av?',
				answer: 'Ja, det ar vanligt att vara utmattad men samtidigt uppvarvad nar belastningen har varit hog under lang tid.'
			},
			{
				question: 'Hjalper det att forsoka tvinga fram somn?',
				answer: 'Ofta inte. Press och kamp med somnen kan i stallet oka stressen och gora insomnandet annu svarare.'
			},
			{
				question: 'Vad kan vara ett forsta steg?',
				answer: 'Att lagga marke till stresspaslaget, sakta ner tempot och ge kroppen en tydlig overgang mellan dag och natt kan vara en bra borjan.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'altande-pa-kvallen',
		title: 'Altande pa kvallen - varfor tankarna blir starkare i sangen',
		description: 'Om varfor tankar ofta tar mer plats pa kvallen och hur altande kan halla dig vaken.',
		faqs: [
			{
				question: 'Varfor borjar jag tanka mer just nar jag lagger mig?',
				answer: 'Nar det blir tyst omkring dig far hjarnan mer utrymme, och oro eller obearbetade intryck kan bli tydligare.'
			},
			{
				question: 'Ar altande samma sak som problemlosning?',
				answer: 'Inte riktigt. Altande kanns ofta som att tankarna gar i cirklar utan att leda till ett tydligt svar eller beslut.'
			},
			{
				question: 'Kan kvallsoro gora att jag somnar senare?',
				answer: 'Ja, mental aktivering pa kvallen kan gora det svare att komma ner i ro och slappa taget om dagen.'
			},
			{
				question: 'Vad kan hjalpa nar tankarna snurrar i sangen?',
				answer: 'Det kan hjalpa att satta ord pa tankarna tidigare pa kvallen eller anvanda en lugn rutin som markerar att dagen ar slut.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'trott-men-uppvarvad',
		title: 'Trott men uppvarvad - nar kroppen vill sova men hjarnan inte slapper taget',
		description: 'Om den vanliga konflikten mellan trott kropp och overaktiv hjarna vid somnproblem.',
		faqs: [
			{
				question: 'Hur kan jag vara trott men anda inte kunna somna?',
				answer: 'Det hander nar kroppen behover vila men hjarnan fortfarande ar aktiv av stress, oro eller overstimulering.'
			},
			{
				question: 'Ar det vanligt att kanna sig rastlos pa kvallen?',
				answer: 'Ja, manga beskriver en rastlos eller spand kansla trots att de ar helt slut i kroppen.'
			},
			{
				question: 'Betyder det har att nagot ar fel pa mig?',
				answer: 'Inte nodvandigtvis. Det ar ofta en reaktion pa belastning, hog anspanning eller att nervsystemet inte har hunnit varva ner.'
			},
			{
				question: 'Vad kan minska den har kanslan?',
				answer: 'Lugna overganger, mindre press kring somnen och regelbundna stunder for aterhamtning under dagen kan gora skillnad over tid.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'somnbrist-och-maendet',
		title: 'Nar somnbrist paverkar maendet - oro, irritation och nedstamdhet',
		description: 'Om hur for lite somn kan paverka kanslolaget, tankarna och orken i vardagen.',
		faqs: [
			{
				question: 'Kan somnbrist gora mig mer orolig?',
				answer: 'Ja, for lite somn kan gora nervsystemet mer kansligt och det kan bli svarare att hantera oro och stress.'
			},
			{
				question: 'Varfor blir jag lattare irriterad nar jag sovit daligt?',
				answer: 'Nar du har somnbrist far hjarnan svarare att reglera kanslor, vilket kan gora att sma saker kanns storre an de brukar.'
			},
			{
				question: 'Kan dalig somn hanga ihop med nedstamdhet?',
				answer: 'Ja, somn och maende paverkar varandra starkt och langvariga somnproblem kan bidra till nedstamdhet eller forvarra den.'
			},
			{
				question: 'Nar bor jag ta hjalp for bade somn och maende?',
				answer: 'Om somnbristen pagatt ett tag och samtidigt paverkar hur du mar, fungerar eller orkar i vardagen ar det klokt att soka stod.'
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
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Perfektionism och självkänsla – när ingenting känns tillräckligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Att sätta gränser när självkänslan är låg – varför det är svårt',
				href: '/guider-seo/sjalvkansla/gransen-och-sjalvkansla'
			},
			{
				title: 'Jämförelseträsket – sociala medier och din självbild',
				href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild'
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
