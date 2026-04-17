export type FaqItem = {
	question: string;
	answer: string;
};

export type RelatedArticle = {
	title: string;
	href: string;
};

export type SourceItem = {
	label: string;
	url: string;
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
	nextStepTool?: string;
	title: string;
	description: string;
	seoTitle?: string;
	seoDescription?: string;
	faqs: FaqItem[];
	relatedArticles?: RelatedArticle[];
	updatedAt?: string;
	sources?: SourceItem[];
	content?: string;
};

export type SeoLandingSection = {
	heading: string;
	body: string;
	links?: RelatedArticle[];
};

export type SeoLandingPage = {
	pillarSlug: Pillar['slug'];
	seoTitle: string;
	seoDescription: string;
	h1: string;
	intro: string;
	sections: SeoLandingSection[];
	primaryLinks?: RelatedArticle[];
	faqs?: FaqItem[];
	updatedAt?: string;
	sources?: SourceItem[];
};

export const pillars: Pillar[] = [
	{
		slug: 'angest',
		title: 'Ångest',
		description: 'Förstå vanliga reaktioner vid ångest och hur du kan hantera dem stegvis.',
		chatPath: '/chat/a'
	},
	{
		slug: 'panikattack',
		title: 'Panikattack',
		description: 'Förstå panikattacker, vad som händer i kroppen och hur du kan ta dig igenom det steg för steg.',
		chatPath: '/chat/a'
	},
	{
		slug: 'depression',
		title: 'Nedstämdhet och depression',
		description: 'En lugn översikt av symtom, vardagsstöd och när extra hjälp kan behövas.',
		chatPath: '/chat/b'
	},
	{
		slug: 'trauma',
		title: 'Trauma och trygghet',
		description: 'Om stressreaktioner efter svåra händelser och sätt att bygga mer trygghet.',
		chatPath: '/chat/e'
	},
	{
		slug: 'sovproblem',
		title: 'Sömnproblem',
		description: 'Förstå varför sömnen uteblir och hur du kan börja hantera det som håller dig vaken.',
		chatPath: '/chat/a'
	},
	{
		slug: 'sjalvkansla',
		title: 'Självkänsla',
		description: 'Om låg självkänsla, vad det beror på och hur du kan börja utforska din relation till dig själv.',
		chatPath: '/chat/a'
	}
,

	{
		slug: 'stress',
		title: 'Stress och överbelastning',
		description: 'Om stress, mental utmattning och hur du kan börja hitta tillbaka till ett lugnare läge.',
		chatPath: '/chat/a'
	},
	{
		slug: 'ensamhet',
		title: 'Ensamhet och tomhet',
		description: 'Om känslan av ensamhet, tomhet och hur du kan börja hitta kontakt med dig själv och andra.',
		chatPath: '/chat/b'
	},
	{
		slug: 'overtankande',
		title: 'Ältande och övertänkande',
		description: 'Om tankeloopar, grubblande och hur du kan hitta mer lugn utan att behöva stänga av allt.',
		chatPath: '/chat/e'
	},
	{
		slug: 'kbt',
		title: 'KBT – Kognitiv beteendeterapi',
		description: 'Förstå KBT-principer och prova tekniker du kan använda hemma för att hantera tankar, känslor och beteenden.',
		chatPath: '/chat/a'
	},
	{
		slug: 'beroende',
		title: 'Beroende och missbruk',
		description: 'Om skam, ambivalens, kontrollförlust och små steg mot stöd när något har börjat ta för stor plats.',
		chatPath: '/chat/b'
	}
];

export const guides: Guide[] = [
	{
		pillarSlug: 'angest',
		slug: 'tecken',
		title: 'Tecken på ångest',
		description: 'Vanliga kroppsliga och mentala tecken på ångest.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Hur känns ångest i kroppen?',
				answer: 'Många upplever hjärtklappning, tryck över bröstet, yrsel eller snabb andning.'
			},
			{
				question: 'Är ångest farligt?',
				answer: 'Ångest i sig är oftast inte farligt, men den kan vara mycket jobbig och bör tas på allvar.'
			},
			{
				question: 'När bör jag söka professionell hjälp?',
				answer: 'Om ångesten styr vardagen, påverkar sömn eller gör att du undviker mycket i livet.'
			},
			{
				question: 'Kan andningstekniker hjälpa snabbt?',
				answer: 'Ja, långsam och regelbunden andning kan ofta minska stressreaktionen inom några minuter.'
			}
		],
		relatedArticles: [
			{
				title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det',
				href: '/guider/angest/panikangest-och-kroppen'
			},
			{
				title: 'Orostankar som snurrar – när hjärnan inte kan stänga av',
				href: '/guider/angest/orostankar'
			},
			{
				title: 'Ångest och sömn – varför natten kan bli svårare',
				href: '/guider/angest/angest-och-somn'
			},
			{
				title: 'Social ångest – rädslan för att bli bedömd av andra',
				href: '/guider/angest/social-angest'
			}
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'panikangest-och-kroppen',
		title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det',
		description: 'Om kroppens starka reaktioner vid panikångest och hur du kan förstå det som händer.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför reagerar kroppen så starkt vid panikångest?',
				answer: 'Kroppen går in i alarmberedskap, vilket kan ge hjärtklappning, yrsel, tryck över bröstet och snabb andning.'
			},
			{
				question: 'Är panikångest farligt?',
				answer: 'Det brukar inte vara farligt i sig, men upplevelsen kan vara mycket intensiv och skrämmande.'
			},
			{
				question: 'Varför känns det som att jag tappar kontrollen?',
				answer: 'När stressystemet slår på starkt kan hjärnan tolka reaktionerna som ett hot, vilket förstärker känslan.'
			},
			{
				question: 'Vad kan hjälpa i stunden?',
				answer: 'Att sakta ner andningen, stanna kvar i nuet och påminna dig om att reaktionen går över kan minska intensiteten.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på ångest',
				href: '/guider/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar – när hjärnan inte kan stänga av',
				href: '/guider/angest/orostankar'
			},
			{
				title: 'Ångest och sömn – varför natten kan bli svårare',
				href: '/guider/angest/angest-och-somn'
			}
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'orostankar',
		title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
		description: 'Om oro som går runt i cirklar och gör det svårt att komma till ro.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför fastnar jag i orostankar?',
				answer: 'Hjärnan försöker ofta förutse problem för att skydda dig, men det kan i stället leda till att tankarna aldrig får vila.'
			},
			{
				question: 'Är oro alltid något negativt?',
				answer: 'Inte alltid, men när oron tar över och påverkar sömn, fokus eller vardag blir den ofta mer belastande än hjälpsam.'
			},
			{
				question: 'Kan orostankar öka på kvällen?',
				answer: 'Ja, när det blir tyst och stilla får tankarna ofta mer utrymme och kan kännas starkare.'
			},
			{
				question: 'Vad kan vara ett första steg?',
				answer: 'Att lägga märke till när oron börjar dra iväg och ge den en tydlig plats i stället för att följa varje tanke kan hjälpa.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på ångest',
				href: '/guider/angest/tecken'
			},
			{
				title: 'Panikångest - vad som händer i kroppen och hur du kan hantera det',
				href: '/guider/angest/panikangest-och-kroppen'
			},
			{
				title: 'Ångest och sömn - varför natten kan bli svårare',
				href: '/guider/angest/angest-och-somn'
			}
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-och-somn',
		title: 'Ångest och sömn - varför natten kan bli svårare',
		description: 'Om hur ångest ofta blir tydligare på kvällen och kan göra det svårt att somna eller sova lugnt.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför blir ångesten starkare på natten?',
				answer: 'När tempot sjunker och intrycken minskar får känslor och tankar ofta mer plats, vilket kan göra ångesten tydligare.'
			},
			{
				question: 'Kan ångest väcka mig under natten?',
				answer: 'Ja, vissa vaknar med hjärtklappning, oro eller stark kroppslig anspänning mitt i natten.'
			},
			{
				question: 'Gör dålig sömn ångesten värre?',
				answer: 'Ofta ja. Sömnbrist kan göra nervsystemet mer känsligt och det kan bli svårare att hantera oro dagen efter.'
			},
			{
				question: 'Vad kan hjälpa mest?',
				answer: 'Att minska pressen kring sömnen och samtidigt få stöd i det som skapar ångesten brukar vara viktigare än att bara försöka sova mer.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på ångest',
				href: '/guider/angest/tecken'
			},
			{
				title: 'Varför kan jag inte sova',
				href: '/guider/sovproblem/orsaker'
			},
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider/sovproblem/stress-och-somn'
			},
			{
				title: 'Hjälp vid oro på kvällen – vad du kan göra just nu',
				href: '/guider/angest/hjalp-vid-oro-pa-kvallen'
			}
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'social-angest',
		title: 'Social ångest - rädslan för att bli bedömd av andra',
		description: 'Om oro i sociala situationer och varför blicken från andra kan kännas så stark.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad är social ångest?',
				answer: 'Det handlar ofta om stark oro för att bli granskad, bortgjord eller negativt bedömd i sociala sammanhang.'
			},
			{
				question: 'Varför undviker jag vissa situationer?',
				answer: 'Undvikande blir ofta ett sätt att försöka minska obehaget snabbt, men det kan samtidigt hålla oron vid liv.'
			},
			{
				question: 'Är det bara blyghet?',
				answer: 'Inte nödvändigtvis. Social ångest brukar vara mer intensiv och kan påverka arbete, relationer och vardag.'
			},
			{
				question: 'Kan det bli battre?',
				answer: 'Ja, med förståelse, små steg och stöd går det ofta att minska rädsla och bygga mer trygghet i sociala situationer.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på ångest',
				href: '/guider/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
				href: '/guider/angest/orostankar'
			},
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider/sjalvkansla/lag-sjalvkansla'
			}
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet',
		title: 'Nedstämdhet eller depression',
		description: 'Skillnader mellan tillfällig nedstämdhet och depression.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Hur vet jag om det är depression?',
				answer: 'Om nedstämdhet, hopploshet eller energibrist sitter i under flera veckor och påverkar vardagen.'
			},
			{
				question: 'Är trötthet ett vanligt tecken?',
				answer: 'Ja, många för minskad ork, svårt att komma igång och mindre intresse för tidigare aktiviteter.'
			},
			{
				question: 'Kan små steg göra skillnad?',
				answer: 'Ja, fasta rutiner, korta promenader och kontakt med andra kan vara viktiga förbättringssteg.'
			},
			{
				question: 'När är det akut att soka hjälp?',
				answer: 'Vid självskade tankar eller känsla av att inte vilja leva ska du soka akut hjälp direkt.'
			}
		],
		relatedArticles: [
			{
				title: 'Trötthet och meningslöshet – när ingenting känns värt att göra',
				href: '/guider/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/depression/nedstamdhet-och-relationer'
			},
			{
				title: 'Skillnaden mellan sorg och depression – och varför det spelar roll',
				href: '/guider/depression/sorg-och-depression'
			},
			{
				title: 'Små steg när energin tryter – vad som faktiskt kan hjälpa',
				href: '/guider/depression/sma-steg-vid-nedstamdhet'
			}
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'trotthet-och-meningsloshet',
		title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
		description: 'Om trötthet, tomhet och känslan av att vardagen förlorar sin riktning.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför blir allt så tungt när jag mår dåligt?',
				answer: 'Nedstämdhet kan påverka energi, motivation och känslan av mening, vilket gör att små saker kan kännas mycket stora.'
			},
			{
				question: 'Är tröttheten bara fysisk?',
				answer: 'Nej, den kan också vara mental och känslomässig, som om allt i dig går långsammare.'
			},
			{
				question: 'Varför tappar jag lusten till sant jag brukade tycka om?',
				answer: 'Det är vanligt att nedstämdhet gör att intresse och drivkraft minskar, även för sådant som tidigare kändes viktigt.'
			},
			{
				question: 'Vad kan hjälpa när allt känns tomt?',
				answer: 'Ofta är mycket små och konkreta steg mer realistiska an att försöka hitta stor motivation direkt.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			},
			{
				title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
				href: '/guider/depression/sma-steg-vid-nedstamdhet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/depression/nedstamdhet-och-relationer'
			}
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet-och-relationer',
		title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
		description: 'Om hur nedstämdhet kan göra det svårare att orka med kontakt, närhet och samtal.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför drar jag mig undan när jag är nedstämd?',
				answer: 'När orken är låg blir social kontakt ofta mer kravfylld, och ensamhet kan ibland kännas enklare an att försöka förklara hur det är.'
			},
			{
				question: 'Kan nedstämdhet skapa missförstånd i relationer?',
				answer: 'Ja, andra kan tolka tillbakadragenhet som ointresse trots att det egentligen handlar om att du kämpar mycket inombords.'
			},
			{
				question: 'Varför känns närhet svårare?',
				answer: 'Nedstämdhet kan minska energi, hopp och tillgång till känslor, vilket ibland gör det svårt att vara närvarande med andra.'
			},
			{
				question: 'Hur kan jag börja prata om det?',
				answer: 'Det kan hjälpa att börja enkelt och beskriva att du har mindre ork just nu, utan att behova förklara allt på en gang.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			},
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Jämförelsetrasket - sociala medier och din självbild',
				href: '/guider/sjalvkansla/jamforelse-och-sjalvbild'
			}
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'sorg-och-depression',
		title: 'Skillnaden mellan sorg och depression - och varför det spelar roll',
		description: 'Om likheter och skillnader mellan sorg och depression, och varför de ibland blandas ihop.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Hur skiljer sig sorg fran depression?',
				answer: 'Sorg är ofta kopplad till en förlust, medan depression kan vara bredare och påverka hela vardagen under längre tid.'
			},
			{
				question: 'Kan sorg också vara tung och överväldigar?',
				answer: 'Ja, sorg kan vara mycket stark och påverka både kropp, sömn och ork, utan att det betyder att det är depression.'
			},
			{
				question: 'Kan man ha både sorg och depression samtidigt?',
				answer: 'Ja, de kan överlappa varandra och ibland göra det svårt att själv avgöra vad som pågår.'
			},
			{
				question: 'Varför spelar skillnaden roll?',
				answer: 'för att stodet ibland ser olika ut, och det kan vara viktigt att förstå vad som driver måendet just nu.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			},
			{
				title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
				href: '/guider/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
				href: '/guider/depression/sma-steg-vid-nedstamdhet'
			}
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'sma-steg-vid-nedstamdhet',
		title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
		description: 'Om varsamma och realistiska steg när energin är låg och allt känns svårt att börja med.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför hjälper små steg battre an stora planer?',
				answer: 'När orken är låg blir för stora krav ofta överväldigar, medan små steg är lättare att genomföra och bygga vidare på.'
			},
			{
				question: 'Vad kan ett litet steg vara?',
				answer: 'Det kan vara att äta något enkelt, gå ut en kort stund eller skicka ett meddelande till någon du litar på.'
			},
			{
				question: 'Racker små steg verkligen?',
				answer: 'Ja, ofta är det just regelbundna och genomförbara steg som skapar rörelse när allt annars star still.'
			},
			{
				question: 'Hur undviker jag att bli besviken på mig själv?',
				answer: 'Genom att mata framsteg efter vad som är möjligt just nu, inte efter hur mycket du tycker att du borde orka.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			},
			{
				title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
				href: '/guider/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/depression/nedstamdhet-och-relationer'
			}
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'trygghet',
		title: 'Trygghet efter trauma',
		description: 'Om överstärkta stressreaktioner och hur trygghet kan byggas upp igen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad är en vanlig reaktion efter trauma?',
				answer: 'Flashbacks, oro, spänningskänsla och svåra sömnperioder är vanliga tidiga reaktioner.'
			},
			{
				question: 'Varför reagerar kroppen sa starkt?',
				answer: 'Nervsystemet kan sta kvar i hög beredskap efter en överväldigande handelse.'
			},
			{
				question: 'Hur bygger jag mer trygghet i vardagen?',
				answer: 'Små förutsägbara rutiner, grounding och trygg kontakt med andra brukar vara hjälpsamt.'
			},
			{
				question: 'När bör jag prata med en terapeut?',
				answer: 'Om symtomen varar eller ökar, eller om minnen och undvikande begränsar ditt liv.'
			}
		],
		relatedArticles: [
			{
				title: 'Vad händer i nervsystemet vid trauma – fight, flight och freeze',
				href: '/guider/trauma/nervsystemet-och-trauma'
			},
			{
				title: 'Grounding – enkla övningar för att landa i kroppen igen',
				href: '/guider/trauma/grounding-ovningar'
			},
			{
				title: 'Undvikande efter trauma – varför vi gör det och vad det kostar',
				href: '/guider/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Tillit och trygghet i relationer efter svåra upplevelser',
				href: '/guider/trauma/tillit-efter-trauma'
			}
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'nervsystemet-och-trauma',
		title: 'Vad händer i nervsystemet vid trauma - fight, flight och freeze',
		description: 'Om hur nervsystemet kan fastna i stark beredskap efter svara upplevelser.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad betyder fight, flight och freeze?',
				answer: 'Det är kroppens automatiska överlevnadsreaktioner när något upplevs som hotfullt eller överväldigar.'
			},
			{
				question: 'Varför reagerar kroppen sa snabbt?',
				answer: 'Nervsystemet är byggt för att skydda dig, och efter trauma kan det bli extra känsligt för signaler om fara.'
			},
			{
				question: 'Kan reaktionerna komma trots att jag vet att jag är saker nu?',
				answer: 'Ja, kroppen kan reagera före den medvetna tanken hinner ikapp, sarskilt om den lart sig att vara på sin vakt.'
			},
			{
				question: 'Hjälper det att förstå reaktionen?',
				answer: 'Ofta ja. Att se reaktionen som ett skyddssystem snarare an ett personligt fel kan minska skam och förvirring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla övningar för att landa i kroppen igen',
				href: '/guider/trauma/grounding-ovningar'
			},
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider/sovproblem/stress-och-somn'
			}
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'grounding-ovningar',
		title: 'Grounding - enkla övningar för att landa i kroppen igen',
		description: 'Om grounding som ett sätt att återfå orientering och kontakt med nuet när kroppen är i alarm.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad är grounding?',
				answer: 'Grounding är enkla sätt att flytta uppmärksamheten till kroppen, omgivningen och det som är här och nu.'
			},
			{
				question: 'När kan grounding vara hjälpsamt?',
				answer: 'Det kan hjälpa vid överstärkt aktivering, flashbacks, dissociation eller när du känner att du tappar fotfästet.'
			},
			{
				question: 'Måste jag göra det perfekt för att det ska fungera?',
				answer: 'Nej, det viktiga är inte att göra ratt utan att försiktigt hitta något som gör dig lite mer närvarande.'
			},
			{
				question: 'Vad är ett enkelt exempel?',
				answer: 'Att nämna fem saker du ser, känna fotterna mot golvet eller hålla i ett föremål kan vara en enkel början.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider/trauma/trygghet'
			},
			{
				title: 'Vad händer i nervsystemet vid trauma - fight, flight och freeze',
				href: '/guider/trauma/nervsystemet-och-trauma'
			},
			{
				title: 'Undvikande efter trauma - varför vi gör det och vad det kostar',
				href: '/guider/trauma/undvikande-efter-trauma'
			}
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'undvikande-efter-trauma',
		title: 'Undvikande efter trauma - varför vi gör det och vad det kostar',
		description: 'Om hur undvikande kan skydda på kort sikt men samtidigt göra livet mindre med tiden.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför undviker jag vissa platser eller situationer?',
				answer: 'Undvikande är ofta ett sätt att minska risken att triggas eller överväldigas igen.'
			},
			{
				question: 'Är undvikande alltid fel?',
				answer: 'Nej, det kan vara ett första skydd. Problemet uppstår när det börjar styra allt mer av vardagen.'
			},
			{
				question: 'Hur kan undvikande påverka livet på sikt?',
				answer: 'Det kan göra livet mindre, skapa isolering och hålla rädsla vid liv eftersom kroppen aldrig för erfara att allt inte är farligt.'
			},
			{
				question: 'Vad kan vara ett varsamt nästa steg?',
				answer: 'Att först lägga märke till vad du undviker och varför kan vara ett viktigt steg innan du provar någon liten förändring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla övningar för att landa i kroppen igen',
				href: '/guider/trauma/grounding-ovningar'
			},
			{
				title: 'Tillit och trygghet i relationer efter svara upplevelser',
				href: '/guider/trauma/tillit-efter-trauma'
			}
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'tillit-efter-trauma',
		title: 'Tillit och trygghet i relationer efter svara upplevelser',
		description: 'Om hur trauma kan påverka närhet, tillit och känslan av trygghet med andra.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför är det svårt att lita på andra efter trauma?',
				answer: 'Svara upplevelser kan göra att nervsystemet blir mer vaksamt, också i relationer som egentligen är trygga.'
			},
			{
				question: 'Kan jag vilja ha närhet men samtidigt dra mig undan?',
				answer: 'Ja, det är vanligt att längta efter kontakt och samtidigt känna att den blir för utsatt eller överväldigar.'
			},
			{
				question: 'Hur bygger man upp tillit igen?',
				answer: 'Ofta i små steg, genom förutsägbarhet, tydliga gränser och erfarenheter av att bli mottagen utan press.'
			},
			{
				question: 'Är det konstigt om gamla reaktioner kommer tillbaka i relationer?',
				answer: 'Nej, relationer kan vacka gamla skyddsreaktioner, sarskilt om du tidigare blivit sarad eller otrygg med andra.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider/trauma/trygghet'
			},
			{
				title: 'Undvikande efter trauma - varför vi gör det och vad det kostar',
				href: '/guider/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Grounding - enkla övningar för att landa i kroppen igen',
				href: '/guider/trauma/grounding-ovningar'
			}
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'orsaker',
		title: 'Varför kan jag inte sova',
		description: 'Vanliga orsaker till sömnproblem och vad som håller hjärnan vaken på natten.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför kan jag inte somna trots att jag är trott?',
				answer: 'Hjärnan kan vara i hög beredskap på grund av stress, oro eller obearbetade tankar som aktiverar nervsystemet.'
			},
			{
				question: 'Är sömnproblem ett tecken på någonting allvarligt?',
				answer: 'Inte alltid, men långvariga sömnproblem kan vara kopplade till ångest, depression eller stress som förtjänar uppmärksamhet.'
			},
			{
				question: 'Kan man tranas upp till battre sömn?',
				answer: 'Ja, sömn påverkas av vanor, kanslobearbetning och trygghetskänsla – alla saker som kan förändra med tid och stöd.'
			},
			{
				question: 'Hjälper det att prata om det som oroar en?',
				answer: 'Ofta ja. Att sätta ord på oron kan minska den mentala aktiveringen och göra det lättare att slappna av.'
			}
		],
		relatedArticles: [
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider/sovproblem/stress-och-somn'
			},
			{
				title: 'Ältande på kvällen – varför tankarna blir starkare i sängen',
				href: '/guider/sovproblem/altande-pa-kvallen'
			},
			{
				title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget',
				href: '/guider/sovproblem/trott-men-uppvarvad'
			},
			{
				title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet',
				href: '/guider/sovproblem/somnbrist-och-maendet'
			}
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'stress-och-somn',
		title: 'Stress och sömn – när kroppen inte kan varva ner',
		description: 'Om hur stress kan hålla kroppen i beredskap och göra det svårt att komma till ro på kvällen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför blir sömnen svårare när jag är stressad?',
				answer: 'Stress aktiverar nervsystemet och gör att kroppen stannar i hög beredskap trots att du egentligen behöver vila.'
			},
			{
				question: 'Kan kroppen vara trött men ändå inte slappna av?',
				answer: 'Ja, det är vanligt att vara utmattad men samtidigt uppvarvad när belastningen har varit hög under lång tid.'
			},
			{
				question: 'Hjälper det att försöka tvinga fram sömn?',
				answer: 'Ofta inte. Press och kamp med sömnen kan i stället öka stressen och göra insomnandet ännu svårare.'
			},
			{
				question: 'Vad kan vara ett första steg?',
				answer: 'Att lägga märke till stresspåslaget, sakta ner tempot och ge kroppen en tydlig övergång mellan dag och natt kan vara en bra början.'
			}
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'altande-pa-kvallen',
		title: 'Ältande på kvällen – varför tankarna blir starkare i sängen',
		description: 'Om varför tankar ofta tar mer plats på kvällen och hur ältande kan hålla dig vaken.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför börjar jag tänka mer just när jag lägger mig?',
				answer: 'När det blir tyst omkring dig för hjärnan mer utrymme, och oro eller obearbetade intryck kan bli tydligare.'
			},
			{
				question: 'Är ältande samma sak som problemlösning?',
				answer: 'Inte riktigt. Ältande känns ofta som att tankarna går i cirklar utan att leda till ett tydligt svar eller beslut.'
			},
			{
				question: 'Kan kvällsoro göra att jag somnar senare?',
				answer: 'Ja, mental aktivering på kvällen kan göra det svårare att komma ner i ro och släppa taget om dagen.'
			},
			{
				question: 'Vad kan hjälpa när tankarna snurrar i sängen?',
				answer: 'Det kan hjälpa att sätta ord på tankarna tidigare på kvällen eller använda en lugn rutin som markerar att dagen är slut.'
			}
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'trott-men-uppvarvad',
		title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget',
		description: 'Om den vanliga konflikten mellan trött kropp och överaktiv hjärna vid sömnproblem.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Hur kan jag vara trott men ändå inte kunna somna?',
				answer: 'Det händer när kroppen behöver vila men hjärnan fortfarande är aktiv av stress, oro eller överstimulering.'
			},
			{
				question: 'Är det vanligt att känna sig rastlös på kvällen?',
				answer: 'Ja, många beskriver en rastlös eller spänd känsla trots att de är helt slut i kroppen.'
			},
			{
				question: 'Betyder det har att något är fel på mig?',
				answer: 'Inte nödvändigtvis. Det är ofta en reaktion på belastning, hög anspänning eller att nervsystemet inte har hunnit varva ner.'
			},
			{
				question: 'Vad kan minska den har känslan?',
				answer: 'Lugna övergångar, mindre press kring sömnen och regelbundna stunder för återhämtning under dagen kan göra skillnad över tid.'
			}
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'somnbrist-och-maendet',
		title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet',
		description: 'Om hur för lite sömn kan påverka känsloläget, tankarna och orken i vardagen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Kan sömnbrist göra mig mer orolig?',
				answer: 'Ja, för lite sömn kan göra nervsystemet mer känsligt och det kan bli svårare att hantera oro och stress.'
			},
			{
				question: 'Varför blir jag lättare irriterad när jag sovit dåligt?',
				answer: 'När du har sömnbrist för hjärnan svårare att reglera känslor, vilket kan göra att små saker känns storre an de brukar.'
			},
			{
				question: 'Kan dålig sömn hanga ihop med nedstämdhet?',
				answer: 'Ja, sömn och mående påverkar varandra starkt och långvariga sömnproblem kan bidra till nedstämdhet eller förvärra den.'
			},
			{
				question: 'När bör jag ta hjälp för både sömn och mående?',
				answer: 'Om sömnbristen pågått ett tag och samtidigt påverkar hur du mår, fungerar eller orkar i vardagen är det klokt att soka stöd.'
			}
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'lag-sjalvkansla',
		title: 'Låg självkänsla – vad det är och var det kommer ifrån',
		description: 'Om vad låg självkänsla innebär, hur den uppstår och hur du kan börja utforska förhållandena till dig själv.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Vad är skillnaden mellan självkänsla och självförtroende?',
				answer: 'Självkänsla handlar om känslan av att vara tillräcklig som person. Självförtroende handlar mer om tron på sin förmåga i specifika situationer.'
			},
			{
				question: 'Kan låg självkänsla förändra sig?',
				answer: 'Ja. Självkänsla är inte fast – den påverkas av erfarenheter, relationer och hur vi bearbetar dem över tid.'
			},
			{
				question: 'Varför är det svårt att ta emot berom?',
				answer: 'Vid låg självkänsla stammer inte berom överens med den inre bilden av sig själv, och hjärnan tenderar att avfärda det som oarligt.'
			},
			{
				question: 'Hur börjar man arbeta med självkänsla?',
				answer: 'Ofta genom att bli medveten om den inre rosta – hur du pratar med dig själv – och börja utforska varifraN den restan kom.'
			}
		],
		relatedArticles: [
			{
				title: 'Den inre kritikern – varför rösten finns och vad den egentligen vill',
				href: '/guider/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Perfektionism och självkänsla – när ingenting känns tillräckligt bra',
				href: '/guider/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Att sätta gränser när självkänslan är låg – varför det är svårt',
				href: '/guider/sjalvkansla/gransen-och-sjalvkansla'
			},
			{
				title: 'Jämförelseträsket – sociala medier och din självbild',
				href: '/guider/sjalvkansla/jamforelse-och-sjalvbild'
			}
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'inre-kritikern',
		title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
		description: 'Om den självkritiska rosten, var den kan komma fran och hur du kan förstå den utan att styras av den.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför är jag sa hård mot mig själv?',
				answer: 'Den inre kritikern utvecklas ofta som ett sätt att försöka skydda dig fran misstag, avvisande eller skam.'
			},
			{
				question: 'Betyder självkritik att jag är lat eller svag?',
				answer: 'Nej, stark självkritik är ofta ett tecken på hög press och gamla sätt att hantera otrygghet.'
			},
			{
				question: 'Kan den inre kritikern ha en funktion?',
				answer: 'Ja, den försöker ofta hjälpa genom kontroll, men den gör det på ett sätt som kan bli hart och nedbrytande.'
			},
			{
				question: 'Hur kan jag börja förändra den rosten?',
				answer: 'Ett första steg är att lägga märke till tonen och orden, sa att du kan skilja rosten fran det du faktiskt behöver.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och självkänsla - när ingenting känns tillräckligt bra',
				href: '/guider/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/depression/nedstamdhet-och-relationer'
			}
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'perfektionism-och-sjalvkansla',
		title: 'Perfektionism och självkänsla - när ingenting känns tillräckligt bra',
		description: 'Om hur perfektionism och låg självkänsla ofta hänger ihop och skapar hård press inifrån.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför blir jag aldrig nojd med det jag gör?',
				answer: 'När självkänslan är skör blir prestation ibland ett sätt att försöka känna sig tillräcklig, men ribban flyttas hela tiden.'
			},
			{
				question: 'Är perfektionism ett tecken på ambition?',
				answer: 'Ibland, men det kan också handla om rädsla för kritik, misslyckande eller att inte duga.'
			},
			{
				question: 'Hur påverkar perfektionism måendet?',
				answer: 'Den kan skapa stress, självkritik och känslan av att du måste prestera för att f? vila eller känna dig okej.'
			},
			{
				question: 'Vad kan hjälpa',
				answer: 'Att upptacka dina egna krav och prova mer tillräckligt bra i små situationer kan minska trycket över tid.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
				href: '/guider/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
				href: '/guider/depression/sma-steg-vid-nedstamdhet'
			}
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'gransen-och-sjalvkansla',
		title: 'Att sätta gränser när självkänslan är låg - varför det är svårt',
		description: 'Om varför gränser ofta blir svårare när du tvivlar på ditt eget varde.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför är det sa svårt att säga nej?',
				answer: 'När självkänslan är låg blir andras reaktioner ofta extra viktiga, och da kan ett nej kännas riskfyllt.'
			},
			{
				question: 'Kan låg självkänsla göra att jag går över mina egna behov?',
				answer: 'Ja, det är vanligt att prioritera andras behov för att undvika skuld, konflikt eller känslan av att vara besvarlig.'
			},
			{
				question: 'Hur marks det att jag saknar gränser?',
				answer: 'Du kanske sager ja fast du inte vill, blir överbelastad eller känner bitterhet efterat utan att riktigt veta varför.'
			},
			{
				question: 'Vad är ett litet första steg?',
				answer: 'Att börja lägga märke till när du egentligen vill dra en gräns kan vara ett viktigt steg innan du uttrycker den hogt.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
				href: '/guider/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/depression/nedstamdhet-och-relationer'
			}
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'jamforelse-och-sjalvbild',
		title: 'Jämförelsetrasket - sociala medier och din självbild',
		description: 'Om hur jämförelser med andra kan påverka självbilden och förstärka känslan av att inte racka till.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför påverkas jag sa mycket av andras liv online?',
				answer: 'Sociala medier visar ofta utvalda delar av andras liv, och hjärnan jämför dem lätt med dina minst glansiga stunder.'
			},
			{
				question: 'Kan jämförelser sanka självkänslan?',
				answer: 'Ja, sarskilt om du redan tvivlar på ditt eget varde eller ofta letar efter tecken på att andra lyckas battre.'
			},
			{
				question: 'Är lösningen att sluta helt med sociala medier?',
				answer: 'Inte alltid, men det kan hjälpa att lägga märke till vad som triggar jämförelser och skapa mer medvetna vanor.'
			},
			{
				question: 'Hur kan jag skydda min självbild?',
				answer: 'Att begränsa det som för dig att ma samre och samtidigt ova på att återvända till ditt eget perspektiv kan göra skillnad.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och självkänsla - när ingenting känns tillräckligt bra',
				href: '/guider/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider/depression/nedstamdhet-och-relationer'
			}
		],
	},

	// === NYA GUIDER: ÅNGEST (10) ===
	{
		pillarSlug: 'angest',
		slug: 'angest-hjalp',
		nextStepTool: 'grounding-5-4-3-2-1',
		title: 'Ångesthjälp – vad du kan göra när ångesten tar tag',
		description: 'Konkreta och varsamma sätt att hantera ångest i vardagen, utan att det behöver bli komplicerat.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad kan jag göra just nu när ångesten är stark?',
				answer: 'Börja med att bromsa andningen. Andas in i fyra sekunder, håll ett ögonblick och andas ut i sex. Det hjälper nervsystemet att landa.'
			},
			{
				question: 'Varför hjälper det inte att tänka sig ur ångesten?',
				answer: 'Ångest är en kropplig reaktion. Att försöka resonera sig fri fungerar sällan i stunden – kroppen behöver lugnas, inte övertygas.'
			},
			{
				question: 'Är det okej att undvika det som skapar ångest?',
				answer: 'Kortsiktigt kan undvikande ge lättnad, men på sikt håller det ofta ångesten vid liv. Små steg mot det svåra brukar hjälpa mer.'
			},
			{
				question: 'När bör jag söka mer hjälp?',
				answer: 'Om ångesten styr ditt liv, håller dig hemma eller gör att du undviker mer och mer är det ett tecken på att du förtjänar mer stöd.'
			}
		],
		relatedArticles: [
			{ title: 'Tecken på ångest', href: '/guider/angest/tecken' },
			{ title: 'Ångest i kroppen – vad som händer och vad som hjälper', href: '/guider/angest/angest-i-kroppen' },
			{ title: 'Lugna en panikattack – steg för steg', href: '/guider/angest/lugna-en-panikattack' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'panikattack-hjalp',
		title: 'Panikattack – hjälp direkt när kroppen larmar',
		description: 'Vad som händer vid en panikattack och vad du kan göra för att ta dig igenom den.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad är det som händer i kroppen vid en panikattack?',
				answer: 'Kroppens larmsystem slår på fullt, vilket ger hjärtklappning, yrsel, tryck och svårt att andas. Det är obehagligt men inte farligt.'
			},
			{
				question: 'Hur länge varar en panikattack?',
				answer: 'Oftast 5–20 minuter. Kroppen kan inte hålla den intensiteten länge – reaktionen klingar av av sig själv.'
			},
			{
				question: 'Vad hjälper mest när det händer?',
				answer: 'Stanna kvar, bromsa andningen och försök påminna dig om att reaktionen går över. Att springa iväg förstärker ofta rädslan.'
			},
			{
				question: 'Måste jag söka vård om jag haft en panikattack?',
				answer: 'Om det är första gången eller du är osäker kan det vara klokt att kolla med en läkare. Återkommande attacker som styr livet förtjänar stöd.'
			}
		],
		relatedArticles: [
			{ title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det', href: '/guider/angest/panikangest-och-kroppen' },
			{ title: 'Lugna en panikattack – steg för steg', href: '/guider/angest/lugna-en-panikattack' },
			{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider/angest/angest-hjalp' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1-tekniken', href: '/guider/stress/grounding-ovning-vid-stress' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'kan-inte-sluta-tanka',
		nextStepTool: 'sju-fragor-vid-oro',
		title: 'Kan inte sluta tänka – när tankarna bara snurrar',
		description: 'Om hjärnan som inte stänger av och vad du kan göra när tankarna inte ger dig ro.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför kan inte hjärnan bara stänga av?',
				answer: 'Hjärnan försöker lösa problem och förutse risker – men ibland fastnar den i loopar utan att hitta svar. Det är vanligt, inte ett fel på dig.'
			},
			{
				question: 'Hjälper det att försöka tvinga tankarna att sluta?',
				answer: 'Sällan. Ju mer du kämpar mot en tanke, desto starkare kan den bli. Att notera den och låta den vara brukar fungera bättre.'
			},
			{
				question: 'Vad kan jag göra praktiskt just nu?',
				answer: 'Prova att rikta uppmärksamheten mot något konkret – ett föremål du ser, ett ljud, en känsla i kroppen. Det ger tankarna ett avbrott.'
			},
			{
				question: 'Är det ett tecken på ångest?',
				answer: 'Ja, snurrande tankar är ofta en del av ångest eller stress. Det behöver inte vara allvarligt, men det förtjänar att tas på allvar.'
			}
		],
		relatedArticles: [
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' },
			{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider/angest/overtankande-hjalp' },
			{ title: 'När tankarna inte stannar – att hitta ro på kvällen', href: '/guider/angest/nar-tankarna-inte-stannar' },
			{ title: 'Varför orkar jag ingenting? – om utmattning och energibrist', href: '/guider/stress/varfor-orkar-jag-ingenting' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-pa-kvallen',
		nextStepTool: '4-7-8-andning',
		title: 'Varför får jag ångest på kvällen?',
		description: 'Många upplever att ångest blir starkare på kvällen. Här går vi igenom vanliga orsaker, vad som kan hjälpa i stunden och när det kan vara bra att söka mer stöd.',
		content: `Många märker att ångest, oro eller inre stress blir starkare just på kvällen. När dagen saktar ner blir det ofta mindre som distraherar, och då kan tankar, känslor och kroppslig spänning komma ikapp. Det betyder inte att något är fel på dig. För många är kvällsångest en reaktion på stress, trötthet, grubblande eller att kroppen först då får utrymme att känna efter.

**Därför kan ångest kännas värre på kvällen:**

- det blir tystare omkring dig
- kroppen är trött efter dagen
- stress och spänning hinner ikapp
- grubblande får mer plats
- ensamhet eller oro inför nästa dag blir tydligare

## När det blir tyst hörs tankarna mer

Under dagen är hjärnan upptagen med intryck, uppgifter och kontakt med andra. Det finns mycket som håller fokus på plats. Men på kvällen försvinner de yttre distraktionerna – och sådant som legat i bakgrunden under dagen kan plötsligt kännas starkare. Tankar som inte hanns med, oro som skjutits undan eller känslor som inte fått plats dyker ofta upp just när det blir stilla.

Det är inte ett tecken på att du gör något fel. Det är hjärnans sätt att bearbeta det som samlats under dagen – men timingen kan göra det svårt att hantera.

## Kroppen kan vara trött men ändå uppe i varv

Det går att vara helt slutkörd och samtidigt ha ett nervsystem som fortfarande är i högvarv. Kroppen kan signalera trötthet – tunga ögonlock, svaga muskler, brist på energi – medan det inuti pågår en helt annan process. Tryck över bröstet, en klump i magen, rastlöshet i benen eller en känsla av att inte kunna ligga still.

Det beror ofta på att stresshormoner som kortisol inte hinner sjunka tillräckligt snabbt. Kroppen har inte fått signalen att faran är över, även om du intellektuellt vet att allt egentligen är lugnt.

## Grubblande får mer plats på kvällen

Ältande – att gå igenom samma tankar om och om igen utan att komma någonstans – tenderar att bli intensivare på kvällen. Självkritik, oro för morgondagen eller tankar om saker du borde ha gjort annorlunda kan ta över. Kontrolltänkande, där du försöker planera eller förutse allt som kan gå fel, gör ofta att du fastnar djupare i stället för att hitta lugn.

Det handlar sällan om att du "övertänker" av fri vilja. Grubblandet är ofta ett försök att hantera osäkerhet – men det ger sällan den lättnad man hoppas på.

## Ensamhet och känslor kan kännas starkare på kvällen

Tomhet, sorg eller ensamhet kan bli tydligare när dagen tar slut. Kontakten med andra minskar, och tystnaden kan göra att känslor som dolts under vardagens tempo plötsligt blir påtagliga. Det behöver inte betyda att du är mer ensam än andra – men känslan kan ändå vara stark och svår att bära.

Många beskriver det som att allt "landar" på kvällen. Det är inte ovanligt och det säger ingenting om ditt värde.

## Oro inför sömn eller nästa dag kan trigga ångest

Vetskapen om att man borde sova men inte kan det skapar lätt en ond cirkel. Oron för att inte somna gör kroppen mer vaken. Kroppen som är vaken gör det svårare att somna. Och ju längre natten drar ut, desto mer stress byggs upp inför morgondagen.

Det kan också handla om oro för vad nästa dag innebär – möten, krav, sociala situationer eller helt enkelt känslan av att inte orka. Den oron kan i sig räcka för att aktivera ångesten.

## Vad kan hjälpa när kvällsångesten kommer?

Det finns inga snabba lösningar som fungerar för alla, men det finns saker som kan göra kvällen lite lättare:

- **Sänk kraven på kvällen.** Kvällen behöver inte vara produktiv. Att bara vara räcker.
- **Skriv av dig i några minuter.** Att flytta tankarna ur huvudet och ner på papper kan minska deras intensitet. Du behöver inte skriva snyggt eller strukturerat.
- **Minska input en stund.** Skärmar, nyheter och sociala medier kan hålla nervsystemet aktiverat. En kort paus kan göra skillnad.
- **Prova en enkel andningsövning.** Till exempel 4-7-8-andning: andas in i 4 sekunder, håll i 7, andas ut i 8. Det aktiverar kroppens eget lugn.
- **Kort guidad nedvarvning eller meditation.** Även fem minuter kan hjälpa kroppen att förstå att dagen är slut.
- **Påminn dig om att känslan kan vara tillfällig.** Ångest på kvällen känns ofta absolut i stunden – men den brukar se annorlunda ut på morgonen.

## När kan det vara bra att söka mer stöd?

Om kvällsångesten kommer ofta, påverkar din sömn eller vardag på ett sätt som känns svårt att hantera, kan det vara klokt att prata med någon. Det kan vara en vårdcentral, en psykolog eller en stödlinje. Att söka hjälp är inte ett tecken på svaghet – det är ett sätt att ta hand om dig själv.

## Du behöver inte bära kvällen helt själv

Kvällsångest är vanligt. Det betyder inte att du är svag eller att något är trasigt. Det är en reaktion som många delar, och det finns sätt att möta den som inte kräver stora insatser. Börja med det som känns möjligt, i din egen takt.

När det snurrar mycket på kvällen kan det hjälpa att skriva av sig. Börja lugnt och anonymt, i din egen takt.`,
		updatedAt: '2026-03-31',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/hjarna-och-nerver/somn/somnsvarigheter/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Är det vanligt att få ångest på kvällen?',
				answer: 'Ja, mycket vanligt. När dagens intryck avtar får tankar och känslor mer utrymme, vilket gör att ångest ofta blir tydligare på kvällen.'
			},
			{
				question: 'Varför känns ångest värre när jag ska sova?',
				answer: 'Kroppen och hjärnan har färre distraktioner att hålla sig sysselsatta med. Dessutom kan oron för att inte somna i sig skapa mer anspänning.'
			},
			{
				question: 'Kan trötthet göra ångest värre?',
				answer: 'Ja. När kroppen är trött blir nervsystemet ofta mer känsligt, och det kan bli svårare att hantera oro och stress.'
			},
			{
				question: 'Hjälper meditation mot kvällsångest?',
				answer: 'För många kan kort meditation eller guidad nedvarvning hjälpa kroppen att varva ner. Det behöver inte vara långt – redan fem minuter kan göra skillnad.'
			},
			{
				question: 'När bör jag söka hjälp för kvällsångest?',
				answer: 'Om ångesten kommer ofta, påverkar sömn eller vardag mycket eller känns svår att hantera på egen hand, kan det vara klokt att kontakta din vårdcentral eller en psykolog.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest och sömn – varför natten kan bli svårare', href: '/guider/angest/angest-och-somn' },
			{ title: 'Hjälp vid oro på kvällen – vad du kan göra just nu', href: '/guider/angest/hjalp-vid-oro-pa-kvallen' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' },
			{ title: 'Vaknar med ångest – när morgonen börjar tungt', href: '/guider/angest/vaknar-med-angest' },
			{ title: 'Stress och sömn – när kroppen inte kan varva ner', href: '/guider/sovproblem/stress-och-somn' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'hjalp-vid-oro-pa-kvallen',
		nextStepTool: '4-7-8-andning',
		title: 'Hjälp vid oro på kvällen – vad du kan göra just nu',
		description: 'Varför ångesten och oron ofta ökar på kvällen – och tre enkla saker som faktiskt hjälper.',
		content: `## Varför kvällen kan kännas tyngst

Under dagen är hjärnan sysselsatt. Jobb, samtal, uppgifter – det finns hela tiden något att fokusera på. Men när kvällen kommer och det tystnar, tar hjärnan ofta chansen att bearbeta allt som inte hanns med under dagen.

Det är inte ett tecken på svaghet. Det är inte för att du "övertänker". Det är hjärnan som gör sitt jobb – men på fel tid.

## Tre saker som faktiskt hjälper

### 1. Ge tankarna ett ställe att landa

Skriv ner det som snurrar. Inte för att lösa det – bara för att flytta det ur huvudet och ut på papper. Det är förvånansvärt effektivt för att minska cirkelgång.

### 2. Välj EN sak till imorgon

En lång lista av oavklarade saker är en av de vanligaste orsakerna till kvällsoro. Ta listan och välj ut en sak. Resten får vänta. Det hjälper hjärnan att "stänga av" för natten.

### 3. Prova 4-7-8-andning

Andas in i 4 sekunder. Håll andan i 7 sekunder. Andas ut i 8 sekunder. Gör det tre gånger. Tekniken aktiverar det parasympatiska nervsystemet och signalerar till kroppen att det är tryggt att slappna av.

## När oron inte ger med sig

Om oro på kvällen är ett mönster som pågår, kan det vara värt att se om det finns ett underliggande tema – som oro för framtiden, relationsstress, eller en känsla av att inte räcka till. Att skriva om det i dagboken kan hjälpa dig hitta mönstret.

Om oron börjar påverka sömnen regelbundet är det ett tecken på att du förtjänar mer stöd.`,
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför blir oron värre på kvällen?',
				answer: 'Under dagen håller intryck och uppgifter tankarna sysselsatta. På kvällen, när det tystnar, får hjärnan utrymme att bearbeta det som samlats upp under dagen – vilket kan kännas som att oron "exploderar".'
			},
			{
				question: 'Vad är 4-7-8-andning?',
				answer: 'En andningsteknik där du andas in 4 sekunder, håller 7, och andas ut 8. Det aktiverar det lugnande nervsystemet och kan snabbt minska stressnivån.'
			},
			{
				question: 'Hjälper det att skriva ner tankarna?',
				answer: 'Ja – att skriva ner orostankar minskar deras grepp. Det kallas "cognitive offloading" och hjälper hjärnan att inte behöva hålla kvar allt aktivt.'
			},
			{
				question: 'När ska jag söka hjälp för kvällsoro?',
				answer: 'Om oro på kvällen är ett återkommande mönster som påverkar sömnen eller livskvaliteten – ta kontakt med din vårdcentral eller en psykolog.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider/angest/angest-pa-kvallen' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider/sovproblem/nattlig-oro' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'vaknar-med-angest',
		title: 'Vaknar med ångest – när morgonen börjar tungt',
		description: 'Om att vakna med ångest, klump i magen eller oro – och hur du kan börja dagen på ett lugnare sätt.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför känns ångesten värst på morgonen?',
				answer: 'Stresshormonet kortisol toppar tidigt på morgonen. För den som redan bär på oro kan det skapa en stark ångestkänsla direkt vid uppvaknandet.'
			},
			{
				question: 'Är det farligt att vakna med ångest?',
				answer: 'Inte farligt, men det är ett tecken på att kroppen och sinnet behöver mer stöd. Det förtjänar att tas på allvar.'
			},
			{
				question: 'Vad kan jag göra direkt när jag vaknar?',
				answer: 'Ligg still en stund. Lägg handen på magen och andas lugnt. Undvik att direkt kolla telefonen – ge kroppen en chans att landa.'
			},
			{
				question: 'Kan detta bero på dålig sömn?',
				answer: 'Ja, sömnbrist och ytlig sömn kan göra nervsystemet mer känsligt och förstärka morgonångesten. De hänger ofta ihop.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest och sömn – varför natten kan bli svårare', href: '/guider/angest/angest-och-somn' },
			{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider/angest/angest-hjalp' },
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider/stress/stressymtom' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'oro-i-kroppen',
		title: 'Oro i kroppen – när ångesten sitter fysiskt',
		description: 'Om hur oro och ångest kan visa sig som spänningar, tryck och obehag i kroppen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Var i kroppen kan ångesten sitta?',
				answer: 'Vanliga ställen är bröst, mage, hals, axlar och käke. Kroppen spänner sig när nervsystemet aktiveras av oro.'
			},
			{
				question: 'Kan kroppsliga symptom vara oro och inte sjukdom?',
				answer: 'Ja, ofta. Men om du är osäker är det alltid bra att kolla med en läkare för att utesluta fysiska orsaker.'
			},
			{
				question: 'Vad kan hjälpa kroppen att slappna av?',
				answer: 'Djupandning, rörelse, värme och medveten muskelavslappning kan alla signalera till nervsystemet att det är tryggt att vila.'
			},
			{
				question: 'Försvinner de kroppsliga symptomen om jag hanterar oron?',
				answer: 'Ofta ja. Kropp och sinne hänger ihop – när oron minskar brukar de fysiska reaktionerna också klinga av.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest i kroppen – vad som händer och vad som hjälper', href: '/guider/angest/angest-i-kroppen' },
			{ title: 'Tecken på ångest', href: '/guider/angest/tecken' },
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider/stress/stressymtom' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'lugna-en-panikattack',
		title: 'Lugna en panikattack – steg för steg',
		description: 'Enkla och beprövade sätt att ta sig igenom en panikattack och hjälpa kroppen att landa.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad är det första jag ska göra?',
				answer: 'Stanna kvar om det är säkert. Börja andas långsamt – in genom näsan i 4 sekunder, ut genom munnen i 6. Det bromsar larmsystemet.'
			},
			{
				question: 'Ska jag andas i en papperspåse?',
				answer: 'Det gamla rådet om papperspåsar rekommenderas inte längre. Fokusera i stället på lång, lugn utandning.'
			},
			{
				question: 'Vad hjälper om andningen inte fungerar?',
				answer: 'Prova 5-4-3-2-1: nämn 5 saker du ser, 4 du hör, 3 du kan ta på, 2 du luktar, 1 du smakar. Det för uppmärksamheten till nuet.'
			},
			{
				question: 'Hur lång tid tar det att bli bättre?',
				answer: 'En panikattack klingar oftast av inom 10–20 minuter, även utan att du gör något. Du tar dig igenom det.'
			}
		],
		relatedArticles: [
			{ title: 'Panikattack – hjälp direkt när kroppen larmar', href: '/guider/angest/panikattack-hjalp' },
			{ title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det', href: '/guider/angest/panikangest-och-kroppen' },
			{ title: 'Ångest i kroppen – vad som händer och vad som hjälper', href: '/guider/angest/angest-i-kroppen' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-i-kroppen',
		title: 'Ångest i kroppen – vad som händer och vad som hjälper',
		description: 'En förklaring av varför ångest ger kroppsliga reaktioner och hur du kan hjälpa kroppen att lugna ner sig.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför ger ångest fysiska reaktioner?',
				answer: 'Hjärnan tolkar hotet som verkligt och aktiverar kamp-flykt-systemet. Det påverkar hjärta, lungor, muskler och mage.'
			},
			{
				question: 'Kan ångest ge smärta?',
				answer: 'Ja, spänningshuvudvärk, magont, bröstsmärta och muskelvärk kan alla ha stress och ångest som delorsak.'
			},
			{
				question: 'Är det farligt att ha hjärtklappning av ångest?',
				answer: 'Ångestutlöst hjärtklappning är i sig ofarligt. Men om du är osäker bör du kontrollera hjärtat hos en läkare.'
			},
			{
				question: 'Hur hjälper jag kroppen att landa?',
				answer: 'Lång utandning, kyla mot ansiktet, rörelse och medveten avspänning skickar alla signaler till nervsystemet om att det är tryggt.'
			}
		],
		relatedArticles: [
			{ title: 'Oro i kroppen – när ångesten sitter fysiskt', href: '/guider/angest/oro-i-kroppen' },
			{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider/angest/angest-hjalp' },
			{ title: 'Tecken på ångest', href: '/guider/angest/tecken' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1-tekniken', href: '/guider/stress/grounding-ovning-vid-stress' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'overtankande-hjalp',
		title: 'Övertänkande – hjälp när hjärnan kör på för högt varv',
		description: 'Om övertänkande, varför det händer och hur du kan skapa mer ro utan att stänga av hjärnan helt.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Vad är övertänkande egentligen?',
				answer: 'Det handlar om att hjärnan analyserar, grubblar eller planerar långt mer än situationen kräver – ofta utan att komma till ett svar.'
			},
			{
				question: 'Är det ett tecken på ångest?',
				answer: 'Ofta ja. Övertänkande är ett vanligt sätt för hjärnan att försöka hantera osäkerhet och oro.'
			},
			{
				question: 'Kan övertänkande faktiskt lösa problem?',
				answer: 'Ibland, men ofta fastnar hjärnan i loopar utan att komma vidare. Att sätta en tidsgräns för grubblandet kan hjälpa.'
			},
			{
				question: 'Vad kan bryta mönstret?',
				answer: 'Fysisk rörelse, att skriva ner tankarna eller att engagera sig i något konkret kan ge hjärnan en paus från cirkeltänkandet.'
			}
		],
		relatedArticles: [
			{ title: 'Kan inte sluta tänka – när tankarna bara snurrar', href: '/guider/angest/kan-inte-sluta-tanka' },
			{ title: 'När tankarna inte stannar – att hitta ro på kvällen', href: '/guider/angest/nar-tankarna-inte-stannar' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'nar-tankarna-inte-stannar',
		title: 'När tankarna inte stannar – att hitta ro på kvällen',
		description: 'Om varför kvällen kan fyllas av tankar och hur du kan skapa mer ro inför sömnen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför är det svårast att stänga av på kvällen?',
				answer: 'Utan dagens intryck att fokusera på får hjärnan plötsligt tid att bearbeta det som legat och väntade. Tankarna fyller ut tystnaden.'
			},
			{
				question: 'Hjälper det att tvinga sig att inte tänka?',
				answer: 'Sällan. Att kämpa mot tankar gör dem ofta starkare. Att i stället ge dem ett specifikt utrymme – t.ex. en orosstund tidigare på kvällen – kan fungera bättre.'
			},
			{
				question: 'Vad är en orosstund?',
				answer: 'En avsatt tid på 15–20 minuter tidigare på kvällen då du aktivt tänker igenom det som oroar. Utanför den tiden skjuter du upp grubblandet.'
			},
			{
				question: 'Vad mer kan hjälpa?',
				answer: 'Att skriva ner tankar i en dagbok, ha en lugn nedvarvningsrutin och undvika stimulerande innehåll nära läggdags.'
			}
		],
		relatedArticles: [
			{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider/angest/overtankande-hjalp' },
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider/angest/angest-pa-kvallen' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider/sovproblem/nattlig-oro' }
		],
	},

	// === NYA GUIDER: STRESS (8) ===
	{
		pillarSlug: 'stress',
		slug: 'tecken-pa-mental-overbelastning',
		nextStepTool: 'grounding-5-4-3-2-1',
		title: 'Tecken på mental överbelastning – när kroppen och hjärnan säger ifrån',
		description: 'Hur vet man att man är mentalt överbelastad? Vanliga tecken som är lätta att missa – och vad du kan göra redan idag.',
		content: `## Det märks inte alltid direkt

Mental överbelastning smyger sig på. Det händer sällan med en enda stor händelse – det är snarare summan av allt som samlats under lång tid. Många bär på det i månader innan de ens sätter ord på det.

Att inte märka det tidigt är inte ett tecken på bristande självkännedom. Det är ett tecken på att du anpassat dig – kanske för länge.

## Vanliga tecken att känna igen

### Irritation som dyker upp oväntat
Saker som normalt inte stör dig börjar reta dig. Du reagerar starkare än situationen motiverar. Det är inte temperament – det är ett nervsystem som är fulladdat och har tröttnat på att hålla masken.

### Koncentrationssvårigheter
Du börjar en sak, tappar tråden, byter uppgift. Svårt att slutföra. Svårt att hålla fokus. Hjärnan är för trött för att hålla kvar uppmärksamheten.

### Trötthet som inte går över
Du sover men vaknar inte utvilad. Kaffet hjälper inte. Det är inte brist på sömn – det är att hjärnan aldrig riktigt återhämtar sig mellan varven.

### Ljud, krav och intryck känns för mycket
Barnens röster, notifikationer, frågor på jobbet – allt verkar för högt, för mycket, för nu. Det är hjärnan som sänkt sin toleransgräns för att den redan är full.

### Svårt att varva ner
Du kan ligga i sängen men hjärnan fortsätter snurra. Du kan vara ledig men kan inte koppla av. Kroppen är stilla, hjärnan är inte det.

### Kroppen spänner sig
Käkspänning, axlar uppe vid öronen, tungt bröst, magknip. Kroppen bär det som sinnet inte hinner bearbeta.

## Varför det händer

Överbelastning uppstår när kraven – externa eller interna – överstiger möjligheterna till återhämtning under tillräckligt lång tid.

Det kan bero på:
- **Långvarig stress** utan tillräckliga pauser
- **För lite djup återhämtning** (inte bara passiv vila)
- **För många intryck och beslut** per dag
- **Höga inre krav** – att alltid prestera, aldrig be om hjälp, alltid finnas till
- **Sömnbrist** som ackumulerats under lång tid

Det är inte svaghet. Det är fysiologi.

## Vad du kan göra i små steg

Du behöver inte göra om allt. Du behöver börja med att sänka tempot, inte höja det.

**Välj bort något aktivt.** Ta bort ett åtagande från veckan – inte för att du "ska" utan för att du behöver. Det är inte att svika, det är att vara hållbar.

**Rör kroppen lugnt.** En kort promenad utan telefon aktiverar återhämtningssystemet. Det behöver inte vara träning.

**Grounding när det kokar till.** 5-4-3-2-1-tekniken är ett enkelt sätt att bryta ett överväldigat tillstånd direkt. Fem saker du ser, fyra du hör – hjärnan tvingas landa i nuet.

**Skriv av dig.** Att skriva ner vad som tynger – utan att behöva lösa det – minskar den kognitiva bördan. Dagboken är ett bra ställe att börja.

**Vila utan krav.** Du behöver inte förtjäna vila. Återhämtning är inte belöning – det är förutsättning.

## När du bör söka mer stöd

Om tecknen ovan har pågått i flera veckor och börjar påverka din vardag, relationer eller arbetsförmåga – ta kontakt med din vårdcentral. Utmattning är en medicinsk tillstånd som det finns hjälp för.

Du behöver inte ha nått botten för att det ska vara okej att be om hjälp.`,
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vad är skillnaden mellan vanlig trötthet och mental överbelastning?',
				answer: 'Vanlig trötthet går över med sömn och vila. Mental överbelastning gör det inte – du vaknar fortfarande trött, har svårt att koncentrera dig och känner irritation eller tomhet trots vila.'
			},
			{
				question: 'Kan man vara mentalt överbelastad utan att inse det?',
				answer: 'Ja – det är vanligt. Många anpassar sig gradvis och vänjer sig vid sin nya "normalnivå". Det är ofta först när man bromsar upp, eller när kroppen tvingar till stopp, som man inser hur länge det pågått.'
			},
			{
				question: 'Hur skiljer sig mental överbelastning från depression?',
				answer: 'Det kan överlappa, men mental överbelastning är ofta mer kopplad till yttre krav och brist på återhämtning. Depression kan ha djupare och mer ihållande orsaker. Om du är osäker – prata med en läkare.'
			},
			{
				question: 'Vad är det första jag ska göra om jag känner igen mig?',
				answer: 'Börja med att sänka tempot och välja bort något. Det låter enkelt men är ofta det svåraste. Du kan också börja med en enkel grounding-övning för att hjälpa nervsystemet landa.'
			}
		],
		relatedArticles: [
			{ title: 'Varför orkar jag ingenting? – när energin tar slut', href: '/guider/stress/varfor-orkar-jag-ingenting' },
			{ title: 'Stressymtom – så märker du att kroppen är under press', href: '/guider/stress/stressymtom' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1', href: '/guider/stress/grounding-ovning-vid-stress' },
			{ title: 'Hur återhämtar man sig mentalt?', href: '/guider/stress/hur-aterhamtar-man-sig-mentalt' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'stressymtom',
		nextStepTool: 'body-scan',
		title: 'Stressymtom – tecken på att kroppen bär för mycket',
		description: 'Vanliga tecken på stress i kropp och sinne, och vad de kan betyda för dig.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vilka är de vanligaste stressymtomen?',
				answer: 'Huvudvärk, sömnproblem, koncentrationssvårigheter, irritabilitet, spänningar i nacke och axlar samt magbesvär är alla vanliga tecken på stress.'
			},
			{
				question: 'Kan stress ge fysiska symptom utan att jag känner mig stressad?',
				answer: 'Ja. Kroppen kan reagera på stress länge innan du själv uppmärksammar den. Kronisk låggradig stress är vanlig och kan gå obemärkt.'
			},
			{
				question: 'Hur vet jag om det är stress eller sjukdom?',
				answer: 'Om symptomen dyker upp i perioder av hög belastning och minskar när du vilar kan det peka på stress. Vid osäkerhet är det bra att kontakta vården.'
			},
			{
				question: 'Vad är ett första steg att ta?',
				answer: 'Att börja notera vad som tar energi och vad som ger energi är ett enkelt men kraftfullt första steg.'
			}
		],
		relatedArticles: [
			{ title: 'Inre stress – när det är stressigt inombords trots lugn yta', href: '/guider/stress/inre-stress' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider/stress/stressad-hela-tiden' },
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider/stress/utmattad-mentalt' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1-tekniken', href: '/guider/stress/grounding-ovning-vid-stress' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'inre-stress',
		title: 'Inre stress – när det är stressigt inombords trots lugn yta',
		description: 'Om inre stress som inte alltid syns utåt men sliter på kropp och sinne på djupet.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vad är inre stress?',
				answer: 'Det är stress som drivs av tankar, krav och förväntningar inifrån – inte nödvändigtvis av yttre händelser. Man kan se lugn ut men vara i konstant alarmberedskap.'
			},
			{
				question: 'Varför märker inte omgivningen att jag är stressad?',
				answer: 'Inre stress syns inte alltid utåt. Många lär sig att fungera trots hög inre belastning, vilket kan göra det svårare att få förståelse och stöd.'
			},
			{
				question: 'Vilka tecken brukar finnas?',
				answer: 'Svårt att koppla bort tankar, känsla av aldrig vara klar, sömnproblem trots trötthet, irritabilitet och känsla av att alltid behöva prestera.'
			},
			{
				question: 'Vad kan hjälpa?',
				answer: 'Att lära sig känna igen de inre kravens röst och öva på att möta sig själv lite mjukare är ett viktigt första steg.'
			}
		],
		relatedArticles: [
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider/stress/stressymtom' },
			{ title: 'Känner mig överväldigad – när allt är för mycket', href: '/guider/stress/kanner-mig-overvaldigad' },
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider/stress/kan-inte-varva-ner' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'hjarntrotthet-hjalp',
		nextStepTool: 'body-scan',
		title: 'Hjärntrötthet – när hjärnan inte orkar bearbeta mer',
		description: 'Om kognitiv utmattning och hjärntrötthet – vad det är, varför det händer och hur du kan börja återhämta dig.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vad är hjärntrötthet?',
				answer: 'Hjärntrötthet innebär att hjärnans förmåga att bearbeta information, fatta beslut och hålla fokus är kraftigt nedsatt efter lång tids hög belastning.'
			},
			{
				question: 'Hur skiljer sig hjärntrötthet från vanlig trötthet?',
				answer: 'Vanlig trötthet går över med sömn. Hjärntrötthet sitter kvar och kan förvärras av intryck, ljud och krav – även efter vila.'
			},
			{
				question: 'Vad är tecknen på hjärntrötthet?',
				answer: 'Svårt att läsa, koncentrera sig, komma ihåg saker, ta beslut och hantera flera saker samtidigt. Känslighet för ljud och ljus är vanligt.'
			},
			{
				question: 'Hur återhämtar man sig?',
				answer: 'Grunden är lugn och lågstimulerad återhämtning: tystnad, natur, enkla rutiner och att dra ner på krav. Det tar tid men kroppen läker.'
			}
		],
		relatedArticles: [
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider/stress/utmattad-mentalt' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider/stress/stressad-hela-tiden' },
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider/stress/stressymtom' },
			{ title: 'Varför orkar jag ingenting? – om utmattning och energibrist', href: '/guider/stress/varfor-orkar-jag-ingenting' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'kanner-mig-overvaldigad',
		nextStepTool: 'grounding',
		title: 'Känner mig överväldigad – när allt är för mycket',
		description: 'Om känslan av att allt staplas på hög och vad du kan göra när livet känns övermäktigt.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Varför känner jag mig överväldigad?',
				answer: 'Det händer när krav, intryck eller känslor överstiger vad du för stunden klarar av att hantera. Det är inte ett tecken på svaghet.'
			},
			{
				question: 'Vad gör jag när allting känns för stort?',
				answer: 'Stanna. Ta ett djupt andetag. Fråga dig vad som är det enda lilla ting du kan göra just nu – inte allt, bara ett.'
			},
			{
				question: 'Är det normalt att vilja gömma sig och inte göra något?',
				answer: 'Ja, väldigt vanligt. Att dra sig undan är en naturlig reaktion när systemet är överbelastat. Det viktiga är att inte fastna där för länge.'
			},
			{
				question: 'När bör jag söka mer stöd?',
				answer: 'Om känslan av överväldigande är konstant och påverkar arbete, relationer eller din förmåga att ta hand om dig själv är det dags att söka hjälp.'
			}
		],
		relatedArticles: [
			{ title: 'Inre stress – när det är stressigt inombords trots lugn yta', href: '/guider/stress/inre-stress' },
			{ title: 'Hjärntrötthet – när hjärnan inte orkar bearbeta mer', href: '/guider/stress/hjarntrotthet-hjalp' },
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider/ensamhet/orkar-ingenting' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'stressad-hela-tiden',
		nextStepTool: 'grounding',
		title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret',
		description: 'Om att leva i konstant stress, vad det gör med kroppen och hur du kan börja skapa mer utrymme.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Är det farligt att vara stressad hela tiden?',
				answer: 'Kronisk stress belastar hjärta, immunförsvar, sömn och psykisk hälsa. Det är inte farligt på kort sikt men allvarligt om det pågår länge.'
			},
			{
				question: 'Varför vänjer man sig vid att vara stressad?',
				answer: 'Hjärnan anpassar sig och stress kan börja kännas normalt. Många märker inte hur belastade de är förrän de faller ihop.'
			},
			{
				question: 'Hur bryter man mönstret?',
				answer: 'Börja med att identifiera de största stressörerna. Vilken av dem kan du påverka? Att ta ett litet steg i rätt riktning räcker som start.'
			},
			{
				question: 'Kan man lära om hjärnan att inte vara stressad?',
				answer: 'Ja, nervsystemet är formbart. Med rätt stöd och återhämtning går det att successivt sänka grundnivån av stress.'
			}
		],
		relatedArticles: [
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider/stress/stressymtom' },
			{ title: 'Inre stress – när det är stressigt inombords trots lugn yta', href: '/guider/stress/inre-stress' },
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider/stress/kan-inte-varva-ner' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'utmattad-mentalt',
		nextStepTool: 'body-scan',
		title: 'Utmattad mentalt – när hjärnan inte orkar mer',
		description: 'Om mental utmattning, vad den skiljer sig från vanlig trötthet och hur återhämtning kan se ut.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Hur vet jag att det är mental utmattning?',
				answer: 'Tecken är att vila inte längre hjälper, att enkla beslut känns omöjliga, att du är emotionellt avflattad och att minnet sviker.'
			},
			{
				question: 'Är utmattning samma sak som utbrändhet?',
				answer: 'Utbrändhet är ett vardagsord för ett tillstånd som inom vården kallas utmattningssyndrom. Mental utmattning kan vara ett förstadium.'
			},
			{
				question: 'Vad hjälper verkligen?',
				answer: 'Grundläggande saker: sömn, lugn, mat, rörelse i lagom mängd och att minska krav. Professionellt stöd är värdefullt vid allvarligare utmattning.'
			},
			{
				question: 'Måste jag bli sjukskriven?',
				answer: 'Inte alltid, men vid utmattningssyndrom är det ofta nödvändigt. Prata med din läkare om hur det ser ut för dig.'
			}
		],
		relatedArticles: [
			{ title: 'Hjärntrötthet – när hjärnan inte orkar bearbeta mer', href: '/guider/stress/hjarntrotthet-hjalp' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider/stress/stressad-hela-tiden' },
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider/ensamhet/orkar-ingenting' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'kan-inte-varva-ner',
		nextStepTool: 'andning-4-7-8',
		title: 'Kan inte varva ner – om stress som sitter kvar i kroppen',
		description: 'Om varför nervsystemet ibland inte kan koppla av och vad du kan göra för att hitta ner i ett lugnare läge.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Varför kan jag inte varva ner trots att jag är trött?',
				answer: 'Nervsystemet fastnar i ett aktiverat läge. Kroppen vet att den behöver vila men larmsystemet har inte fått signalen om att det är tryggt.'
			},
			{
				question: 'Är det dåligt att inte kunna slappna av?',
				answer: 'På sikt ja. Kroppen behöver återhämtning för att fungera. Att aldrig varva ner belastar hjärta, immunförsvar och psyk.'
			},
			{
				question: 'Vad hjälper nervsystemet att lugna ner sig?',
				answer: 'Lång utandning, lugn rörelse, kyla mot ansiktet, natur och regelbundenhet är alla saker som hjälper parasympatiska nervsystemet att ta över.'
			},
			{
				question: 'Hur lång tid tar det att landa?',
				answer: 'Det varierar. Kroppen behöver konsekventa signaler över tid – ett lugnt kvällsmoment hjälper mer om det upprepas än om det görs en gång.'
			}
		],
		relatedArticles: [
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider/stress/stressad-hela-tiden' },
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider/angest/angest-pa-kvallen' },
			{ title: 'Kan inte sova av stress – när kroppen inte ger sig', href: '/guider/sovproblem/kan-inte-sova-stress' },
			{ title: 'Hjälp vid oro på kvällen – vad du kan göra just nu', href: '/guider/angest/hjalp-vid-oro-pa-kvallen' }
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'mycket-tankar-pa-kvallen',
		nextStepTool: 'andning-4-7-8',
		title: 'Mycket tankar på kvällen – när hjärnan inte vill stänga av',
		description: 'Om varför kvällen fylls av tankar och oro, och hur du kan skapa mer ro inför sömnen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Varför exploderar tankarna på kvällen?',
				answer: 'Dagen är full av distraktioner. På kvällen, när det tystnar, får hjärnan plötsligt tid att ta upp allt det den lade åt sidan under dagen.'
			},
			{
				question: 'Är kvällstankar ett tecken på stress?',
				answer: 'Ofta ja. Hjärnan bearbetar det den inte hann med under dagen. Det är inte konstigt, men kan bli utmattande.'
			},
			{
				question: 'Vad kan jag göra för att dämpa det?',
				answer: 'Att skriva ner det du bär på i en dagbok, ha en avsatt "tanketid" tidigare på kvällen och skapa en lugn övergångsritual hjälper hjärnan att landa.'
			},
			{
				question: 'Hjälper telefonen att distrahera mig?',
				answer: 'Inte alltid. Skärmar håller hjärnan aktiv och kan göra det svårare att somna. Lugna aktiviteter utan skärm fungerar bättre för att landa.'
			}
		],
		relatedArticles: [
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider/stress/kan-inte-varva-ner' },
			{ title: 'När tankarna inte stannar – att hitta ro på kvällen', href: '/guider/angest/nar-tankarna-inte-stannar' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider/sovproblem/nattlig-oro' }
		],
	},

	// === NYA GUIDER: ENSAMHET (4) ===
	{
		pillarSlug: 'ensamhet',
		slug: 'kanner-mig-ensam',
		nextStepTool: 'sjalvmedkansla',
		title: 'Känner mig ensam – när ensamheten gör ont',
		description: 'Om ensamhet som inte är ett val och hur du kan börja hitta vägen tillbaka till kontakt.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ensamhet – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/ensamhet/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Kan man vara ensam fast man är omgiven av folk?',
				answer: 'Ja. Ensamhet handlar om brist på meningsfull kontakt, inte om antal människor runt omkring dig. Man kan vara ensam mitt i en folksamling.'
			},
			{
				question: 'Är det konstigt att ensamhet gör fysiskt ont?',
				answer: 'Nej, forskning visar att social smärta aktiverar samma delar av hjärnan som fysisk smärta. Ensamhet är en riktig smärta.'
			},
			{
				question: 'Varför är det svårt att ta första steget?',
				answer: 'Ensamhet kan skapa en känsla av att vara ovälkommen eller att det inte spelar någon roll. Det är en känsla, inte en sanning.'
			},
			{
				question: 'Vad kan ett litet första steg vara?',
				answer: 'Att skicka ett meddelande till någon du inte pratat med på länge, gå på ett event du normalt undviker, eller bara säga hej till grannen.'
			}
		],
		relatedArticles: [
			{ title: 'Ensamhet – hjälp att förstå och hantera känslan', href: '/guider/ensamhet/ensamhet-hjalp' },
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider/ensamhet/orkar-ingenting' },
			{ title: 'Tomhetskänsla – när inget riktigt känns', href: '/guider/ensamhet/tomhetskansla' }
		],
	},
	{
		pillarSlug: 'ensamhet',
		slug: 'ensamhet-hjalp',
		nextStepTool: 'sjalvmedkansla',
		title: 'Ensamhet – hjälp att förstå och hantera känslan',
		description: 'Vad ensamhet egentligen är, varför den uppstår och vad du kan göra för att börja bryta den.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ensamhet – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/ensamhet/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför känner sig så många ensamma?',
				answer: 'Moderna levnadssätt med färre fasta gemenskaper, mer skärmar och mer rörlighet gör det svårare att bygga djupa relationer.'
			},
			{
				question: 'Är ensamhet farligt för hälsan?',
				answer: 'Långvarig ensamhet är kopplad till sämre fysisk och psykisk hälsa. Det är ett folkhälsoproblem som tas på allt större allvar.'
			},
			{
				question: 'Hur börjar man bryta ensamheten?',
				answer: 'Börja med aktiviteter snarare än relationer – gå med i en kurs, en grupp, en förening. Kontakt uppstår naturligt kring gemensamma intressen.'
			},
			{
				question: 'Vad om man inte vet vad man vill göra?',
				answer: 'Börja med att prova. Välj något som verkar okej, inte perfekt. Känslan av tillhörighet byggs upp med tid och upprepning.'
			}
		],
		relatedArticles: [
			{ title: 'Känner mig ensam – när ensamheten gör ont', href: '/guider/ensamhet/kanner-mig-ensam' },
			{ title: 'Tomhetskänsla – när inget riktigt känns', href: '/guider/ensamhet/tomhetskansla' },
			{ title: 'Hur nedstämdhet påverkar relationer och närheten till andra', href: '/guider/depression/nedstamdhet-och-relationer' }
		],
	},
	{
		pillarSlug: 'ensamhet',
		slug: 'orkar-ingenting',
		nextStepTool: 'body-scan',
		title: 'Orkar ingenting – om tomhet och tyngd som inte släpper',
		description: 'När energin tryter och motivationen är borta – vad som kan ligga bakom och vad som faktiskt hjälper.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ensamhet – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/ensamhet/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför orkar jag ingenting?',
				answer: 'Det kan bero på många saker: utmattning, nedstämdhet, ensamhet, stress eller en kombination. Kropp och sinne kommunicerar att de behöver stöd.'
			},
			{
				question: 'Är det lat att inte orka?',
				answer: 'Nej. Att inte orka är ett symptom, inte ett karaktärsdrag. Det finns alltid en orsak bakom – och du förtjänar att få förstå den.'
			},
			{
				question: 'Vad kan jag göra när allt känns tungt?',
				answer: 'Börja med det allra minsta möjliga. Inte listan – bara en sak. Rörelse, frisk luft och kontakt med någon du litar på kan sakta röra på något.'
			},
			{
				question: 'När ska jag söka hjälp?',
				answer: 'Om känslan håller i sig mer än ett par veckor och påverkar vardagen är det ett tecken på att du förtjänar stöd från en professionell.'
			}
		],
		relatedArticles: [
			{ title: 'Trötthet och meningslöshet – när ingenting känns värt att göra', href: '/guider/depression/trotthet-och-meningsloshet' },
			{ title: 'Tomhetskänsla – när inget riktigt känns', href: '/guider/ensamhet/tomhetskansla' },
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider/stress/utmattad-mentalt' },
			{ title: 'Varför orkar jag ingenting? – om utmattning och energibrist', href: '/guider/stress/varfor-orkar-jag-ingenting' }
		],
	},
	{
		pillarSlug: 'ensamhet',
		slug: 'tomhetskansla',
		nextStepTool: 'grounding',
		title: 'Tomhetskänsla – när inget riktigt känns',
		description: 'Om känslan av inre tomhet, vad som kan ligga bakom och hur du kan börja hitta tillbaka till dig själv.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ensamhet – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/ensamhet/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Vad är tomhetskänsla?',
				answer: 'En känsla av att vara avskuren från sig själv och världen, som om livet sker bakom glas. Inget väcker riktigt glädje eller engagemang.'
			},
			{
				question: 'Vad beror tomhetskänsla på?',
				answer: 'Det kan hänga ihop med nedstämdhet, utmattning, ensamhet, trauma eller en känsla av att leva ett liv som inte passar en.'
			},
			{
				question: 'Kan tomhetskänsla gå över?',
				answer: 'Ja, oftast. Men det kräver ofta att man förstår vad som driver den – och ibland behövs professionellt stöd för att komma vidare.'
			},
			{
				question: 'Vad kan ett litet steg vara?',
				answer: 'Att skriva ner vad du saknar i livet just nu – inte vad du borde vilja, utan vad du faktiskt saknar. Det kan ge en riktning.'
			}
		],
		relatedArticles: [
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider/ensamhet/orkar-ingenting' },
			{ title: 'Känner mig ensam – när ensamheten gör ont', href: '/guider/ensamhet/kanner-mig-ensam' },
			{ title: 'Trötthet och meningslöshet – när ingenting känns värt att göra', href: '/guider/depression/trotthet-och-meningsloshet' }
		],
	},

	// === NYA GUIDER: SOVPROBLEM (3) ===
	{
		pillarSlug: 'sovproblem',
		slug: 'kan-inte-sova-stress',
		title: 'Kan inte sova av stress – när kroppen inte ger sig',
		description: 'Om varför stress håller dig vaken och vad du kan göra för att hjälpa kroppen att landa inför sömnen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför hindrar stress mig från att sova?',
				answer: 'Stresshormonet kortisol håller kroppen i ett aktiverat läge. När du vill sova men stressen inte har varvet ner blockeras sömnens signaler.'
			},
			{
				question: 'Hjälper det att ligga kvar i sängen?',
				answer: 'Inte alltid. Om du ligger vaken länge kan sängen kopplas ihop med vakenhet. Det kan hjälpa att gå upp, göra något lugnt och sedan försöka igen.'
			},
			{
				question: 'Vad är bra att göra på kvällen om man är stressad?',
				answer: 'Lugn rörelse, en varm dusch, skriva ner det du bär på och undvika skärmar den sista timmen kan alla hjälpa nervsystemet att skifta läge.'
			},
			{
				question: 'Skapar sömnbrist mer stress?',
				answer: 'Ja. Sömnbrist och stress förstärker varandra i en ond cirkel. Att bryta den cykeln brukar börja med att minska stresskällan, inte bara försöka sova.'
			}
		],
		relatedArticles: [
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider/stress/kan-inte-varva-ner' },
			{ title: 'Svårt att somna av ångest – när oron tar sig in i sängkammaren', href: '/guider/sovproblem/svart-att-somna-angest' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider/stress/stressad-hela-tiden' }
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'svart-att-somna-angest',
		nextStepTool: '4-7-8-andning',
		title: 'Svårt att somna av ångest – när oron tar sig in i sängkammaren',
		description: 'Om kopplingen mellan ångest och sömnsvårigheter och hur du kan göra det lättare att somna.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför ökar ångesten när jag försöker sova?',
				answer: 'Tystnaden och bristen på distraktioner ger ångesten mer utrymme. Kroppen är trött men sinnet håller beredskapen uppe.'
			},
			{
				question: 'Vad hjälper direkt i stunden?',
				answer: 'Djup magandning, progressiv muskelavslappning och att rikta uppmärksamheten mot kroppen snarare än tankarna kan alla hjälpa.'
			},
			{
				question: 'Är sömnmedicin ett alternativ?',
				answer: 'Det kan vara ett kortsiktigt stöd men bör alltid diskuteras med en läkare. Det behandlar inte den underliggande ångesten.'
			},
			{
				question: 'Hur lång tid tar det att förbättra sömnen?',
				answer: 'Det varierar, men med regelbundna sömnrutiner och stöd för ångesten brukar sömnen förbättras gradvis inom några veckor.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest och sömn – varför natten kan bli svårare', href: '/guider/angest/angest-och-somn' },
			{ title: 'Kan inte sova av stress – när kroppen inte ger sig', href: '/guider/sovproblem/kan-inte-sova-stress' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider/sovproblem/nattlig-oro' }
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'nattlig-oro',
		title: 'Nattlig oro – att vakna med tankar som inte ger ro',
		description: 'Om att vakna mitt i natten med oro och tankar, och vad du kan göra för att hitta tillbaka till sömnen.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Sömnsvårigheter – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Sömnen är viktig för hälsan – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför vaknar jag av oro mitt i natten?',
				answer: 'Sömnens lätta faser sker under andra halvan av natten. Oro och stress kan göra att hjärnan aktiveras i dessa faser och inte hittar tillbaka till djupsömn.'
			},
			{
				question: 'Vad ska jag göra när jag vaknar och oroar mig?',
				answer: 'Undvik att kolla klockan. Lägg handen på magen, andas lugnt och försök inte tvinga fram sömnen. Acceptans brukar fungera bättre än kamp.'
			},
			{
				question: 'Ska jag stiga upp om jag inte somnar?',
				answer: 'Om du legat vaken mer än 20 minuter kan det hjälpa att gå upp, göra något mycket lugnt i svagt ljus och sedan försöka igen.'
			},
			{
				question: 'Kan nattlig oro bli kronisk?',
				answer: 'Ja, om man börjar oroa sig för sömnen i sig skapas en ond cirkel. Att bryta kopplingen sängen = oro är ett viktigt steg.'
			}
		],
		relatedArticles: [
			{ title: 'Svårt att somna av ångest – när oron tar sig in i sängkammaren', href: '/guider/sovproblem/svart-att-somna-angest' },
			{ title: 'Kan inte sova av stress – när kroppen inte ger sig', href: '/guider/sovproblem/kan-inte-sova-stress' },
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider/angest/angest-pa-kvallen' },
			{ title: 'Hjälp vid oro på kvällen – vad du kan göra just nu', href: '/guider/angest/hjalp-vid-oro-pa-kvallen' }
		],
	},

	// === NYA GUIDER: SJÄLVKÄNSLA (5) ===
	{
		pillarSlug: 'sjalvkansla',
		slug: 'dalig-sjalvkansla',
		nextStepTool: 'sjalvmedkansla-ovning',
		title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det',
		description: 'Om låg självkänsla, varifrån den kommer och konkreta sätt att börja bygga en mjukare relation till dig själv.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Vad är egentligen dålig självkänsla?',
				answer: 'Det handlar om en djup känsla av att inte duga, inte vara värd kärlek eller respekt – oberoende av vad du presterar.'
			},
			{
				question: 'Var kommer dålig självkänsla ifrån?',
				answer: 'Ofta från tidiga erfarenheter av kritik, otrygga relationer eller miljöer där man inte fick bekräftelse för den man var – snarare än det man gjorde.'
			},
			{
				question: 'Kan dålig självkänsla förändras?',
				answer: 'Ja. Självkänsla är inte fast – den kan förändras med förståelse, tid och en medveten relation till de egna tankarna.'
			},
			{
				question: 'Vad är ett första steg?',
				answer: 'Att börja lägga märke till när den inre kritiska rösten pratar – inte för att tiga den, utan för att förstå att den är en röst, inte en sanning.'
			}
		],
		relatedArticles: [
			{ title: 'Låg självkänsla – vad det är och var det kommer ifrån', href: '/guider/sjalvkansla/lag-sjalvkansla' },
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider/sjalvkansla/sjalvkritiska-tankar' },
			{ title: 'Hur får man bättre självkänsla – ett praktiskt perspektiv', href: '/guider/sjalvkansla/hur-far-man-battre-sjalvkansla' }
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'sjalvkritiska-tankar',
		title: 'Självkritiska tankar – den röst som aldrig är nöjd',
		description: 'Om den inre kritikern, varför den uppstår och hur du kan skapa lite mer frihet från den.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför är jag så hård mot mig själv?',
				answer: 'Den självkritiska rösten uppstår ofta som ett sätt att skydda dig – att kritisera dig själv innan andra gör det. Den vill dig väl, men gör det på fel sätt.'
			},
			{
				question: 'Hjälper det att vara hård mot sig själv?',
				answer: 'Sällan. Forskning visar att självkritik snarare minskar motivation och ökar ångest, medan självmedkänsla leder till mer hållbar förändring.'
			},
			{
				question: 'Hur svarar jag på den självkritiska rösten?',
				answer: 'Börja med att notera den utan att tro på allt den säger. Fråga dig: Hade jag sagt detta till en vän i samma situation?'
			},
			{
				question: 'Kan den förändras?',
				answer: 'Ja, med tid och träning. Rösten brukar inte försvinna helt, men den kan bli mindre dominerande och lättare att se igenom.'
			}
		],
		relatedArticles: [
			{ title: 'Den inre kritikern – varför rösten finns och vad den egentligen vill', href: '/guider/sjalvkansla/inre-kritikern' },
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Känner mig värdelös – om tankar som ljuger om vem du är', href: '/guider/sjalvkansla/kanner-mig-vardelos' }
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'kanner-mig-vardelos',
		title: 'Känner mig värdelös – om tankar som ljuger om vem du är',
		description: 'Om känslan av att inte duga eller vara värd något, och hur du kan börja ifrågasätta de tankarna.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Är tankar om att vara värdelös sanna?',
				answer: 'Nej. Tankar är inte fakta. Känslan av värdelöshet är verklig, men den berättar om ditt mående – inte om din faktiska person.'
			},
			{
				question: 'Varför är det svårt att ta emot komplimanger?',
				answer: 'Den som tror sig vara värdelös avvisar ofta positiv återkoppling för att den inte stämmer med den inre bilden. Det är ett tecken på låg självkänsla, inte ett tecken på att komplimangen är osann.'
			},
			{
				question: 'Vad gör jag om känslan är mycket stark?',
				answer: 'Prata med någon du litar på eller sök professionellt stöd. Starka tankar om värdelöshet förtjänar att tas på allvar och mötas med omsorg.'
			},
			{
				question: 'Finns det ett litet steg?',
				answer: 'Att börja lista tre saker du gjort – hur litet som helst – varje dag kan gradvis börja ändra hjärnans mönster av att se bort från det positiva.'
			}
		],
		relatedArticles: [
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider/sjalvkansla/sjalvkritiska-tankar' },
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Hur får man bättre självkänsla – ett praktiskt perspektiv', href: '/guider/sjalvkansla/hur-far-man-battre-sjalvkansla' }
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'jamfor-mig-med-andra',
		title: 'Jämför mig med andra – när andras liv känns bättre',
		description: 'Om jämförelsetänkandet, varför det skadar självkänslan och hur du kan börja frigöra dig från det.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Varför jämför jag mig hela tiden?',
				answer: 'Jämförelse är ett grundläggande mänskligt beteende – hjärnan söker information om hur vi förhåller oss till gruppen. Men i en tid med sociala medier är det svårt att hantera.'
			},
			{
				question: 'Är jämförelse alltid dåligt?',
				answer: 'Inte alltid. Att se upp till någon kan inspirera. Men om jämförelsen konstant får dig att känna dig mindervärdig är det dags att titta på den.'
			},
			{
				question: 'Hur bryter jag mönstret?',
				answer: 'Lägg märke till när du jämför. Fråga dig: Jämför jag mitt inre med deras yttre? Vad vet jag egentligen om deras verkliga liv?'
			},
			{
				question: 'Vad hjälper på sikt?',
				answer: 'Att flytta fokus från hur du förhåller dig till andra till vad som faktiskt är viktigt för dig – dina värden, inte deras milstolpar.'
			}
		],
		relatedArticles: [
			{ title: 'Jämförelsetrasket – sociala medier och din självbild', href: '/guider/sjalvkansla/jamforelse-och-sjalvbild' },
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider/sjalvkansla/sjalvkritiska-tankar' }
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'hur-far-man-battre-sjalvkansla',
		title: 'Hur får man bättre självkänsla – ett praktiskt perspektiv',
		description: 'Konkreta och realistiska sätt att stärka självkänslan, utan snabba fix eller tomma råd.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Självkänsla – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' },
			{ label: 'Din psykiska hälsa', url: 'https://dinpsykiskahalsa.se/' }
		],
		faqs: [
			{
				question: 'Kan man verkligen förändra sin självkänsla?',
				answer: 'Ja. Självkänsla är inte ett fast drag – det är ett mönster av tankar och relationer som kan förändras med tid och medvetenhet.'
			},
			{
				question: 'Vad hjälper faktiskt?',
				answer: 'Att lära sig se och ifrågasätta de självkritiska tankarna, bygga relationer där du känner dig sedd och gradvis utmana det du undviker av rädsla.'
			},
			{
				question: 'Varför hjälper inte prestationer att bygga självkänsla?',
				answer: 'Prestationsbaserat välmående är bräckligt – det håller bara tills nästa misslyckande. Självkänsla behöver vila på något som inte kan tas ifrån dig.'
			},
			{
				question: 'Hur lång tid tar det?',
				answer: 'Det finns inga snabba lösningar, men de flesta upplever förändring inom veckor om de arbetar konsekvent med de egna mönstren.'
			}
		],
		relatedArticles: [
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider/sjalvkansla/sjalvkritiska-tankar' },
			{ title: 'Låg självkänsla – vad det är och var det kommer ifrån', href: '/guider/sjalvkansla/lag-sjalvkansla' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'fast-i-negativa-tankar',
		title: 'Fast i negativa tankar – när hjärnan fastnar i ett spår',
		description: 'Negativa tankar som snurrar och fastnar är vanligt vid stress och ångest. Här är vad som händer och vad som faktiskt hjälper.',
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 Vårdguiden – Oro och ångest', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/oro-och-angest/oro-och-angest/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa och välbefinnande', url: 'https://www.folkhalsomyndigheten.se/livsvillkor-levnadsvanor/psykisk-halsa-och-suicidprevention/psykisk-halsa-och-valbefinnande/' }
		],
		relatedArticles: [
			{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider/angest/overtankande-hjalp' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' },
			{ title: 'Kan inte sluta tänka – när tankarna bara snurrar', href: '/guider/angest/kan-inte-sluta-tanka' }
		],
		faqs: [
			{
				question: 'Varför fastnar hjärnan i negativa tankar?',
				answer: 'Det handlar inte om svaghet eller dålig karaktär. Hjärnan är tränad att leta efter hot och problem – det är ett urgammalt skyddssystem. När vi är stressade eller mår dåligt förstärks det mönstret och tankarna tenderar att kretsa kring det svåraste.'
			},
			{
				question: 'Vad hjälper när negativa tankar tar över?',
				answer: 'Tre saker som ofta hjälper: Lägg märke till tanken utan att följa med den ("Där är den igen"). Byt fokus med en konkret handling – ett glas vatten, rörelse, ett samtal. Skriv ner tanken och fråga dig: Är det ett faktum eller en känsla som talar?'
			},
			{
				question: 'Kan man träna sig att inte fastna lika lätt?',
				answer: 'Ja, och det behöver inte vara komplicerat. Att öva sig att märka när tankarna börjar snurra – och medvetet välja att göra något annat – bygger med tid ett nytt mönster. Det är inte en fråga om viljestyrka utan om att upprepa ett mildare sätt att möta tankarna.'
			},
			{
				question: 'När är negativa tankar ett tecken på att jag behöver mer hjälp?',
				answer: 'Om de negativa tankarna tar upp en stor del av din dag, hindrar dig från att sova, jobba eller umgås, eller om de innehåller tankar på att skada dig själv, är det värt att prata med en vårdcentral eller psykiatrisk mottagning.'
			}
		]
	},
	{
		pillarSlug: 'stress',
		slug: 'grounding-ovning-vid-stress',
		nextStepTool: 'grounding-5-4-3-2-1',
		title: 'Grounding-övning vid stress – landa i nuet på 5 minuter',
		description: 'En enkel och effektiv grounding-övning som hjälper dig att bryta stressens grepp och komma tillbaka till nuet.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vad är grounding?',
				answer: 'Grounding handlar om att flytta uppmärksamheten från tankar och oro till det som faktiskt är här och nu – kroppen, omgivningen, nuet.'
			},
			{
				question: 'Varför hjälper grounding vid stress?',
				answer: 'Stress och oro lever i tankar om framtiden. Grounding bryter det mönstret genom att aktivera sinnena och signalera till nervsystemet att det är tryggt just nu.'
			},
			{
				question: 'Hur gör jag grounding-övningen 5-4-3-2-1?',
				answer: 'Nämn 5 saker du ser, 4 du hör, 3 du kan ta på, 2 du luktar och 1 du smakar. Gör det lugnt och konkret – det tar bara 2–3 minuter.'
			},
			{
				question: 'Fungerar grounding för alla?',
				answer: 'De flesta hittar att åtminstone en variant fungerar. Om 5-4-3-2-1 känns svårt, prova att bara hålla i ett föremål och beskriva det detaljerat – temperatur, vikt, yta, form.'
			}
		],
	},
	{
		pillarSlug: 'stress',
		slug: 'varfor-orkar-jag-ingenting',
		nextStepTool: 'body-scan',
		title: 'Varför orkar jag ingenting? – Vad det kan bero på och vad som hjälper',
		description: 'Att inte orka är inte detsamma som att vara svag eller lat. Förstå vad som händer i kroppen och hjärnan – och vad du kan göra i små steg.',
		updatedAt: '2026-03-13',
		sources: [
			{
				label: '1177 Vårdguiden – Utmattningssyndrom',
				url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/stressrelaterad-psykisk-ohalsa/utmattningssyndrom/'
			},
			{
				label: 'Folkhälsomyndigheten – Psykisk hälsa och stress',
				url: 'https://www.folkhalsomyndigheten.se/livsvillkor-levnadsvanor/psykisk-halsa-och-suicidprevention/'
			}
		],
		content: `
## Att inte orka är inte detsamma som att vara svag

Ibland vaknar man upp trött. Man ska göra saker som egentligen är enkla – men det känns tungt. Man försöker ta sig an dagen, men energin finns inte riktigt där.

Det är lätt att tolka det som lathet, dålig disciplin eller att man "inte är tillräcklig". Men ofta handlar det om något helt annat.

Kroppen och hjärnan har ett system för att skydda sig. När det har gått för länge med för mycket – stress, sömnbrist, oro, press – kan det systemet slå av. Inte för att straffa dig, utan för att skydda dig.

## Vanliga orsaker till att man inte orkar

Det finns sällan en enda förklaring. Ofta är det en kombination:

**Stress och överbelastning**
När kroppen länge har gått på högvarv tar energireserverna slut. Det märks inte alltid direkt – men till slut orkar man helt enkelt inte mer.

**Sömnbrist**
Även kortvarig sömnbrist påverkar motivation, beslutskraft och ork dramatiskt. Hjärnan behöver sömn för att återhämta sig och ladda om.

**Nedstämdhet eller depression**
Brist på energi och motivation är ett av de vanligaste tecknen på nedstämdhet. Det behöver inte kallas "depression" för att vara verkligt och påverka vardagen.

**Mental överbelastning**
Att bära på många tankar, bekymmer och ansvar på samma gång är utmattande – även om ingenting ser "stort" ut utifrån.

**Oro och ångest**
Att vara i konstant beredskap tar enormt med energi. Kroppen är spänd, hjärnan är igång – och det lämnar lite kvar till annat.

## Hur det kan kännas inifrån

Det är inte alltid tydligt varför man inte orkar. Ibland känns det så här:

- Enkla saker känns överväldigande
- Man skjuter upp saker man egentligen vill göra
- Det känns som att man "borde" orka men inte gör det
- Man mår dåligt över att inte orka, vilket tar ännu mer energi
- Allt tar längre tid än vanligt

Allt det är förståeliga reaktioner på en kropp och hjärna som behöver återhämtning – inte bevis på att något är fel med dig som person.

## Vad som faktiskt hjälper

### Sänk ribban – på riktigt

Inte som en tillfällig lösning, utan som ett aktivt val. Vad är det minsta meningsfulla du kan göra idag? Börja där. Det är inte att ge upp, det är att vara klok.

### Välj en sak

Att ha en lång lista framför sig när man inte orkar gör det värre. Stäng listan. Välj en sak. Gör den. Det räcker.

### Vila utan skuld

Hjärnan och kroppen återhämtar sig under vila – inte under press. Att vila när du behöver det är inte svaghet. Det är nödvändigt.

### Skriv av dig

Ibland är en del av bördan just att bära allt inombords. Att skriva ner det som snurrar – utan att behöva lösa det – kan lätta lite på trycket.

### Ta ett litet steg i stället för att försöka lösa allt

Stor förändring sker inte på en dag. Men ett litet steg idag, och ett imorgon, och ett dagen efter – det bygger rörelse. Det räcker.

## När det är dags att söka mer stöd

Om brist på ork pågår länge, om vardagen påverkas mycket eller om du märker att du mår sämre över tid – är det ett tecken på att du förtjänar mer stöd än det du kan ge dig själv.

Det kan handla om att prata med en läkare, psykolog eller annan stödkontakt. Att söka hjälp är ett av de starkaste saker du kan göra.

Vid akuta tankar på att skada dig själv: ring 112 eller gå till närmaste akutmottagning.
`,
		faqs: [
			{
				question: 'Är det lathet om man inte orkar?',
				answer: 'Nej. Lathet är ett val. Att inte orka är en reaktion – ofta på överbelastning, sömnbrist eller nedstämdhet. Det ser liknande ut utifrån, men är helt olika saker inifrån.'
			},
			{
				question: 'Vad är det minsta jag kan göra när jag inte orkar?',
				answer: 'Välj en enda sak – den minsta meningsfulla. Det kan vara att ta en promenad runt kvarteret, dricka ett glas vatten, eller skriva en mening i en dagbok. Rörelse i rätt riktning räcker.'
			},
			{
				question: 'När ska jag söka hjälp om jag inte orkar?',
				answer: 'Om det pågår länge (mer än ett par veckor), om det påverkar din vardag eller dina relationer, eller om du börjar må sämre – ta kontakt med vården. Det är ett tecken på styrka, inte svaghet.'
			}
		],
		relatedArticles: [
			{ title: 'Stressymtom – vad kroppen försöker säga', href: '/guider/stress/stressymtom' },
			{ title: 'Hjärntrötthet – när hjärnan stänger av', href: '/guider/stress/hjarntrotthet-hjalp' },
			{ title: 'Svårt att sova när oron tar över', href: '/guider/sovproblem/svart-att-somna-angest' }
		]
	},
	{
		pillarSlug: 'stress',
		slug: 'nar-kroppen-sager-ifran-stress',
		nextStepTool: 'grounding-5-4-3-2-1',
		title: 'När kroppen säger ifrån av stress',
		description: 'Kroppen märker stress innan vi gör det. Lär dig känna igen de vanligaste kroppsliga signalerna och vad du kan göra när de dyker upp.',
		updatedAt: '2026-03-13',
		sources: [
			{ label: '1177 – Stress', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/stress/' },
			{ label: 'Folkhälsomyndigheten – Stress och återhämtning', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/psykisk-halsa-och-arbete/stress-och-aterhamtning/' }
		],
		content: `## Kroppen håller räkning — även när vi inte gör det

Stress brukar beskrivas som något mentalt. Men kroppen reagerar på stress lika mycket som hjärnan — ibland tidigare. Muskler spänns. Andningen blir ytligare. Magen knyter sig. Sömnkvaliteten försämras.

Det är inte svaghet. Det är biologi.

Kroppens stressystem — ofta kallat "fight or flight"-systemet — är designat för att hjälpa oss hantera hot. Problemet är att systemet inte skiljer på ett fysiskt hot och en överfull kalender, ett svårt samtal eller månader av för lite återhämtning.

## Vanliga kroppsliga signaler på stress

### Spänningar i kropp och muskulatur
Axlarna sitter högt. Käken är spänd. Nacken värker. Ryggen protesterar. Det är kroppen som håller kvar det du inte fått bearbeta.

### Hjärtklappning och tryck över bröstet
Hjärtat slår snabbare, ibland utan tydlig anledning. Det kan kännas skrämmande men är ofta en normal stressreaktion.

### Ytlig andning
Under stress andas de flesta ytligare och snabbare. Det kan ge en känsla av att det är svårt att andas ordentligt, eller av lättyrsel.

### Magproblem
Magen och tarmen är känsliga för stress. Illamående, dålig aptit, ont i magen eller förändrade matvanor kan alla vara signaler.

### Huvudvärk
Spänningshuvudvärk är vanlig vid långvarig stress — ofta beror den på muskler i nacke och huvud som aldrig riktigt slappnar av.

### Trött men kan inte sova
En av de vanligaste kombinationerna: kroppen är utmattad men stressystemet är fortfarande aktiverat, vilket gör det svårt att somna eller sova djupt.

### Svårt att varva ner
Även när du loggar ut, stänger datorn eller sätter dig i soffan — känslan av beredskap finns kvar. Det är ett tydligt tecken på att systemet är överaktiverat.

## Varför kroppen reagerar så

Stressreaktionen är i grunden ett skyddssystem. När hjärnan registrerar ett hot frisätts stresshormoner som adrenalin och kortisol. Dessa hormoner förbereder kroppen för handling — muskler spänns, hjärtat pumpar snabbare, sinnen skärps.

Problemet uppstår när det inte finns ett konkret hot att hantera. Vid kronisk stress — jobbtryck, relationsproblem, ekonomisk oro, sömnbrist — hålls systemet aktiverat utan naturlig avladdning. Kroppen betalar priset.

## Vad du kan göra i små steg

Du behöver inte lösa allt på en gång. Några små saker som faktiskt hjälper kroppen att signalera "det är lugnt":

**Andning.** Medveten, långsam utandning aktiverar det parasympatiska nervsystemet — kroppens eget bromssystem. Prova att andas in i 4 sekunder, hålla i 2, andas ut i 6.

**Rörelse.** Promenader, stretching eller yoga hjälper musklerna att frisätta spänningar som byggts upp.

**Värme.** Bad, varm dryck eller ett varmt täcke skickar signaler om trygghet till nervsystemet.

**Grounding.** Att rikta uppmärksamheten mot det konkreta här och nu — vad du ser, hör, känner — hjälper systemet att landa.

**Skriv av dig.** Att sätta ord på det som tynger kan minska den kognitiva belastningen och göra det lättare för kroppen att slappna av.

## När du bör söka mer stöd

Om de kroppsliga signalerna är ihållande — om du sover dåligt i månader, har konstant värk, hjärtklappning som inte ger med sig eller känner dig helt urladdad — är det klokt att prata med en läkare. Kroppen kommunicerar. Det är värt att lyssna.`,
		faqs: [
			{
				question: 'Är det farligt att ha kroppsliga stressymtom?',
				answer: 'De flesta stressreaktioner är ofarliga i sig, men långvarig stress kan påverka hälsan. Om symptomen är ihållande är det klokt att prata med en läkare.'
			},
			{
				question: 'Vad kan jag göra direkt när kroppen spänner sig?',
				answer: 'Prova en medveten utandning, låt axlarna sjunka, och rikta uppmärksamheten mot något konkret i rummet. Det aktiverar kroppens eget lugnsystem.'
			},
			{
				question: 'Hur vet jag om det är stress och inte något fysiskt?',
				answer: 'Det kan vara svårt att skilja på. Om du är osäker — kontakta vården. Att utesluta fysiska orsaker är alltid ett klokt första steg.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på mental överbelastning',
				href: '/guider/stress/tecken-pa-mental-overbelastning'
			},
			{
				title: 'Stressymtom – hur stress visar sig i kropp och tankar',
				href: '/guider/stress/stressymtom'
			},
			{
				title: 'Grounding-övning vid stress',
				href: '/guider/stress/grounding-ovning-vid-stress'
			},
			{
				title: 'Hur återhämtar man sig mentalt?',
				href: '/guider/stress/hur-aterhamtar-man-sig-mentalt'
			}
		]
	},
	{
		pillarSlug: 'stress',
		slug: 'hur-aterhamtar-man-sig-mentalt',
		nextStepTool: 'stresshantering',
		title: 'Hur återhämtar man sig mentalt? Små steg som faktiskt hjälper',
		description: 'Mental återhämtning handlar inte om att skärpa sig. Här får du konkreta steg för att minska belastningen och ge hjärnan tid att hinna ikapp.',
		content: `## Varför mental återhämtning kan kännas svår\n\nDu kanske vet att du behöver vila, men det hjälper inte att bara lägga sig ner. Hjärnan fortsätter gå på högvarv. Du är trött men kan inte varva ner. Du skuldbelägger dig själv för att du inte orkar. Du försöker vila men är fortfarande mentalt påkopplad. Det är inte lathet. Det är ett nervsystem som fastnat i alarmberedskap.\n\n## Tecken på att du behöver mental återhämtning\n\n- Svårt att fokusera även på enkla saker\n- Lättirriterad utan tydlig anledning\n- Allt känns tungt och meningslöst\n- Svårt att känna efter vad du behöver\n- Kroppen känns spänd även i vila\n- Du vaknar trött trots tillräckligt med sömn\n\nOm du känner igen flera av dessa signaler har din hjärna sannolikt varit överbelastad längre än du tror. Det innebär att återhämtningen också behöver tid, inte bara en kväll.\n\n## Små steg som faktiskt hjälper\n\n### Sänk inflödet en stund\n\nDin hjärna bearbetar allt du tar in: nyheter, sociala medier, andras problem, notiser. Att medvetet minska inflödet ger nervsystemet utrymme att lugna ner sig. Du behöver inte stänga av allt, men testa att minska under en begränsad period.\n\n### Gör mindre, inte perfekt\n\nNär du är mentalt utmattad fungerar inte prestige och prestation. Sänk ribban. Gör det viktigaste, inte det bästa. Att göra tre saker halvbra är bättre för återhämtning än att göra en sak perfekt under press.\n\n### Återkommande pauser utan syfte\n\nÅterhämtning sker inte bara på natten. Korta pauser under dagen, där du inte gör något alls, hjälper nervsystemet att kalibrera om. Ingen musik, ingen skärm, bara stillhet i några minuter.\n\n### Skriv av dig\n\nAtt skriva ner tankar hjälper hjärnan att sortera och släppa. Det behöver inte vara snyggt eller sammanhängande. Bara att få ut orden kan minska den inre pressen märkbart.\n\n### Grounding och andning\n\nEnkla övningar som att andas långsamt, känna fötterna mot golvet eller beskriva det du ser runt dig hjälper kroppen att lämna alarmberedskap. Det handlar inte om att slappna av på kommando, utan om att ge nervsystemet en signal att faran har passerat.\n\n### Sömn och rytm utan press\n\nFörsök inte tvinga fram perfekt sömn. Fokusera istället på att ha en ungefärlig rytm: gå upp vid samma tid, ha en lugn rutin innan sängen, undvik skärm nära insomnandet. Strukturen i sig ger trygghet åt hjärnan.\n\n## Vad som inte alltid hjälper\n\n- **Att pressa sig hårdare.** Det förstärker belastningen.\n- **Att försöka tänka bort allt.** Undertryckt stress lagras i kroppen.\n- **Att fylla varje paus med skärm eller nytt inflöde.** Hjärnan får aldrig tyst.\n\nÅterhämtning handlar inte om att göra ingenting perfekt. Det handlar om att minska belastningen tillräckligt länge för att hjärnan ska hinna ikapp.\n\n## När du bör söka mer stöd\n\nOm du har känt dig mentalt utmattad i flera veckor, om du märker att vardagen påverkas allt mer, eller om det börjar kännas hopplöst, kan det vara bra att prata med någon professionell. Det är inget tecken på svaghet. Det är ett steg mot att ta hand om dig själv på riktigt.`,
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Hur lång tid tar mental återhämtning?',
				answer: 'Det varierar från person till person. Har du varit överbelastad länge kan det ta veckor att känna skillnad. Små, regelbundna steg ger bäst resultat.'
			},
			{
				question: 'Varför hjälper det inte att bara vila?',
				answer: 'Om nervsystemet är i alarmberedskap räcker det inte att lägga sig ner. Hjärnan behöver aktiva signaler om trygghet, till exempel grounding eller att sänka inflödet.'
			},
			{
				question: 'Kan jag återhämta mig mentalt utan professionell hjälp?',
				answer: 'I många fall kan du göra mycket själv. Men om utmattningen håller i sig länge eller påverkar vardagen starkt kan det vara bra att prata med någon.'
			},
			{
				question: 'Är mental utmattning samma sak som utmattningssyndrom?',
				answer: 'Inte nödvändigtvis. Mental utmattning är ett bredare begrepp. Utmattningssyndrom är en klinisk diagnos som ställs av vårdpersonal.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på mental överbelastning',
				href: '/guider/stress/tecken-pa-mental-overbelastning'
			},
			{
				title: 'När kroppen säger ifrån av stress',
				href: '/guider/stress/nar-kroppen-sager-ifran-stress'
			},
			{
				title: 'Grounding-övning vid stress',
				href: '/guider/stress/grounding-ovning-vid-stress'
			},
			{
				title: 'Varför orkar jag ingenting?',
				href: '/guider/stress/varfor-orkar-jag-ingenting'
			}
		],
	},

	{
		pillarSlug: 'beroende',
		slug: 'att-vilja-sluta-och-inte-vilja-samtidigt',
		nextStepTool: 'daglig-reflektionsmall',
		title: 'Att vilja sluta och inte vilja samtidigt',
		description:
			'Det är inte ovanligt att förstå att något inte är bra för en, men ändå fortsätta. En del av dig kanske är trött, rädd eller less på hur det blivit.',
		seoTitle: 'Att vilja sluta och inte vilja samtidigt | MittPsyke',
		seoDescription:
			'Det är vanligt att vilja sluta och ändå hålla fast. Om skam, ambivalens, kontrollförlust och första steg mot stöd när något tagit större plats än man vill erkänna.',
		updatedAt: '2026-04-02',
		sources: [
			{
				label: '1177 Vårdguiden – Beroende och skadligt bruk',
				url: 'https://www.1177.se/sjukdomar--besvar/beroende-och-skadligt-bruk/'
			},
			{
				label: 'Socialstyrelsen – Skadligt bruk och beroende',
				url: 'https://www.socialstyrelsen.se/stod-i-livet/skadligt-bruk-och-beroende/'
			}
		],
		content: `Det är inte ovanligt att förstå att något inte är bra för en, men ändå fortsätta. En del av dig kanske är trött, rädd eller less på hur det blivit. En annan del vill bara orka dagen, få tyst i huvudet eller slippa känna så mycket för en stund. Den där dragkampen kan vara svår att sätta ord på. Särskilt när skammen redan ligger nära.

För många ser det heller inte allvarligt ut i början. Det som senare känns destruktivt kan först kännas som något man har kontroll över. Något tillfälligt. Något som hjälper. Just därför kan det ta tid att förstå vad som håller på att hända.

## Det börjar ofta stilla

Det är sällan ett tydligt ögonblick där allt plötsligt förändras. Ofta sker det stegvis. Något blir ett sätt att varva ner, stå ut, dämpa oro, stänga av eller få en liten paus från det som gör ont. Först kanske det känns som ett undantag. Sedan som en vana. Till slut som något man nästan räknar med för att klara av vardagen.

Det är en av anledningarna till att många inte reagerar direkt. När förändringen sker långsamt hinner man vänja sig. Man anpassar sig efter det som blivit, flyttar sina gränser lite i taget och förklarar för sig själv att det fortfarande är under kontroll. Inte för att man ljuger medvetet, utan för att det mänskliga ofta fungerar så. Man vänjer sig också vid sådant som egentligen skaver.

Det som senare känns självklart var kanske inte alls tydligt från början.

## När det destruktiva blir normalt

Normalisering händer ofta i det tysta. Det som först kändes ovant börjar kännas bekant. Det som först väckte en liten oro får efter hand mindre uppmärksamhet. Man kanske märker att tankarna kretsar mer kring nästa tillfälle, nästa paus eller nästa chans att slippa sig själv för en stund. Men eftersom det inte kom över en natt kan det vara svårt att se mönstret klart.

Många beskriver att de länge levde i något som inte kändes bra, men som ändå blev vardag. Man vänjer sig vid att planera runt det. Vid att återhämta sig från det. Vid att lova sig själv att det ska bli annorlunda senare. Och när något blir vardag är det lätt att börja behandla det som normalt, även när det tar mer än det ger.

Det är ofta först efteråt man ser hur mycket man har anpassat sig.

## Kontrollförlust känns inte alltid dramatiskt

När man hör ord som kontrollförlust tänker många på något tydligt och snabbt. Men i verkligheten ser det ofta mer lågmält ut. Man skjuter upp beslut. Man gör undantag oftare än man tänkt. Man märker att gränserna man satte för sig själv inte riktigt håller. Man tänker mer på det än man vill erkänna. Man förhandlar med sig själv. Börjar om. Backar. Lovar. Förminskar.

Det kan pågå länge utan att omgivningen märker särskilt mycket.

Just därför tvivlar många på sig själva. De tänker att om det vore ett riktigt problem skulle det synas mer. Men mycket kan pågå under ytan. Kontrollförlust behöver inte se dramatisk ut för att vara smärtsam. Ibland märks den mest i det inre livet: i stressen, skammen, upptagenheten, tröttheten och känslan av att inte riktigt lita på sig själv längre.

## Många ser mindre än du bär på

Det går att fungera utåt och samtidigt må väldigt dåligt. Man kan gå till jobbet, svara på meddelanden, sköta det viktigaste och ändå känna att mycket inuti kretsar kring att hålla ihop, dölja, skjuta undan och försöka verka som vanligt.

För andra kanske det ser ut som att livet rullar på. Men det som inte syns är ofta allt arbete bakom. Alla små justeringar. All energi som går åt till att få saker att se vanliga ut. Alla tankar som aldrig sägs högt.

Det kan göra ensamheten större. Inte bara för att man är ensam med det man kämpar med, utan för att man samtidigt får höra, direkt eller indirekt, att man verkar må ganska bra. Då blir avståndet mellan utsidan och insidan ännu större.

## Skammen håller ofta mönstret vid liv

Skam gör sällan något lättare. Den får många att tiga, gömma och vänta. Den säger att man borde ha bättre kontroll, att man borde ha stoppat det tidigare, att man inte borde känna så här om man verkligen ville förändras.

Men skam gör ofta att problemet får mer makt, inte mindre. När man skäms blir det svårare att vara ärlig, både med andra och med sig själv. Man kanske jämför sig med andras värre situationer och tänker att ens eget läge inte räknas. Man kanske säger att man överdriver, fast man innerst inne vet att något inte känns hållbart.

Om man redan kämpar med ångest, nedstämdhet eller energilöshet kan skammen bli ännu tyngre. Då blir det lätt att dra sig undan just när man skulle behöva stöd som mest.

## Insikten kommer ofta före orken

Att inse att något håller på att ta över kan vara viktigt. Ibland är det första gången man slutar förklara bort det som känns. Men insikt betyder inte automatiskt att man är redo, eller orkar, att förändra allt.

För många kommer insikten tillsammans med stark ångest, sorg eller trötthet. När man väl slutar springa ifrån sanningen kan mycket annat komma ikapp. Då är det inte konstigt om man backar. Inte för att man inte menar allvar, utan för att det gör ont att se klart. Och för att det man vill bort från fortfarande kan kännas som det enda som hjälper för stunden.

Det här mellanläget är vanligt. Man vet, men tvekar. Man längtar efter förändring, men är rädd för tomrummet, rastlösheten eller det som ska komma upp till ytan om man släpper taget. Det gör inte din vilja mindre verklig. Det visar bara hur svårt det kan vara.

## Ambivalens är en del av verkligheten

Många tror att man måste vara helt säker för att få söka hjälp. Som att man först måste bestämma sig till hundra procent. Men så ser det sällan ut när något har fått växa fram stegvis och blivit invävt i hur man klarar livet.

Ambivalens är inte ett tecken på att du inte menar allvar. Det är ofta ett tecken på att något både hjälper och skadar på samma gång. En del av dig kanske vill vara fri. En annan är rädd för hur det ska gå utan det som blivit ett sätt att stå ut.

Därför behöver första steget inte vara ett stort löfte. Ibland räcker det att tänka en ärlig tanke hela vägen ut: det här har fått större plats än jag vill erkänna. Jag har börjat anpassa mitt liv efter något som tagit mer makt än jag vill erkänna. Jag orkar inte fortsätta låtsas att det här inte tar plats.

Sådana meningar kan verka små. Men de bryter ofta något viktigt: tystnaden.

## Stöd kan sökas innan allt rasat

Man behöver inte vänta tills allt blivit synligt för andra. Man behöver inte bevisa att det gått långt nog. Det räcker att du märker att något håller på att ta mer kraft, mer tankeutrymme och mer plats i livet än du vill ge det.

Stöd kan börja i något litet. Ett ärligt samtal. Några ord i en anteckning. Att säga till någon man litar på att man inte riktigt har kontroll längre, även om man fortfarande fungerar utåt. Att söka professionellt stöd utan att ha hela bilden klar.

Förändring går sällan rakt. Det betyder inte att den är omöjlig. Ofta börjar den inte med styrka, utan med trötthet. Med sanningen. Med att man orkar sluta låtsas för en stund.

Du behöver inte ha alla svar nu. Det kan räcka att börja vara ärlig mot dig själv och ta ett första litet steg.`,
		faqs: [
			{
				question: 'Är det vanligt att vilja sluta och inte vilja samtidigt?',
				answer: 'Ja. Ambivalens är vanligt när något både lindrar för stunden och samtidigt skapar problem. Det betyder inte att du inte menar allvar.'
			},
			{
				question: 'Kan ett destruktivt mönster bli normalt utan att man märker det direkt?',
				answer: 'Ja. Många vänjer sig stegvis, flyttar sina gränser och anpassar vardagen innan de riktigt ser hur stor plats mönstret har tagit.'
			},
			{
				question: 'Behöver allt ha rasat innan jag söker stöd?',
				answer: 'Nej. Du kan söka stöd så fort du märker att något tar mer kraft, skam eller tankeutrymme än du vill ge det. Hjälp får sökas tidigt.'
			},
			{
				question: 'Betyder ett bakslag att förändring är omöjlig?',
				answer: 'Nej. Vägen bort från ett destruktivt mönster är sällan rak. Ett bakslag säger oftast mer om att något är svårt än om din förmåga att förändras.'
			}
		],
		relatedArticles: [
			{
				title: 'När bruk blir ett sätt att stå ut',
				href: '/guider/beroende/nar-bruk-blir-ett-satt-att-sta-ut'
			},
			{
				title: 'Första steg när man vet att något inte är bra',
				href: '/guider/beroende/forsta-steg-nar-man-vet-att-nagot-inte-ar-bra'
			},
			{
				title: 'Varför orkar jag ingenting? – Vad det kan bero på och vad som hjälper',
				href: '/guider/stress/varfor-orkar-jag-ingenting'
			},
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			},
			{
				title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
				href: '/guider/angest/orostankar'
			}
		]
	},
	{
		pillarSlug: 'beroende',
		slug: 'forsta-steg-nar-man-vet-att-nagot-inte-ar-bra',
		nextStepTool: 'daglig-reflektionsmall',
		title: 'Första steg när man vet att något inte är bra',
		description:
			'Ibland räcker det att en ärlig tanke stannar kvar lite längre än vanligt. Att något inte känns hållbart längre, även om du ännu inte vet vad du ska göra åt det.',
		seoTitle: 'Första steg när man vet att något inte är bra | MittPsyke',
		seoDescription:
			'Om de första stegen när du märker att något inte är bra: skam, ambivalens, trötthet, ärlighet och hur stöd kan sökas innan allt har rasat.',
		updatedAt: '2026-04-02',
		sources: [
			{
				label: '1177 Vårdguiden – Beroende och skadligt bruk',
				url: 'https://www.1177.se/sjukdomar--besvar/beroende-och-skadligt-bruk/'
			},
			{
				label: 'Socialstyrelsen – Skadligt bruk och beroende',
				url: 'https://www.socialstyrelsen.se/stod-i-livet/skadligt-bruk-och-beroende/'
			}
		],
		content: `Ibland börjar det med något väldigt litet. Inte ett beslut. Inte en stor vändpunkt. Bara en stilla känsla av att något inte längre känns riktigt hållbart. Att det som varit ett sätt att stå ut också har börjat kosta. Att du kanske tänker mer på det än du vill erkänna. Att du anpassar mer än du vill se.

Det kan vara ett svårt läge att befinna sig i. Särskilt om du samtidigt är trött, skamsen eller rädd för vad det skulle innebära att ta situationen på allvar. Många väntar länge just där. Inte för att de inte förstår, utan för att första steget ofta känns större än det egentligen behöver vara.

## Det första steget är sällan dramatiskt

När man tänker på förändring är det lätt att föreställa sig något tydligt: att man bestämmer sig, säger allt högt, ändrar livet och aldrig ser tillbaka. Men för de flesta ser det inte ut så.

Det första steget är ofta mycket mindre. Det kan vara att sluta avfärda sin egen oro. Att erkänna att något tar mer plats än man vill ge det. Att märka hur mycket kraft som går åt till att tänka runt det, planera runt det eller dölja hur det faktiskt känns.

Det kan låta obetydligt. Men det är ofta där något börjar förändras på riktigt. Inte i prestationen, utan i ärligheten.

## Man kan veta och ändå skjuta upp

Det är vanligt att veta att något inte är bra och ändå inte göra något direkt. Många tror då att de bara saknar vilja. Men ofta handlar det om något mer komplicerat än så.

Kanske finns en rädsla för att behöva ge upp det som trots allt hjälpt i stunden. Kanske finns en oro för vem man är utan det mönster man lutat sig mot. Kanske känns vardagen redan så tung att tanken på ytterligare kamp blir övermäktig.

Så uppskjutandet betyder inte alltid att man inte bryr sig. Ibland betyder det att man är rädd, utmattad eller ännu inte redo att möta allt som kan komma upp till ytan. Det är mänskligt. Men det är också viktigt att inte fastna för länge i att bara vänta på rätt känsla.

## Börja där sanningen är som minst hotfull

Första steg behöver inte börja med att du berättar allt för någon annan. Om det känns för stort kan det börja mycket närmare dig själv.

Det kan vara att skriva en enda ärlig mening. Att säga till dig själv att det här påverkar mig mer än jag vill erkänna. Att lägga märke till när skammen kommer in och försöker få dig att tona ner det. Att våga stanna kvar i tanken utan att direkt springa vidare.

Ibland är det just det som gör att nästa steg alls blir möjligt. Inte att pressa fram mod, utan att göra sanningen lite mindre ensam.

## Små steg är inte små om de är ärliga

När man mår dåligt är det lätt att förakta små steg. De kan kännas otillräckliga, nästan löjliga. Särskilt om man jämför sig med en idé om hur förändring borde se ut.

Men ett litet steg som är verkligt betyder ofta mer än ett stort löfte man inte orkar bära. Att läsa om stöd. Att spara ett nummer. Att skriva ner vad du faktiskt märker hos dig själv. Att säga till en person du litar på att något inte känns bra, utan att behöva ha en färdig förklaring.

Den sortens steg förändrar kanske inte allt på en dag. Men de bryter ofta det mest nedbrytande i situationen: ensamheten, förnekelsen och känslan av att allt måste lösas på en gång.

## Skammen vill gärna göra första steget senare

Skam säger ofta att du ska vänta. Att du först borde förstå mer, skärpa dig mer, ha bättre kontroll eller bli säkrare på att det verkligen är ett problem. Den säger att det inte är illa nog än. Att andra har det värre. Att du bara överdriver.

Det är därför många söker stöd sent, trots att de känt länge att något inte stämmer.

Men att ta ett första steg tidigt är inte att göra en stor sak av ingenting. Det är att visa respekt för sitt eget mående innan allt blivit ännu tyngre. Du behöver inte bevisa sammanbrott för att få börja ta dig själv på allvar.

## Stöd kan börja långt innan behandling känns möjligt

För en del känns ord som behandling, beroendevård eller förändring så stora att de nästan stänger dörren direkt. Då kan det hjälpa att tänka mindre definitivt.

Stöd kan i början bara betyda att du inte längre bär allt helt själv. Det kan vara ett första samtal med någon du har förtroende för. Det kan vara att kontakta vårdcentral, beroendemottagning eller socialtjänst för att höra vilka möjligheter som finns, utan att du måste ha bestämt allt i förväg. Det kan också vara att börja följa ditt eget mående och se sambanden tydligare.

För många blir det lättare att röra sig framåt när de märker att stöd inte alltid kräver total säkerhet. Man får söka hjälp även mitt i tvekan.

## Försök att inte kräva full klarhet av dig själv

Många väntar på ett ögonblick av total övertygelse. En punkt där allt blir glasklart och viljan känns stark nog att bära hela vägen. Men så ser det sällan ut.

Ofta kommer förändring medan man fortfarande tvivlar. Medan man fortfarande sörjer det man vill släppa. Medan man fortfarande skäms. Medan man fortfarande inte vet exakt hur livet ska bli i stället.

Om du kräver full klarhet innan du får börja, finns risken att du blir kvar i samma cirkel länge. Det kan räcka att något i dig vet att detta inte känns bra längre. Det kan räcka som början.

## Ett första steg kan vara att låta någon annan veta

Det behöver inte vara ett långt samtal. Det behöver inte vara välformulerat. Ibland räcker en mening som: jag tror inte att det här är bra för mig längre. Eller: jag märker att jag försöker dölja mer än jag vill. Eller: jag vet inte vad jag ska göra, men jag vill inte fortsätta som om allt är vanligt.

När något sägs högt händer ofta något viktigt. Inte för att allt blir lättare direkt, utan för att tystnaden tappar lite av sitt grepp. Det som varit instängt får en liten öppning.

Och där, i något så enkelt som en ärlig mening, kan ett verkligt första steg börja.

## Du behöver inte gå hela vägen i dag

Om du vet att något inte är bra, men inte riktigt vet hur du ska börja, betyder det inte att det är för sent. Det betyder bara att du står i början av något som kan behöva få vara varsamt.

Du behöver inte lösa allt nu. Du behöver inte lova mer än du kan bära. Du behöver inte vänta tills allt rasat. Ibland räcker det att sluta springa ifrån det du redan vet, och låta det bli sant en stund.

Du behöver inte ha alla svar nu. Det kan räcka att börja vara ärlig mot dig själv och ta ett första litet steg.`,
		faqs: [
			{
				question: 'Vad kan ett första steg vara när jag vet att något inte är bra?',
				answer: 'Ofta något mindre än man tror: en ärlig mening till dig själv, att skriva ner vad du märker, eller att låta någon du litar på veta att något inte känns hållbart.'
			},
			{
				question: 'Måste jag vara helt säker innan jag söker stöd?',
				answer: 'Nej. Många söker hjälp mitt i tvekan. Du behöver inte vara färdig med alla beslut för att få börja prata om det som känns svårt.'
			},
			{
				question: 'Varför väntar så många så länge?',
				answer: 'Skam, rädsla, trötthet och ambivalens gör ofta att människor skjuter upp första steget. Det betyder inte att problemet är oviktigt, bara att det är svårt att närma sig.'
			},
			{
				question: 'Kan jag söka stöd innan allt blivit väldigt allvarligt?',
				answer: 'Ja. Det är ofta klokt att söka stöd tidigt, innan mönstret hunnit ta ännu mer kraft och plats i livet.'
			}
		],
		relatedArticles: [
			{
				title: 'När bruk blir ett sätt att stå ut',
				href: '/guider/beroende/nar-bruk-blir-ett-satt-att-sta-ut'
			},
			{
				title: 'Att vilja sluta och inte vilja samtidigt',
				href: '/guider/beroende/att-vilja-sluta-och-inte-vilja-samtidigt'
			},
			{
				title: 'Varför orkar jag ingenting? – Vad det kan bero på och vad som hjälper',
				href: '/guider/stress/varfor-orkar-jag-ingenting'
			},
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'beroende',
		slug: 'nar-bruk-blir-ett-satt-att-sta-ut',
		nextStepTool: 'daglig-reflektionsmall',
		title: 'När bruk blir ett sätt att stå ut',
		description:
			'Ibland börjar det inte som ett tydligt problem, utan som något som hjälper dig igenom dagen. Något som lindrar, dämpar eller gör det lättare att stå ut en stund.',
		seoTitle: 'När bruk blir ett sätt att stå ut | MittPsyke',
		seoDescription:
			'Om när bruk blir ett sätt att stå ut med ångest, tomhet eller stress. Om gradvis normalisering, kontrollförlust, små tecken och stöd innan allt känns allvarligt.',
		updatedAt: '2026-04-02',
		sources: [
			{
				label: '1177 Vårdguiden – Beroende och skadligt bruk',
				url: 'https://www.1177.se/sjukdomar--besvar/beroende-och-skadligt-bruk/'
			},
			{
				label: 'Socialstyrelsen – Skadligt bruk och beroende',
				url: 'https://www.socialstyrelsen.se/stod-i-livet/skadligt-bruk-och-beroende/'
			}
		],
		content: `Ibland börjar det inte som ett tydligt problem. Det börjar som något som hjälper. Något som dämpar oro, skapar paus, gör kvällen lite tystare eller dagen lite mer uthärdlig. När man mår psykiskt dåligt kan det som ger lättnad i stunden snabbt få en större plats än man först tänkt.

Det betyder inte att man från början ser vart det är på väg. Ofta känns det tvärtom ganska rimligt. Som ett sätt att klara sig. Som något tillfälligt. Just därför kan det vara svårt att märka när ett sätt att stå ut långsamt börjar bli ett mönster som kostar mer än det ger.

## Det börjar inte alltid som ett tydligt problem

Många tänker att destruktiva mönster borde kännas allvarliga direkt. Men så ser det sällan ut. När något först fungerar som lindring är det lätt att förstå det som en lösning, inte som ett varningstecken.

Kanske märker man bara att det blir lättare att andas för en stund. Att tankarna tystnar lite. Att tomheten backar. Att man får en paus från sig själv. Om man redan bär på ångest, nedstämdhet, stress eller inre oro kan den sortens lättnad kännas väldigt betydelsefull.

Det är därför många inte reagerar direkt. Det som senare känns självklart att ifrågasätta kunde tidigare kännas som det enda som hjälpte.

## När något blir en strategi för att orka

När livet känns tungt letar människor ofta efter sätt att hålla ihop. Ibland blir bruk en sådan strategi. Inte för att man vill tappa kontrollen, utan för att man försöker klara vardagen med det man har tillgång till just då.

Det kan finnas något sorgligt i det, men också något mänskligt. Man försöker lindra det som gör ont. Man försöker fungera, sova, stå ut, slippa tänka eller få lite avstånd till det som trycker inifrån.

Problemet är att en strategi som hjälper i stunden också kan börja styra mer än man vill. Inte över en natt, utan gradvis. Det som först kändes som ett val kan efter hand börja kännas som något man behöver för att orka med sådant som tidigare gick ändå.

## Hur psykiskt mående och bruk kan hänga ihop

Psykiskt mående och bruk går ofta in i varandra på sätt som är svåra att reda ut. Det är inte alltid lätt att veta vad som kom först. Kanske fanns ångest, sömnsvårigheter, skam eller nedstämdhet redan innan. Kanske har det blivit värre efterhand. Ofta pågår båda sakerna samtidigt och förstärker varandra.

Det kan skapa mycket förvirring. Man kanske märker att man mår dåligt utan lindringen, men också att man mår dåligt av hur allt har blivit. Då är det lätt att fastna i känslan av att det inte finns något riktigt bra alternativ.

Just den känslan gör ofta ambivalensen stark. En del av dig kanske vet att något inte håller. En annan del är rädd för vad som händer om du släpper det som ändå gett någon form av lättnad.

## När lindring börjar kosta mer än den ger

Förändringen känns inte alltid dramatisk. Ofta märks den i små förskjutningar. Att tankarna kretsar mer kring nästa tillfälle. Att man planerar dagen eller kvällen utifrån det. Att man lovar sig själv att hålla igen, men flyttar gränsen lite till. Att man behöver återhämta sig från något som från början skulle hjälpa.

Det går också att fungera utåt samtidigt som mycket inuti börjar kretsa kring att få det att gå ihop. Många döljer mer än andra ser. Man fortsätter svara på jobbmejl, sköta vardagen och verka okej, samtidigt som skammen, upptagenheten eller tröttheten växer på insidan.

Det är ofta först när kostnaden blivit större som man stannar upp. Inte alltid för att något rasat, utan för att man märker hur mycket kraft som går åt. Hur mycket tankar, energi och självrespekt som långsamt förbrukas.

## Det är vanligt att vänja sig stegvis

Människor vänjer sig vid mycket. Det gäller också sådant som egentligen inte känns bra. När något sker stegvis hinner man ofta normalisera det. Man anpassar rutiner. Man förklarar. Man jämför sig med värre bilder och tänker att det nog inte är så farligt.

Det betyder inte att man är blind eller oärlig. Ofta betyder det bara att förändringen varit så gradvis att den inte känts tydlig medan den pågått. Man flyttar sina gränser lite i taget och märker först senare hur långt man kommit från det som en gång kändes rimligt.

Just därför kan insikten komma sent. Inte för att man inte brytt sig, utan för att man hunnit vänja sig vid att leva nära något som långsamt tagit mer makt.

## Små tecken att vara uppmärksam på

Ibland finns det inga stora larm. Bara små tecken som återkommer. Att du tänker mer på bruket än du vill erkänna. Att du döljer mer än du trodde att du skulle. Att du förhandlar med dig själv. Att du känner skam, men samtidigt fortsätter. Att du märker att ditt psykiska mående blir svårare att förstå eftersom så mycket kretsar kring att lindra, återhämta sig eller hålla ihop.

Ett annat tecken kan vara att du börjar tona ner din egen oro. Att du tänker att det inte räknas eftersom du fortfarande fungerar. Eller att du väntar på ett tydligare bevis för att få ta det på allvar.

Men många problem ser länge ganska vanliga ut från utsidan. Det som gör ont syns inte alltid. Därför är det viktigt att inte bara lyssna på hur det ser ut, utan också på hur det faktiskt känns att leva i det.

## Det går att söka stöd innan allt känns allvarligt

Du behöver inte vänta tills allt blivit tydligt för alla andra. Du behöver inte heller vara helt säker på vad du vill göra. Det räcker att du märker att något har börjat ta mer plats än du mår bra av.

Stöd kan börja mycket stilla. Med en ärlig tanke. Med att du slutar förminska det som skaver. Med att du berättar för någon att du inte riktigt litar på hur det här påverkar dig längre. Med att du söker professionellt stöd för att förstå vad som händer, innan du känner dig redo att fatta stora beslut.

Det finns ingen rak väg här. För vissa börjar förändring med tydlig handling. För andra börjar den med att man vågar se sitt mönster utan att vända bort blicken direkt. Båda vägarna kan vara verkliga.

Du behöver inte ha alla svar nu. Det kan räcka att börja vara ärlig mot dig själv och ta ett första litet steg.`,
		faqs: [
			{
				question: 'Är det vanligt att bruk börjar som ett sätt att stå ut?',
				answer: 'Ja. För många börjar det som något som lindrar oro, tomhet eller stress i stunden, inte som ett tydligt problem.'
			},
			{
				question: 'Varför märker man inte alltid att ett mönster blir destruktivt?',
				answer: 'Ofta sker förändringen stegvis. Man vänjer sig, anpassar sig och flyttar sina gränser lite i taget, vilket gör det svårare att se helheten medan den pågår.'
			},
			{
				question: 'Kan jag fungera utåt och ändå ha ett problem?',
				answer: 'Ja. Många fungerar utåt samtidigt som mycket inuti kretsar kring skam, kontrollförlust, oro och att dölja hur mycket plats mönstret har tagit.'
			},
			{
				question: 'Behöver allt kännas allvarligt innan jag söker stöd?',
				answer: 'Nej. Du kan söka stöd så snart du märker att något påverkar ditt mående, din energi eller din vardag mer än du vill erkänna.'
			}
		],
		relatedArticles: [
			{
				title: 'Att vilja sluta och inte vilja samtidigt',
				href: '/guider/beroende/att-vilja-sluta-och-inte-vilja-samtidigt'
			},
			{
				title: 'Första steg när man vet att något inte är bra',
				href: '/guider/beroende/forsta-steg-nar-man-vet-att-nagot-inte-ar-bra'
			},
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider/depression/nedstamdhet'
			}
		]
	},

	// KBT-guider
	{
		pillarSlug: 'kbt',
		slug: 'vad-ar-kbt',
		title: 'Vad är KBT och hur fungerar det?',
		description: 'En lättillgänglig introduktion till kognitiv beteendeterapi – vad det bygger på och hur du kan börja använda det.',
		updatedAt: '2026-03-21',
		sources: [
			{ label: 'KBT – 1177 Vårdguiden', url: 'https://www.1177.se/behandlingar--hjalpmedel/behandlingar-vid-psykiska-besvar/kognitiv-beteendeterapi-kbt/' },
			{ label: 'Psykisk hälsa – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vad är KBT?',
				answer: 'KBT, kognitiv beteendeterapi, är en behandlingsform som fokuserar på sambandet mellan tankar, känslor och beteenden. Målet är att identifiera och förändra destruktiva tankemönster.'
			},
			{
				question: 'Kan man göra KBT på egen hand?',
				answer: 'Många grundläggande KBT-tekniker kan användas som självhjälp. Strukturerade övningar som tankedagbok och beteendeaktivering går att testa hemma.'
			},
			{
				question: 'Hur lång tid tar KBT?',
				answer: 'Traditionellt pågår KBT i 8–20 sessioner, men effekter kan märkas redan efter några veckors självhjälpsövningar.'
			},
			{
				question: 'Passar KBT alla?',
				answer: 'KBT har stark evidens för ångest och depression. Hur väl det passar beror på individen – vissa föredrar andra terapiformer.'
			}
		],
		relatedArticles: [
			{ title: 'Tankeomstrukturering – utmana negativa tankar', href: '/guider/kbt/tankeomstrukturering' },
			{ title: 'Beteendeaktivering vid nedstämdhet', href: '/guider/kbt/beteendeaktivering' },
			{ title: 'KBT-tekniker du kan använda hemma', href: '/guider/kbt/kbt-tekniker-hemma' }
		]
	},
	{
		pillarSlug: 'kbt',
		slug: 'tankeomstrukturering',
		title: 'Tankeomstrukturering – utmana dina negativa tankar',
		description: 'Lär dig hur du identifierar och ifrågasätter tankefällor med hjälp av en enkel KBT-teknik.',
		updatedAt: '2026-03-21',
		sources: [
			{ label: 'KBT – 1177 Vårdguiden', url: 'https://www.1177.se/behandlingar--hjalpmedel/behandlingar-vid-psykiska-besvar/kognitiv-beteendeterapi-kbt/' }
		],
		faqs: [
			{
				question: 'Vad är tankeomstrukturering?',
				answer: 'Tankeomstrukturering innebär att du aktivt undersöker om en negativ tanke stämmer, och ersätter den med en mer realistisk och balanserad version.'
			},
			{
				question: 'Vilka är vanliga tankefällor?',
				answer: 'Katastrofiering ("det värsta kommer hända"), svartvitt tänkande och tankeläsning ("de tycker illa om mig") är vanliga mönster.'
			},
			{
				question: 'Hur börjar jag med tankeomstrukturering?',
				answer: 'Skriv ned den negativa tanken, fråga dig vilket bevis som finns för och emot den, och formulera sedan en mer nyanserad version.'
			}
		],
		relatedArticles: [
			{ title: 'Vad är KBT och hur fungerar det?', href: '/guider/kbt/vad-ar-kbt' },
			{ title: 'KBT-tekniker du kan använda hemma', href: '/guider/kbt/kbt-tekniker-hemma' },
			{ title: 'Övertänkande – när hjärnan inte stannar', href: '/guider/overtankande/nar-hjarnan-inte-stannar' }
		]
	},
	{
		pillarSlug: 'kbt',
		slug: 'beteendeaktivering',
		title: 'Beteendeaktivering – ta ett steg ut ur passiviteten',
		description: 'En central KBT-teknik vid nedstämdhet: hur små handlingar kan bryta den negativa spiralen.',
		updatedAt: '2026-03-21',
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/' },
			{ label: 'Psykisk hälsa – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		],
		faqs: [
			{
				question: 'Vad är beteendeaktivering?',
				answer: 'Beteendeaktivering handlar om att medvetet öka aktiviteter som ger glädje eller mening, även när motivationen saknas. Handling kan komma före känsla.'
			},
			{
				question: 'Varför fungerar beteendeaktivering vid depression?',
				answer: 'Depression skapar en spiral av passivitet och minskad njutning. Beteendeaktivering bryter den spiralen steg för steg.'
			},
			{
				question: 'Hur börjar jag?',
				answer: 'Välj en liten, konkret aktivitet (t.ex. en kort promenad) och gör den oavsett motivation. Följ upp hur du mådde efteråt.'
			}
		],
		relatedArticles: [
			{ title: 'Vad är KBT och hur fungerar det?', href: '/guider/kbt/vad-ar-kbt' },
			{ title: 'Nedstämdhet – varför orkar jag ingenting?', href: '/guider/depression/varfor-orkar-jag-ingenting' }
		]
	},
	{
		pillarSlug: 'kbt',
		slug: 'kbt-tekniker-hemma',
		title: 'KBT-tekniker du kan använda hemma',
		description: 'Fem konkreta KBT-baserade övningar du kan börja med direkt – utan terapeut.',
		updatedAt: '2026-03-21',
		sources: [
			{ label: 'KBT – 1177 Vårdguiden', url: 'https://www.1177.se/behandlingar--hjalpmedel/behandlingar-vid-psykiska-besvar/kognitiv-beteendeterapi-kbt/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Kan jag göra KBT utan terapeut?',
				answer: 'Många grundläggande tekniker går utmärkt att använda som självhjälp. För djupare problematik rekommenderas professionellt stöd.'
			},
			{
				question: 'Vilka KBT-tekniker passar bäst som självhjälp?',
				answer: 'Tankedagbok, beteendeaktivering, exponering i liten skala och andningsövningar är bra startpunkter.'
			},
			{
				question: 'Hur snabbt märker man effekt av KBT-övningar?',
				answer: 'Vissa märker skillnad inom dagar, men de flesta ser tydligare effekt efter 2–4 veckors regelbundet övande.'
			}
		],
		relatedArticles: [
			{ title: 'Vad är KBT och hur fungerar det?', href: '/guider/kbt/vad-ar-kbt' },
			{ title: 'Tankeomstrukturering – utmana negativa tankar', href: '/guider/kbt/tankeomstrukturering' },
			{ title: 'Beteendeaktivering – ta ett steg ur passiviteten', href: '/guider/kbt/beteendeaktivering' }
		]
	},
	{
		pillarSlug: 'kbt',
		slug: 'kbt-vid-angest',
		title: 'KBT vid ångest – hur det fungerar steg för steg',
		description: 'Hur KBT används specifikt för ångest: exponering, tankeanalys och gradvis träning.',
		updatedAt: '2026-03-21',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'KBT – 1177 Vårdguiden', url: 'https://www.1177.se/behandlingar--hjalpmedel/behandlingar-vid-psykiska-besvar/kognitiv-beteendeterapi-kbt/' }
		],
		faqs: [
			{
				question: 'Varför är KBT effektivt mot ångest?',
				answer: 'KBT hjälper dig att förstå och förändra de tankemönster och beteenden (som undvikande) som håller ångesten vid liv.'
			},
			{
				question: 'Vad är exponering i KBT?',
				answer: 'Exponering innebär att du gradvis och kontrollerat möter det du är rädd för, så att hjärnan lär sig att faran inte är reell.'
			},
			{
				question: 'Hur lång tid tar KBT för ångest?',
				answer: 'Vanligtvis 8–16 sessioner, men förbättring kan märkas tidigare med strukturerad självhjälp.'
			}
		],
		relatedArticles: [
			{ title: 'Vad är KBT och hur fungerar det?', href: '/guider/kbt/vad-ar-kbt' },
			{ title: 'Tecken på ångest', href: '/guider/angest/tecken' },
			{ title: 'KBT-tekniker du kan använda hemma', href: '/guider/kbt/kbt-tekniker-hemma' }
		]
	},
	{
		pillarSlug: 'panikattack',
		slug: 'vad-hander-i-kroppen',
		nextStepTool: '4-7-8-andning',
		title: 'Vad händer i kroppen vid en panikattack?',
		description:
			'Förstå varför en panikattack känns så skrämmande — och varför den inte är farlig. Lär dig om fight-or-flight, adrenalin och vad kroppen faktiskt gör.',
		seoTitle: 'Vad händer i kroppen vid en panikattack? | MittPsyke',
		seoDescription:
			'Förstå varför en panikattack känns så skrämmande — och varför den inte är farlig. Lär dig om fight-or-flight, adrenalin och vad kroppen faktiskt gör.',
		content: `## Snabbt svar

En panikattack är kroppens alarmsystem som slår på med full kraft — utan att det finns någon verklig fara. Hjärtat slår hårt, andningen blir snabb och det kan kännas som att du håller på att dö. Men det är inte farligt, även om det känns så. Kroppen gör exakt det den är byggd för att göra vid fara — problemet är bara att larmet går utan anledning.

## Varför händer det här?

Djupt inne i hjärnan sitter amygdala — en liten struktur som fungerar som kroppens vakthund. Dess uppgift är att upptäcka hot och starta en kedjereaktion som förbereder dig för att fly eller slåss. Det kallas fight-or-flight-responsen.

Vid en panikattack aktiveras det här systemet utan att det finns ett faktiskt hot. Stresshormoner som adrenalin och kortisol släpps ut i blodet, och på bara några sekunder händer flera saker samtidigt: hjärtat pumpar snabbare för att skicka blod till musklerna, andningen ökar för att ta in mer syre, matsmältningen stängs ner och musklerna spänns.

Allt det här är normala, friska reaktioner — de är bara påslagna vid fel tillfälle. Det är därför en panikattack kan kännas så överväldigande trots att inget farligt händer.

## Tecken att känna igen

En panikattack brukar komma plötsligt och nå sin topp inom tio minuter. Vanliga upplevelser är hjärtklappning eller bultande hjärta, svårighet att andas eller en känsla av att inte få luft, yrsel eller overklighetskänsla, svettningar, skakningar, illamående, domningar eller stickningar i händer och fötter, och en stark känsla av att något hemskt ska hända — som att dö, tappa kontrollen eller "bli galen".

Det är vanligt att förväxla det med hjärtproblem, och det är helt okej att söka vård om du är osäker. Men om du känner igen mönstret från tidigare kan det hjälpa att veta vad det är.

## Vad du kan göra steg för steg

Påminn dig själv om vad det är. Säg tyst eller högt: "Det här är en panikattack. Den går över. Jag är inte i fara." Det bryter den skrämmande tolkningen av det som händer.

Sakta ner andningen. Andas in genom näsan i fyra sekunder, håll i fyra sekunder, andas ut genom munnen i sex sekunder. Långsam utandning aktiverar det parasympatiska nervsystemet och hjälper kroppen lugna sig.

Förankra dig i nuet. Använd dina sinnen: vad ser du, hör du, känner du mot huden? Det här flyttar uppmärksamheten bort från de inre larmsignalerna.

Rör dig inte bort. Om du är på en plats som känns obehaglig, försök stanna kvar tills attacken klingar av. Att fly förstärker hjärnans uppfattning att platsen var farlig.

Var snäll mot dig själv efteråt. En panikattack tar energi. Det är normalt att känna sig trött, skakig eller känslomässigt tom efteråt. Ge dig själv tid.

## Vanliga misstag att undvika

Att börja undvika platser eller situationer där du fått en attack. Det minskar ångesten kortsiktigt men gör den starkare på sikt. Att googla symtom mitt i attacken. Det förstärker ofta rädslan istället för att lugna. Att kämpa emot eller försöka "tvinga bort" attacken. Motstånd ökar spänningen. Att låta den passera fungerar bättre.

## När du bör söka mer stöd

Om panikattackerna kommer ofta, om du börjar undvika saker i vardagen på grund av rädslan för att få en attack, eller om du känner att det påverkar ditt liv — då är det klokt att prata med någon. En vårdcentral är en bra start, och KBT har starkt stöd som behandling vid panikångest. MittPsyke ersätter inte vård, men kan vara ett steg på vägen: att skriva av dig, sortera tankar och hitta mönster.

## Relaterat

Relaterade guider: <a href="/guider/angest">/guider/angest</a> (artikeln "vad händer i kroppen")

## Prova en övning

Övningslänkar: <a href="/ovningar/4-7-8-andning">/ovningar/4-7-8-andning</a>, <a href="/ovningar/grounding-5-4-3-2-1">/ovningar/grounding-5-4-3-2-1</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Vad händer i kroppen vid en panikattack?',
				answer:
					'En panikattack är kroppens alarmsystem som slår på med full kraft — utan att det finns någon verklig fara. Hjärtat slår hårt, andningen blir snabb och det kan kännas som att du håller på att dö. Men det är inte farligt, även om det känns så. Kroppen gör exakt det den är byggd för att göra vid fara — problemet är bara att larmet går utan anledning.'
			}
		],
		relatedArticles: [
			{
				title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det',
				href: '/guider/angest/panikangest-och-kroppen'
			}
		]
	},
	{
		pillarSlug: 'panikattack',
		slug: 'ta-dig-igenom-en-panikattack',
		nextStepTool: 'grounding-5-4-3-2-1',
		title: 'Hur du tar dig igenom en panikattack – steg för steg',
		description:
			'Praktiska steg du kan använda mitt i en panikattack. Andning, grounding och hur du hjälper kroppen lugna sig.',
		seoTitle: 'Hur du tar dig igenom en panikattack – steg för steg | MittPsyke',
		seoDescription:
			'Praktiska steg du kan använda mitt i en panikattack. Andning, grounding och hur du hjälper kroppen lugna sig.',
		content: `## Snabbt svar

Du kan inte stoppa en panikattack med vilja, men du kan hjälpa kroppen ta sig igenom den snabbare och med mindre lidande. Nyckeln är att inte kämpa emot — utan att möta det som händer med lugna, enkla steg.

## Varför händer det här?

När kroppen går in i panikläge kopplas det rationella tänkandet delvis bort. Amygdala har tagit över och kroppen agerar som om du är i livsfara. Det betyder att komplicerade strategier inte fungerar — du behöver enkla, konkreta saker att göra med kroppen. Det är därför andning och sinnesförankring fungerar: de ger nervsystemet en signal att faran inte är verklig.

## Vad du kan göra steg för steg

Steg 1 — Stanna där du är. Sätt dig ner om du kan. Att fly från platsen lär hjärnan att platsen var farlig, vilket ökar risken för nästa attack.

Steg 2 — Namnge det. Säg för dig själv: "Det här är en panikattack. Den är obehaglig men inte farlig. Den kommer gå över." Att sätta ord på upplevelsen aktiverar prefrontala cortex och dämpar amygdalas larm.

Steg 3 — Andas med magen. Lägg en hand på magen. Andas in genom näsan så att magen höjer sig — inte bröstet. Andas in i fyra sekunder, ut genom munnen i sex sekunder. Fokusera bara på utandningen. Upprepa i minst en minut.

Steg 4 — Använd 5-4-3-2-1. Namnge fem saker du ser, fyra du kan röra vid, tre du hör, två du kan lukta och en du kan smaka. Det tvingar hjärnan att bearbeta sinnesintryck istället för hotbilder.

Steg 5 — Vänta ut den. De flesta panikattacker varar mellan fem och tjugo minuter. Det känns längre, men det går över. Du behöver inte göra något mer — bara låta kroppen varva ner.

Steg 6 — Efteråt: vila. Drick vatten, sätt dig bekvämt, gör något lugnt. Undvik att direkt analysera vad som hände — det kan starta en ny ångestcykel. Ge det lite tid.

## Tecken att känna igen

Du vet att det är en panikattack och inte något annat om du känner igen mönstret: plötslig start, topp inom minuter, kombination av hjärtklappning, andnöd och overklighetskänsla, och att det går över av sig självt. Om du är osäker — särskilt första gången — sök vård för att utesluta andra orsaker.

## Vanliga misstag att undvika

Att hyperventilera medvetet för att "få mer luft". Det förvärrar symptomen. Fokusera på långsam utandning istället. Att ringa någon och prata snabbt och intensivt. Om du ringer någon, be dem prata lugnt. Att ta till alkohol eller lugnande medel som standardlösning. Det fungerar kortsiktigt men bygger beroende och undvikande.

## När du bör söka mer stöd

Om du behöver hjälp att hantera återkommande attacker finns det effektiv behandling. KBT vid panikångest har starkt forskningsstöd och fokuserar på att bryta kopplingen mellan kroppsliga sensationer och katastroftankar.

## Relaterat

Relaterade artiklar: <a href="/guider/panikattack/vad-hander-i-kroppen">vad-hander-i-kroppen</a> (i samma kategori)

## Prova en övning

Övningslänkar: <a href="/ovningar/4-7-8-andning">/ovningar/4-7-8-andning</a>, <a href="/ovningar/grounding-5-4-3-2-1">/ovningar/grounding-5-4-3-2-1</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Hur du tar dig igenom en panikattack – steg för steg',
				answer:
					'Du kan inte stoppa en panikattack med vilja, men du kan hjälpa kroppen ta sig igenom den snabbare och med mindre lidande. Nyckeln är att inte kämpa emot — utan att möta det som händer med lugna, enkla steg.'
			}
		],
		relatedArticles: [{ title: 'Vad händer i kroppen vid en panikattack?', href: '/guider/panikattack/vad-hander-i-kroppen' }]
	},
	{
		pillarSlug: 'panikattack',
		slug: 'panikattack-eller-hjartinfarkt',
		nextStepTool: 'body-scan',
		title: 'Panikattack eller hjärtinfarkt – hur vet jag skillnaden?',
		description:
			'Hjärtklappning, bröstsmärta och andnöd — är det panik eller hjärtat? Lär dig skilja på symtomen och när du ska söka vård.',
		seoTitle: 'Panikattack eller hjärtinfarkt – hur vet jag skillnaden? | MittPsyke',
		seoDescription:
			'Hjärtklappning, bröstsmärta och andnöd — är det panik eller hjärtat? Lär dig skilja på symtomen och när du ska söka vård.',
		content: `## Snabbt svar

Panikattacker och hjärtproblem kan kännas förvillande lika — särskilt bröstsmärta, hjärtklappning och andnöd förekommer i båda. Men det finns skillnader i hur symtomen beter sig. Om du är osäker ska du alltid söka vård. Det är aldrig fel att låta sig undersökas.

## Varför händer det här?

Rädslan för hjärtinfarkt under en panikattack är en av de vanligaste upplevelserna. Det beror på att panikattacken faktiskt påverkar hjärtat — det slår snabbare och hårdare på grund av adrenalin. Bröstsmärtan vid panik kommer oftast från spända muskler i bröstkorgen och ändrad andning, inte från hjärtat självt. Men det är omöjligt att veta säkert bara genom att känna efter — det är därför vården finns.

## Tecken att känna igen

Vid en panikattack brukar smärtan vara skarp eller stickande, lokaliserad till ett litet område, och förvärras av andning eller rörelse. Den kommer plötsligt, når en topp snabbt och klingar av inom 10–20 minuter. Ofta följer den av starka känslor av rädsla, overklighetskänsla och stickningar i händerna.

Vid hjärtproblem beskrivs smärtan ofta som tryckande, tung eller kramande, spridd över ett större område — ibland med utstrålning till arm, käke eller rygg. Den kan komma gradvis och vara kopplad till fysisk ansträngning. Illamående, kallsvett och andfåddhet utan tydlig ångestkomponent kan förekomma.

Det finns överlapp, och listor som dessa är förenklingar. De ersätter inte medicinsk bedömning.

## Vad du kan göra steg för steg

Om du tror att det kan vara hjärtat: ring 112. Det är alltid rätt att söka akut hjälp om du är osäker. Sjukvården föredrar att undersöka en panikattack framför att missa ett hjärtproblem.

Om du känner igen mönstret som panik: använd andning och grounding enligt de andra artiklarna i den här guiden. Påminn dig om att du har klarat det förut.

Om det är första gången: sök vård. Inte för att det är farligt — utan för att det ger trygghet att veta vad det är. Många som får sin första panikattack tror genuint att de ska dö. Att få en medicinsk bedömning minskar rädslan inför nästa gång.

## Vanliga misstag att undvika

Att aldrig söka vård och bara anta att det är panik. Särskilt om mönstret ändrar sig — kontrollera med vården. Att hamna i en loop av akutbesök utan uppföljning. Be om remiss till psykolog eller psykiatri.

## När du bör söka mer stöd

Om oron för hjärtat har blivit en del av din vardag, om du undviker fysisk aktivitet av rädsla eller om du ofta kollar pulsen — då har ångesten tagit sig ett nytt uttryck. KBT med fokus på hälsoångest kan hjälpa.

## Relaterat

Relaterade artiklar: <a href="/guider/panikattack/ta-dig-igenom-en-panikattack">ta-dig-igenom-en-panikattack</a> (i samma kategori)

## Prova en övning

Övningslänkar: <a href="/ovningar/4-7-8-andning">/ovningar/4-7-8-andning</a>, <a href="/ovningar/body-scan">/ovningar/body-scan</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Panikattack eller hjärtinfarkt – hur vet jag skillnaden?',
				answer:
					'Panikattacker och hjärtproblem kan kännas förvillande lika — särskilt bröstsmärta, hjärtklappning och andnöd förekommer i båda. Men det finns skillnader i hur symtomen beter sig. Om du är osäker ska du alltid söka vård. Det är aldrig fel att låta sig undersökas.'
			}
		],
		relatedArticles: [
			{
				title: 'Hur du tar dig igenom en panikattack – steg för steg',
				href: '/guider/panikattack/ta-dig-igenom-en-panikattack'
			}
		]
	},
	{
		pillarSlug: 'panikattack',
		slug: 'panikattacker-pa-natten',
		nextStepTool: 'body-scan',
		title: 'Panikattacker på natten – varför händer det och vad du kan göra',
		description:
			'Vaknar du med hjärtklappning och ångest? Förstå nattliga panikattacker och få konkreta tips för att hantera dem.',
		seoTitle: 'Panikattacker på natten – varför händer det och vad du kan göra | MittPsyke',
		seoDescription:
			'Vaknar du med hjärtklappning och ångest? Förstå nattliga panikattacker och få konkreta tips för att hantera dem.',
		content: `## Snabbt svar

Panikattacker kan komma mitt i natten, helt utan förvarning. Du vaknar med hjärtklappning, svettningar och en intensiv känsla av fara — ofta utan att ha haft en mardröm. Det är skrämmande, men det är samma mekanism som dagtid: kroppen startar ett falskt alarm. Att det händer på natten gör det inte farligare.

## Varför händer det här?

Under sömnen bearbetar hjärnan stress och intryck från dagen. Ibland aktiveras amygdala i den processen — särskilt om du bär på underliggande stress, har gått och lagt dig med hög ångestnivå, eller har en period med mycket press.

Det kan också kopplas till rent fysiska faktorer: refluks, sömnapné eller att kroppen skiftar mellan sömnfaser. Övergången mellan djupsömn och lättare sömn är ett sårbart fönster där kroppen kan misstolka interna signaler som hot.

En nattlig panikattack är inte ett tecken på att något är mer allvarligt — men den upplevs ofta som värre eftersom du vaknar desorienterad.

## Vad du kan göra steg för steg

Tänd en dämpad lampa. Mörker förstärker overklighetskänslan. Mjukt ljus hjälper hjärnan orientera sig.

Sätt dig upp i sängen. Det ändrar kroppens läge och ger en fysisk signal om att du är vaken och trygg.

Andas långsamt. Samma teknik som dagtid: in genom näsan, ut genom munnen, fokusera på att utandningen är längre än inandningen.

Förankra dig. Känn lakanet, madrassen, kudden. Säg för dig själv var du är. "Jag ligger i min säng. Klockan är halv tre. Jag är trygg."

Stå inte upp och börja göra saker direkt. Stanna i sängen tills kroppen har varvar ner.

Om du inte kan somna om efter 20–30 minuter, gå upp och gör något stillsamt i dämpad belysning tills du känner dig sömnig igen.

## Vanliga misstag att undvika

Att börja vara rädd för att somna — det skapar en ond cirkel. Att kolla telefonen direkt — starkt ljus aktiverar hjärnan. Att dricka alkohol som sömnhjälp — det stör sömnkvaliteten och kan öka risken.

## När du bör söka mer stöd

Om nattliga panikattacker händer regelbundet, om du utvecklar sömnångest eller om din sömn påverkas så mycket att det märks på dagen — prata med en läkare. KBT vid panikångest och sömnproblem har god effekt.

## Relaterat

Relaterade guider: <a href="/guider/sovproblem">/guider/sovproblem</a>

## Prova en övning

Övningslänkar: <a href="/ovningar/body-scan">/ovningar/body-scan</a>, <a href="/ovningar/4-7-8-andning">/ovningar/4-7-8-andning</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Panikattacker på natten – varför händer det och vad du kan göra',
				answer:
					'Panikattacker kan komma mitt i natten, helt utan förvarning. Du vaknar med hjärtklappning, svettningar och en intensiv känsla av fara — ofta utan att ha haft en mardröm. Det är skrämmande, men det är samma mekanism som dagtid: kroppen startar ett falskt alarm. Att det händer på natten gör det inte farligare.'
			}
		],
		relatedArticles: [{ title: 'Sömnproblem', href: '/guider/sovproblem' }]
	},
	{
		pillarSlug: 'panikattack',
		slug: 'sluta-vara-radd-for-panikattacker',
		nextStepTool: 'trygghetscirkel-exponering',
		title: 'Sluta vara rädd för panikattacker – bryt undvikandet',
		description:
			'Rädslan för nästa panikattack kan bli värre än attacken själv. Lär dig hur undvikande håller ångesten vid liv och hur du bryter mönstret.',
		seoTitle: 'Sluta vara rädd för panikattacker – bryt undvikandet | MittPsyke',
		seoDescription:
			'Rädslan för nästa panikattack kan bli värre än attacken själv. Lär dig hur undvikande håller ångesten vid liv och hur du bryter mönstret.',
		content: `## Snabbt svar

Det värsta med panikattacker är ofta inte själva attacken — utan rädslan för att den ska komma igen. Den rädslan kan sakta krympa ditt liv: du undviker platser, situationer och upplevelser för att slippa riskera det. Men just undvikandet är det som håller panikångesten vid liv. Att våga närma sig det obehagliga — i din egen takt — är vägen ut.

## Varför händer det här?

Efter en eller flera panikattacker börjar hjärnan leta efter mönster. "Var var jag? Vad gjorde jag? Hur kan jag undvika att det händer igen?" Det är logiskt tänkande — men det leder fel. Hjärnan kopplar ihop attacken med platsen eller situationen, och du börjar undvika.

Problemet är att undvikande bekräftar hotet. Varje gång du undviker en plats och inte får en attack tänker hjärnan: "Vi undvek och det gick bra — alltså var platsen farlig." Rädslan förstärks, och nästa gång behöver du undvika ännu mer.

Det här kallas vidmakthållande genom undvikande, och det är kärnan i panikångest som diagnos — inte själva attackerna, utan rädslan för dem och anpassningarna du gör.

## Tecken att känna igen

Du planerar aktiviteter utifrån "vad om jag får panik där?". Du har slutat göra saker du brukade göra. Du känner dig säkrare hemma och vill helst inte gå ut ensam. Du scannar kroppen efter tidiga tecken på panik.

## Vad du kan göra steg för steg

Förstå mekanismen. Undvikande = kortsiktig lättnad + långsiktig förstärkning.

Börja med det minst skrämmande. Gör en lista över situationer du undviker, rangordna dem från "lite obehagligt" till "omöjligt". Börja i den milda änden. Det här kallas exponering.

Stanna kvar i situationen. Gå inte därifrån när ångesten stiger. Vänta tills den når sin topp och sedan börjar sjunka. Det är den erfarenheten som lär hjärnan: "Det var obehagligt, men det gick."

Upprepa. Varje gång du stannar kvar och överlever den obehagliga känslan försvagas kopplingen.

Fira det du gör, inte hur det känns. Målet är inte att det ska kännas bra — det är att du gör det trots att det känns jobbigt.

## Vanliga misstag att undvika

Att göra för mycket för snabbt. Exponering ska vara gradvis. Att använda "säkerhetsbeteenden" som krycka — alltid ha med en viss person, sitta närmast utgången. Att ge upp efter en dålig dag. Bakslag ingår.

## När du bör söka mer stöd

Exponering på egen hand fungerar för många, men om ditt undvikande är utbrett kan en psykolog med KBT-inriktning göra stor skillnad. Guidad exponering med professionellt stöd är en av de mest effektiva behandlingarna som finns för panikångest.

## Relaterat

Relaterade guider: <a href="/guider/angest">/guider/angest</a> (artikeln om exponering och undvikande)

## Prova en övning

Övningslänkar: <a href="/ovningar/trygghetscirkel-exponering">/ovningar/trygghetscirkel-exponering</a>, <a href="/ovningar/cbt-katastroftankar">/ovningar/cbt-katastroftankar</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Sluta vara rädd för panikattacker – bryt undvikandet',
				answer:
					'Det värsta med panikattacker är ofta inte själva attacken — utan rädslan för att den ska komma igen. Den rädslan kan sakta krympa ditt liv: du undviker platser, situationer och upplevelser för att slippa riskera det. Men just undvikandet är det som håller panikångesten vid liv. Att våga närma sig det obehagliga — i din egen takt — är vägen ut.'
			}
		],
		relatedArticles: [{ title: 'Ångest', href: '/guider/angest' }]
	},
	{
		pillarSlug: 'overtankande',
		slug: 'varfor-hjarnan-fastnar-i-loopar',
		nextStepTool: 'daglig-reflektionsmall',
		title: 'Varför hjärnan fastnar i loopar – om grubblande och ältande',
		description:
			'Förstå varför du tänker samma tankar om och om igen. Lär dig skillnaden mellan grubblande och problemlösning — och hur du bryter loopen.',
		seoTitle: 'Varför hjärnan fastnar i loopar – om grubblande och ältande | MittPsyke',
		seoDescription:
			'Förstå varför du tänker samma tankar om och om igen. Lär dig skillnaden mellan grubblande och problemlösning — och hur du bryter loopen.',
		content: `## Snabbt svar

Grubblande känns som tänkande — men det är det inte. Riktigt tänkande leder någonstans: du analyserar, drar slutsatser, fattar beslut. Grubblande snurrar runt samma punkt utan att komma vidare. Hjärnan fastnar i en loop för att den tror att den löser ett problem — men i verkligheten bearbetar den en känsla, och känslor löser man inte genom att tänka hårdare.

## Varför händer det här?

Hjärnan är byggd för att upptäcka och lösa problem. Det är en av dess viktigaste funktioner. Men ibland stöter den på något den inte kan lösa med logik: en relation som tog slut, en kommentar som gjorde ont, en framtid som är osäker. Då fortsätter den ändå att "jobba" — inte för att det hjälper, utan för att det är det enda verktyg den har.

Forskningen skiljer på två typer av repetitivt tänkande. Oro handlar om framtiden: "Tänk om det går fel?" Ältande (rumination) handlar om det förflutna: "Varför sa jag så? Vad är fel på mig?" Båda skapar en illusion av kontroll. Men effekten är den motsatta: ju mer du grubblar, desto mer fastnar du.

Ältande har i forskning visat sig vara en av de starkaste vidmakthållandefaktorerna vid depression. Det är inte bara ett symptom — det är en motor som håller måendet nere.

## Tecken att känna igen

Du tänker på samma sak upprepade gånger utan att komma fram till något nytt. Du ställer dig frågor du inte kan svara på. Du känner dig mer utmattad ju mer du tänker. Du kan ha svårt att vara närvarande.

## Vad du kan göra steg för steg

Märk att du grubblar. Det första steget är att se det som händer: "Jag löser inte ett problem just nu — jag snurrar." Ingen kritik, bara observation.

Fråga dig: leder det här mig framåt? Om svaret är nej, ge dig själv tillåtelse att släppa det för nu.

Bryt med kroppen. Ältande sitter i huvudet. Att göra något fysiskt — gå en promenad, diska, stretcha — ger hjärnan något annat att bearbeta.

Skriv ner det. Ibland behöver tankarna ta sig ut ur huvudet för att sluta snurra.

Schemalägg din oro. Sätt av 15 minuter per dag till "grubbeltid". När tankar dyker upp utanför den tiden, säg: "Det tar jag under min grubbeltid." Forskning visar att det minskar den totala tiden du lägger på oro.

## Vanliga misstag att undvika

Att försöka tänka dig ur grubblandet. Att vara hård mot dig själv för att du grubblar. Att tro att alla tankar är värda att följa.

## När du bör söka mer stöd

Om grubblandet upptar stora delar av din dag, om det påverkar din sömn eller din förmåga att fungera, eller om det är kopplat till ihållande nedstämdhet — prata med någon. KBT och metakognitiv terapi har båda starkt stöd.

## Relaterat

Relaterade guider: <a href="/guider/depression">/guider/depression</a>

## Prova en övning

Övningslänkar: <a href="/ovningar/daglig-reflektionsmall">/ovningar/daglig-reflektionsmall</a>, <a href="/ovningar/tankefallor-kartlaggning">/ovningar/tankefallor-kartlaggning</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Varför hjärnan fastnar i loopar – om grubblande och ältande',
				answer:
					'Grubblande känns som tänkande — men det är det inte. Riktigt tänkande leder någonstans: du analyserar, drar slutsatser, fattar beslut. Grubblande snurrar runt samma punkt utan att komma vidare. Hjärnan fastnar i en loop för att den tror att den löser ett problem — men i verkligheten bearbetar den en känsla, och känslor löser man inte genom att tänka hårdare.'
			}
		],
		relatedArticles: [{ title: 'Nedstämdhet och depression', href: '/guider/depression' }]
	},
	{
		pillarSlug: 'overtankande',
		slug: 'sluta-overtanka-pa-kvallen',
		nextStepTool: 'dagens-avslut-reflektion',
		title: 'Sluta övertänka på kvällen – tips för lugna kvällar',
		description:
			'Tankarna som exploderar när du lägger dig. Förstå varför kvällen är värst och få praktiska tips för att bryta mönstret.',
		seoTitle: 'Sluta övertänka på kvällen – tips för lugna kvällar | MittPsyke',
		seoDescription:
			'Tankarna som exploderar när du lägger dig. Förstå varför kvällen är värst och få praktiska tips för att bryta mönstret.',
		content: `## Snabbt svar

Kvällen är hjärnans bästa tid för grubblande. Under dagen har du distraktioner. Men när du lägger dig och det blir tyst finns det inget som konkurrerar med tankarna. Allt du tryckt undan under dagen bubblar upp. Det är inte ett tecken på att något är fel med dig — det är ett tecken på att din hjärna äntligen har utrymme att bearbeta.

## Varför händer det här?

Under dagen använder du din arbetsminneskapacitet till att hantera uppgifter. Obearbetade tankar läggs åt sidan. På kvällen frigörs kapaciteten — och de obearbetade sakerna tar plats.

Dessutom påverkar dygnsrytmen hur du mår. Kortisolnivåerna sjunker naturligt på kvällen, vilket gör dig mindre "skyddad" mot negativa tankar. Tröttheten i sig gör också att du har sämre impulskontroll.

Det är en kombination av tre saker: tysta omgivningar, frigjord mental kapacitet och lågt kortisol.

## Vad du kan göra steg för steg

Skapa en "stängningsrutin" på kvällen. Minst 30 minuter före sängen: inga skärmar med starkt ljus, inget jobbigt innehåll, inga beslut.

Gör en "tankedump" innan du lägger dig. Skriv ner allt som snurrar i huvudet. Syftet är att flytta tankarna från huvudet till något utanför dig.

Använd schemalagd grubbeltid. Om du vet att du har 15 minuter mitt på dagen för att grubbla, blir det lättare att säga "inte nu" på kvällen.

Andas dig till sömn. 4-7-8-tekniken: andas in i 4 sekunder, håll i 7, andas ut i 8.

Lyssna på något. Podd, ljudbok eller bakgrundsljud med låg intensitet kan ge hjärnan precis tillräckligt med input för att sluta producera egna tankar.

## Vanliga misstag att undvika

Att använda telefonen i sängen. Att ligga kvar och "försöka somna" i timmar. Att dricka alkohol för att slappna av.

## När du bör söka mer stöd

Om sömnproblemen är ihållande, om du sover under sex timmar regelbundet eller om det börjar påverka ditt dagliga fungerande. KBT för insomni (KBT-i) har god effekt.

## Relaterat

Relaterade guider: <a href="/guider/sovproblem">/guider/sovproblem</a>

## Prova en övning

Övningslänkar: <a href="/ovningar/dagens-avslut-reflektion">/ovningar/dagens-avslut-reflektion</a>, <a href="/ovningar/4-7-8-andning">/ovningar/4-7-8-andning</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Sluta övertänka på kvällen – tips för lugna kvällar',
				answer:
					'Kvällen är hjärnans bästa tid för grubblande. Under dagen har du distraktioner. Men när du lägger dig och det blir tyst finns det inget som konkurrerar med tankarna. Allt du tryckt undan under dagen bubblar upp. Det är inte ett tecken på att något är fel med dig — det är ett tecken på att din hjärna äntligen har utrymme att bearbeta.'
			}
		],
		relatedArticles: [{ title: 'Sömnproblem', href: '/guider/sovproblem' }]
	},
	{
		pillarSlug: 'overtankande',
		slug: 'skillnaden-mellan-oro-och-altande',
		nextStepTool: 'cbt-katastroftankar',
		title: 'Oro vs ältande – vad är skillnaden och varför spelar det roll?',
		description:
			'Oro riktar sig framåt, ältande bakåt. Förstå skillnaden och varför det avgör vilka strategier som fungerar.',
		seoTitle: 'Oro vs ältande – vad är skillnaden och varför spelar det roll? | MittPsyke',
		seoDescription:
			'Oro riktar sig framåt, ältande bakåt. Förstå skillnaden och varför det avgör vilka strategier som fungerar.',
		content: `## Snabbt svar

Oro och ältande känns lika — båda är repetitiva, påträngande och energikrävande. Men de pekar åt olika håll. Oro handlar om framtiden: "Tänk om det går fel?" Ältande handlar om det förflutna: "Varför blev det så?" Skillnaden spelar roll eftersom de drivs av olika mekanismer och bäst hanteras med delvis olika strategier.

## Varför händer det här?

Oro är hjärnans försök att förbereda sig för hot. Ältande är hjärnans försök att förstå vad som gick fel. Gemensamt är att båda ger en illusion av kontroll. Men forskningen visar att varken oro eller ältande leder till bättre problemlösning — tvärtom försämrar de förmågan att tänka klart.

## Tecken att känna igen

Oro: du tänker i "tänk om"-termer, kroppen är spänd, du söker ständigt bekräftelse.
Ältande: du tänker i "varför"-termer, du känner skuld eller skam, du återupplever situationer.
Ofta har man båda — de kan mata varandra.

## Vad du kan göra steg för steg

Identifiera vilken typ det är. Fråga dig: tänker jag framåt eller bakåt?

Vid oro — testa katastroftänk-övningen. Skriv ner det värsta, det bästa och det mest sannolika.

Vid ältande — ställ dig frågan: finns det något jag kan göra åt det här just nu? Om ja: gör det. Om nej: öva på att släppa.

Externalisera. Skriv ner det du tänker. Tankar ser ofta mindre hotfulla ut i skrift.

Byt kanal medvetet. Att göra något som kräver koncentration slår av hjärnans "standardnätverk" som driver grubblande.

## Vanliga misstag att undvika

Att behandla all oro som ältande eller tvärtom. Att försöka "tänka positivt". Att tro att grubblande = djupt tänkande.

## När du bör söka mer stöd

Långvarigt ältande är starkt kopplat till depression. Kronisk oro kan vara generaliserat ångestsyndrom (GAD). Sök hjälp om det upptar stora delar av dagen.

## Relaterat

Relaterade guider: <a href="/guider/angest">/guider/angest</a>, <a href="/guider/depression">/guider/depression</a>

## Prova en övning

Övningslänkar: <a href="/ovningar/cbt-katastroftankar">/ovningar/cbt-katastroftankar</a>, <a href="/ovningar/sju-fragor-vid-oro">/ovningar/sju-fragor-vid-oro</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Oro vs ältande – vad är skillnaden och varför spelar det roll?',
				answer:
					'Oro och ältande känns lika — båda är repetitiva, påträngande och energikrävande. Men de pekar åt olika håll. Oro handlar om framtiden: "Tänk om det går fel?" Ältande handlar om det förflutna: "Varför blev det så?" Skillnaden spelar roll eftersom de drivs av olika mekanismer och bäst hanteras med delvis olika strategier.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest', href: '/guider/angest' },
			{ title: 'Nedstämdhet och depression', href: '/guider/depression' }
		]
	},
	{
		pillarSlug: 'overtankande',
		slug: 'mindfulness-mot-overtankande',
		nextStepTool: 'grounding-5-4-3-2-1',
		title: 'Mindfulness mot övertänkande – enkla övningar som bryter loopen',
		description:
			'Mindfulness handlar inte om att sluta tänka. Det handlar om att sluta följa varje tanke. Lär dig hur det kan hjälpa mot grubblande.',
		seoTitle: 'Mindfulness mot övertänkande – enkla övningar som bryter loopen | MittPsyke',
		seoDescription:
			'Mindfulness handlar inte om att sluta tänka. Det handlar om att sluta följa varje tanke. Lär dig hur det kan hjälpa mot grubblande.',
		content: `## Snabbt svar

Mindfulness handlar inte om att tömma huvudet på tankar — det handlar om att ändra din relation till dem. Istället för att följa varje tanke till dess slutsats lär du dig att se den komma, låta den vara och låta den gå. Det bryter grubblarmönstret inte genom kraft, utan genom att du slutar mata det med uppmärksamhet.

## Varför händer det här?

Övertänkande drivs av att du tar varje tanke på allvar. En tanke dyker upp och du börjar analysera, utvärdera, döma. Tanken får energi och växer. Mindfulness bryter den kedjan vid det första steget. Den lär dig att en tanke bara är en tanke — inte en sanning, inte ett krav på handling, inte du.

Forskning visar att mindfulnessbaserade interventioner minskar ältande och grubblande, och att effekten verkar vara kopplad just till förmågan att inte reagera automatiskt på varje tanke.

## Vad du kan göra steg för steg

Börja med andningen. Sätt dig i en minut och lägg märke till din andning. Inte ändra den — bara observera. När en tanke kommer, märk det och gå tillbaka till andningen.

Namnge tanken. Säg tyst: "Där är grubblandet." Att namnge aktiverar prefrontala cortex och minskar amygdalas reaktivitet.

Använd en ankare. Välj en vardagsaktivitet och bestäm att under den ska du bara vara i det du gör.

Prova "tanke som moln"-metaforen. Föreställ dig att dina tankar är moln som driver förbi. Du behöver inte följa dem, stoppa dem eller bedöma dem.

Bygg på gradvis. En minut om dagen är en bra start. Det är en färdighet som stärks av upprepning, inte av intensitet.

## Vanliga misstag att undvika

Att tro att mindfulness betyder att sluta tänka. Att bedöma dig själv när du tappar fokus. Att använda mindfulness som ytterligare ett prestandakrav.

## När du bör söka mer stöd

Mindfulness är ett verktyg, inte en behandling. Om ditt grubblande är kopplat till depression, ångest eller trauma, behöver du fler verktyg. MBKT eller KBT kan ge den strukturen.

## Relaterat

Relaterade guider: <a href="/guider/angest">/guider/angest</a>

## Prova en övning

Övningslänkar: <a href="/ovningar/grounding-5-4-3-2-1">/ovningar/grounding-5-4-3-2-1</a>, <a href="/ovningar/body-scan">/ovningar/body-scan</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'Mindfulness mot övertänkande – enkla övningar som bryter loopen',
				answer:
					'Mindfulness handlar inte om att tömma huvudet på tankar — det handlar om att ändra din relation till dem. Istället för att följa varje tanke till dess slutsats lär du dig att se den komma, låta den vara och låta den gå. Det bryter grubblarmönstret inte genom kraft, utan genom att du slutar mata det med uppmärksamhet.'
			}
		],
		relatedArticles: [{ title: 'Ångest', href: '/guider/angest' }]
	},
	{
		pillarSlug: 'overtankande',
		slug: 'nar-overtankande-blir-ett-problem',
		nextStepTool: 'daglig-reflektionsmall',
		title: 'När övertänkande blir ett problem – tecken och vad du kan göra',
		description:
			'Alla övertänker ibland. Men när det tar över din dag, din sömn och din energi kan det vara dags att ta det på allvar.',
		seoTitle: 'När övertänkande blir ett problem – tecken och vad du kan göra | MittPsyke',
		seoDescription:
			'Alla övertänker ibland. Men när det tar över din dag, din sömn och din energi kan det vara dags att ta det på allvar.',
		content: `## Snabbt svar

Alla grubblar ibland — det är normalt. Men det finns en punkt där övertänkande slutar vara en tillfällig reaktion och blir ett mönster som äter av din energi, din sömn och ditt dagliga fungerande. Om du befinner dig där är det inte ett tecken på svaghet — det är ett tecken på att hjärnan fastnat i ett spår som du kan behöva hjälp att ta dig ur.

## Varför händer det här?

Övertänkande som mönster utvecklas ofta gradvis. Det börjar med en stressig period, en förlust eller osäkerhet. Hjärnan gör det den kan: den tänker. Men när tänkandet inte löser problemet, fortsätter den ändå — och med tiden blir grubblandet ett standardläge.

Forskningen visar att ältande och kronisk oro har starka kopplingar till depression och ångestsyndrom. De förstärker varandra.

## Tecken att känna igen

Grubblandet upptar flera timmar per dag. Svårt att fokusera. Sover sämre. Mentalt uttömd utan fysisk ansträngning. Undviker situationer som triggar grubblande. Ihållande nedstämdhet, irritation, hopplöshet.

## Vad du kan göra steg för steg

Kartlägg ditt mönster. Skriv ner när du grubblar mest, vad som triggar det och hur länge det pågår.

Testa en strategi från de andra artiklarna i guiden. Börja med en sak och ge det en vecka.

Prata med någon du litar på. Att sätta ord på det muntligt kan bryta isoleringen.

Överväg professionell hjälp. Om du har provat själv och det inte räcker — sök hjälp. Det är exakt vad hjälpen finns till för.

## Vanliga misstag att undvika

Att vänta tills det "blir tillräckligt illa". Att tro att du bara behöver "tänka rätt". Att isolera dig — grubblande trivs i ensamhet.

## När du bör söka mer stöd

Sök professionell hjälp om du känner ihållande nedstämdhet eller hopplöshet, om grubblandet har pågått i flera veckor utan förbättring, om du har svårt att arbeta, sova eller upprätthålla relationer, eller om du har tankar om att skada dig själv. Ring 112 vid akut fara. Vårdråd: 1177. Samtalsstöd: Mind-linjen.

MittPsyke är inte vård — men det kan vara ett verktyg vid sidan av: att skriva, reflektera och börja se mönster.

## Relaterat

Relaterade guider: <a href="/guider/depression">/guider/depression</a>, <a href="/guider/stress">/guider/stress</a>

## Prova en övning

Övningslänkar: <a href="/ovningar/daglig-reflektionsmall">/ovningar/daglig-reflektionsmall</a>, <a href="/ovningar/sjalvmedkansla-ovning">/ovningar/sjalvmedkansla-ovning</a>`,
		updatedAt: '2026-04-12',
		faqs: [
			{
				question: 'När övertänkande blir ett problem – tecken och vad du kan göra',
				answer:
					'Alla grubblar ibland — det är normalt. Men det finns en punkt där övertänkande slutar vara en tillfällig reaktion och blir ett mönster som äter av din energi, din sömn och ditt dagliga fungerande. Om du befinner dig där är det inte ett tecken på svaghet — det är ett tecken på att hjärnan fastnat i ett spår som du kan behöva hjälp att ta dig ur.'
			}
		],
		relatedArticles: [
			{ title: 'Nedstämdhet och depression', href: '/guider/depression' },
			{ title: 'Stress och överbelastning', href: '/guider/stress' }
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

export const pillarLandingPages: Partial<Record<Pillar['slug'], SeoLandingPage>> = {
	angest: {
		pillarSlug: 'angest',
		seoTitle: 'Stöd vid ångest - förstå ångest och hitta lugna nästa steg',
		seoDescription:
			'Läs om vad ångest är, hur den kan kännas i kropp och tankar, vad som ibland hjälper i stunden och när mer stöd kan vara bra. Trygga guider och varsamma nästa steg.',
		h1: 'Stöd vid ångest i lugn takt',
		intro:
			'Ångest kan kännas stark, snabb och svår att förstå när den är mitt i kroppen. Här får du en lugn översikt över vad ångest är, hur den kan märkas och vilka små steg som kan hjälpa utan att du behöver lösa allt på en gång.',
		updatedAt: '2026-03-27',
		sources: [
			{
				label: 'Ångest – 1177 Vårdguiden',
				url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/'
			},
			{
				label: 'Psykisk hälsa – Folkhälsomyndigheten',
				url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/'
			},
			{
				label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen',
				url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/'
			}
		],
		sections: [
			{
				heading: 'Vad ångest är',
				body: 'Ångest är kroppens sätt att slå larm när något känns hotfullt, osäkert eller svårt att överblicka. Reaktionen kan vara stark även när du egentligen är trygg. Det betyder inte att det är något fel på dig, utan att nervsystemet har gått upp i beredskap.',
				links: [
					{ title: 'Tecken på ångest', href: '/guider/angest/tecken' },
					{
						title: 'Ångest i kroppen – vad som händer och vad som hjälper',
						href: '/guider/angest/angest-i-kroppen'
					}
				]
			},
			{
				heading: 'Hur ångest kan kännas i tankar, kropp och beteenden',
				body: 'I tankarna kan ångest märkas som katastroftankar, stark oro eller en känsla av att något snart ska gå fel. I kroppen kan det kännas som hjärtklappning, tryck över bröstet, spänning, yrsel, magoro eller snabb andning. I beteenden syns ångest ofta som att man skjuter upp, undviker eller håller sig väldigt nära det som känns tryggt.',
				links: [
					{
						title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
						href: '/guider/angest/orostankar'
					},
					{
						title: 'Oro i kroppen – när ångesten sitter fysiskt',
						href: '/guider/angest/oro-i-kroppen'
					}
				]
			},
			{
				heading: 'Vanliga situationer där ångest märks',
				body: 'Ångest kan märkas inför sociala situationer, när du ska sova, när något är oklart eller när kroppen redan är trött och stressad. För vissa kommer den i tydliga toppar, som vid panikattack. För andra ligger den mer som en ständig vaksamhet i bakgrunden.',
				links: [
					{ title: 'Panikattack – hjälp direkt när kroppen larmar', href: '/guider/angest/panikattack-hjalp' },
					{ title: 'Ångest och sömn - varför natten kan bli svårare', href: '/guider/angest/angest-och-somn' },
					{ title: 'Social ångest - rädslan för att bli bedömd av andra', href: '/guider/angest/social-angest' }
				]
			},
			{
				heading: 'Vad som ibland kan hjälpa i stunden',
				body: 'När ångesten blir stark hjälper det ofta mer att göra något enkelt än att försöka tänka perfekt. En långsammare utandning, en kort grounding-övning, ett glas vatten eller att sätta ord på vad som händer kan hjälpa kroppen att landa. Välj gärna ett enda nästa steg i stället för att försöka lösa allt direkt.',
				links: [
					{ title: 'Andningsövningar mot ångest', href: '/andningsovningar-mot-angest' },
					{ title: 'Övningar mot ångest online', href: '/ovningar-mot-angest-online' },
					{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider/angest/angest-hjalp' }
				]
			},
			{
				heading: 'När det kan vara bra att söka mer stöd',
				body: 'Det kan vara bra att söka mer stöd om ångesten ofta styr vardagen, gör att du undviker mycket, påverkar sömn eller arbete eller om du blir rädd för dina egna reaktioner. MittPsyke kan vara en lugn första ingång, men ersätter inte professionell vård. Vid akut fara ringer du 112. För vårdråd finns 1177 och för vidare mänskligt stöd finns stodlinjer.se.',
				links: [
					{ title: 'Hjälp vid ångest online', href: '/hjalp-vid-angest-online' },
					{ title: 'Hjälp mot oro online', href: '/hjalp-mot-oro-online' },
					{ title: 'Prata anonymt om ångest', href: '/chat/a' }
				]
			},
			{
				heading: 'Vidare läsning i MittPsyke',
				body: 'Om du vill läsa vidare finns fördjupning om panikattack, grubblande, fysisk ångest, stress och sömn. Du kan också prova en andningsövning, skriva i dagboken eller fortsätta med en lugn guide i egen takt.',
				links: [
					{ title: 'Panikattack', href: '/panikattack' },
					{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider/angest/overtankande-hjalp' },
					{ title: 'Stress och sömn - när kroppen inte kan varva ner', href: '/guider/stress' },
					{ title: 'Stöd vid sömnproblem i lugn takt', href: '/guider/sovproblem' },
					{ title: 'Skriv i dagboken', href: '/dagbok' }
				]
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om ångest', href: '/guider/angest' },
			{ title: 'Panikattack – hjälp direkt när kroppen larmar', href: '/guider/angest/panikattack-hjalp' },
			{ title: 'Läs om hjälp vid ångest online', href: '/hjalp-vid-angest-online' }
		],
		faqs: [
			{
				question: 'Vad är ångest?',
				answer: 'Ångest är kroppens sätt att slå larm när något känns hotfullt eller osäkert. Reaktionen kan vara stark, men den betyder inte att du är i fara just nu.'
			},
			{
				question: 'Hur känns ångest i kroppen?',
				answer: 'Vanliga tecken är hjärtklappning, tryck över bröstet, spänning, yrsel, magoro eller snabb andning. Det kan kännas skrämmande men är vanliga alarmsignaler från kroppen.'
			},
			{
				question: 'Vad är skillnaden mellan oro och panikattack?',
				answer: 'Oro brukar vara mer utdragen och tankedriven. En panikattack kommer ofta snabbare med starka kroppsliga reaktioner och en känsla av akut alarm.'
			},
			{
				question: 'Vad kan hjälpa när ångesten blir stark?',
				answer: 'Börja smått: förläng utandningen, fäst blicken på något i rummet, sätt ord på vad som händer och välj ett enda nästa steg. Du behöver inte lösa allt på en gång.'
			},
			{
				question: 'När bör man söka hjälp för ångest?',
				answer: 'Sök mer stöd om ångesten ofta styr vardagen, leder till mycket undvikande, påverkar sömn eller arbete eller om du känner dig rädd för dina reaktioner. Vid akut fara ringer du 112.'
			}
		]
	},
	stress: {
		pillarSlug: 'stress',
		seoTitle: 'Stress och utmattning - förstå belastningen och hitta lugna nästa steg',
		seoDescription:
			'Läs om skillnaden mellan stress och utmattning, hur belastning kan märkas i kropp och tankar, vad som ibland hjälper i stunden och när mer stöd kan vara bra.',
		h1: 'Stöd vid stress och utmattning i lugn takt',
		intro:
			'Stress kan byggas upp långsamt och märkas på många olika sätt innan man riktigt hinner förstå vad som händer. Här får du en lugn översikt över belastning, återhämtning och när det kan vara dags att stanna upp och söka mer stöd.',
		updatedAt: '2026-03-27',
		sources: [
			{
				label: 'Stress – 1177 Vårdguiden',
				url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/'
			},
			{
				label: 'Psykisk hälsa – Folkhälsomyndigheten',
				url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/'
			},
			{
				label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen',
				url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/'
			}
		],
		sections: [
			{
				heading: 'Vad stress och utmattning är',
				body: 'Stress är kroppens sätt att mobilisera kraft när kraven känns höga eller något behöver hanteras snabbt. Utmattning handlar oftare om vad som händer när belastningen pågår länge utan tillräcklig återhämtning. De hör ihop, men är inte samma sak. Många märker först stresspåslaget och senare att orken inte längre kommer tillbaka som den brukade.',
				links: [
					{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider/stress/stressymtom' },
					{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider/stress/utmattad-mentalt' }
				]
			},
			{
				heading: 'Hur stress kan kännas i tankar, kropp och beteenden',
				body: 'I tankarna kan stress märkas som rastlöshet, irritation, tunnelseende, grubblande eller en känsla av att aldrig riktigt bli klar. I kroppen kan det kännas som spända muskler, hjärtklappning, trötthet, huvudvärk, magbesvär eller att det är svårt att varva ner. I beteenden syns stress ofta som att man kör på fast man är slut, skjuter upp återhämtning eller blir mer kort i tonen än man egentligen vill.',
				links: [
					{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider/stress/kan-inte-varva-ner' },
					{ title: 'Mycket tankar på kvällen – när hjärnan inte vill stänga av', href: '/guider/stress/mycket-tankar-pa-kvallen' }
				]
			},
			{
				heading: 'Vanliga situationer där stress märks',
				body: 'Stress kan märkas i arbete eller studier när tempot varit högt länge, i relationer när man bär mycket ansvar eller i livssituationer där flera saker pågår samtidigt. Ibland syns den tydligast först på kvällen eller i kroppen, när det egentligen borde finnas plats för vila.',
				links: [
					{ title: 'Varför orkar jag ingenting? – Vad det kan bero på och vad som hjälper', href: '/guider/stress/varfor-orkar-jag-ingenting' },
					{ title: 'Stress och sömn – när kroppen inte kan varva ner', href: '/guider/sovproblem/stress-och-somn' },
					{ title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget', href: '/guider/sovproblem/trott-men-uppvarvad' }
				]
			},
			{
				heading: 'Vad som ibland kan hjälpa i stunden',
				body: 'När stressen känns överväldigande hjälper det ofta mer att sänka tempot lite än att försöka pressa igenom allt. En kort grounding-övning, några lugna andetag, en paus från intryck eller att välja bort en enda sak kan göra skillnad. Små signaler om trygghet och stopp är ofta mer hjälpsamma än stora planer mitt i belastningen.',
				links: [
					{ title: 'Grounding-övning vid stress – landa i nuet på 5 minuter', href: '/guider/stress/grounding-ovning-vid-stress' },
					{ title: 'Stöd vid stress online', href: '/stod-vid-stress-online' },
					{ title: 'Skriv i dagboken', href: '/dagbok' }
				]
			},
			{
				heading: 'När det kan vara bra att söka mer stöd',
				body: 'Det kan vara bra att söka mer stöd om stressen håller i sig, påverkar sömn eller koncentration, gör att du inte återhämtar dig trots vila eller om du känner att kroppen och huvudet inte längre hänger med. MittPsyke kan vara en lugn första ingång, men ersätter inte professionell vård. Vid akut fara ringer du 112. För vårdråd finns 1177 och för vidare mänskligt stöd finns stodlinjer.se.',
				links: [
					{ title: 'Läs mer om stöd vid stress online', href: '/stress' },
					{ title: 'Hjälp mot oro online', href: '/hjalp-mot-oro-online' },
					{ title: 'Prata anonymt om stress', href: '/chat/a' }
				]
			},
			{
				heading: 'Vidare läsning i MittPsyke',
				body: 'Om du vill läsa vidare finns guider om utmattning, sömnproblem, gränssättning, ångest och grubblande. Du kan också fortsätta varsamt med en övning eller skriva av dig för att se mönstren tydligare.',
				links: [
					{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider/stress/utmattad-mentalt' },
					{ title: 'Att sätta gränser när självkänslan är låg - varför det är svårt', href: '/guider/sjalvkansla/gransen-och-sjalvkansla' },
					{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider/angest/overtankande-hjalp' },
					{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' },
					{ title: 'Stöd vid sömnproblem i lugn takt', href: '/guider/sovproblem' }
				]
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om stress', href: '/guider/stress' },
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider/stress/utmattad-mentalt' },
			{ title: 'Stöd vid stress online', href: '/stod-vid-stress-online' }
		],
		faqs: [
			{
				question: 'Vad är skillnaden mellan stress och utmattning?',
				answer: 'Stress är ofta ett påslag i kroppen när kraven är höga. Utmattning handlar mer om vad som kan hända när belastningen pågår länge och återhämtningen inte räcker till.'
			},
			{
				question: 'Hur känns stress i kroppen?',
				answer: 'Vanliga tecken är spända muskler, hjärtklappning, trötthet, huvudvärk, magoro eller att det är svårt att varva ner även när du vill vila.'
			},
			{
				question: 'Vad kan hjälpa när stressen känns överväldigande?',
				answer: 'Börja smått: sänk tempot lite, ta några lugna andetag, pausa från intryck och välj bort en enda sak. Små steg hjälper ofta mer än att pressa hårdare.'
			},
			{
				question: 'Kan man bli utmattad utan att märka det?',
				answer: 'Ja. Många fortsätter länge av vana eller ansvar och märker först senare att orken, minnet eller återhämtningen har förändrats mer än de trodde.'
			},
			{
				question: 'När bör man söka hjälp för stress?',
				answer: 'Sök mer stöd om stressen håller i sig, påverkar sömn eller vardag, eller om du inte återhämtar dig trots vila. Vid akut fara ringer du 112.'
			}
		]
	},
	trauma: {
		pillarSlug: 'trauma',
		seoTitle: 'Trauma - förstå reaktioner och hitta tryggare nästa steg',
		seoDescription:
			'Läs om vanliga reaktioner efter svåra händelser och hur du kan skapa mer trygghet i vardagen. Varsam information, guider och tydliga nästa steg.',
		h1: 'Stöd vid trauma i lugn och trygg takt',
		intro:
			'Efter svåra händelser kan kroppen och tankarna reagera starkt. Här får du en lugn översikt, konkreta förklaringar och vägar vidare utan att behöva stressa fram något.',
		sections: [
			{
				heading: 'När kroppen fortsätter vara i beredskap',
				body: 'Det är vanligt med spänning, oro, sömnsvårigheter eller starka minnesbilder efter trauma. Reaktionerna kan kännas skrämmande, men de är ofta kroppens sätt att försöka skydda dig.',
				links: [
					{ title: 'Nervsystemet och trauma - varför kroppen reagerar starkt', href: '/guider/trauma/nervsystemet-och-trauma' },
					{ title: 'Trygghet efter trauma - små steg som hjälper', href: '/guider/trauma/trygghet' }
				]
			},
			{
				heading: 'Varsam stabilisering i vardagen',
				body: 'Många behöver börja med stabilisering innan fördjupad bearbetning. Små, trygga rutiner och enkla grounding-övningar kan hjälpa nervsystemet att hitta mer lugn.',
				links: [
					{ title: 'Grounding-övningar vid trauma', href: '/guider/trauma/grounding-ovningar' },
					{ title: 'Undvikande efter trauma - varför det händer', href: '/guider/trauma/undvikande-efter-trauma' }
				]
			},
			{
				heading: 'När du vill ta nästa steg',
				body: 'Du kan prata anonymt, skriva av dig eller prova en enkel övning. MittPsyke är ett komplement för stöd och reflektion, inte en ersättning för vård.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om trauma', href: '/guider/trauma' },
			{ title: 'Läs om samtalsstöd vid trauma', href: '/trauma' },
			{ title: 'Stöd vid PTSD online', href: '/stod-vid-ptsd-online' }
		]
	},
	ensamhet: {
		pillarSlug: 'ensamhet',
		seoTitle: 'Ensamhet - förstå känslan och hitta vägar tillbaka till kontakt',
		seoDescription:
			'Känn igen olika former av ensamhet och få konkreta steg för mer kontakt och mindre tomhet. Lugn vägledning, internlänkar och nästa steg i egen takt.',
		h1: 'Stöd vid ensamhet och tomhet',
		intro:
			'Ensamhet kan göra ont även när man har människor omkring sig. Här får du tydlig och varm vägledning för att förstå känslan och hitta små steg tillbaka till kontakt.',
		sections: [
			{
				heading: 'Olika sorters ensamhet',
				body: 'Du kan känna dig ensam socialt, känslomässigt eller existentiellt. Att sätta ord på vilken sorts ensamhet du bär på kan göra nästa steg mer hanterbart.',
				links: [
					{ title: 'Känner mig ensam - varför det gör så ont', href: '/guider/ensamhet/kanner-mig-ensam' },
					{ title: 'Tomhetskänsla - när allt känns långt bort', href: '/guider/ensamhet/tomhetskansla' }
				]
			},
			{
				heading: 'Små vägar tillbaka till kontakt',
				body: 'När orken är låg hjälper det ofta att börja mycket smått. En kort hälsning, ett lugnt samtal eller några rader i dagboken kan vara tillräckligt som start.',
				links: [
					{ title: 'Ensamhet - hjälp när du fastnat i isolering', href: '/guider/ensamhet/ensamhet-hjalp' },
					{ title: 'Orkar ingenting - när ensamheten tar energi', href: '/guider/ensamhet/orkar-ingenting' }
				]
			},
			{
				heading: 'Fortsätt i din egen takt',
				body: 'Du behöver inte lösa allt direkt. MittPsyke kan vara en lågtröskel ingång för stöd och reflektion, som komplement till vård när mer hjälp behövs.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om ensamhet', href: '/guider/ensamhet' },
			{ title: 'Läs mer om ensamhet hos MittPsyke', href: '/ensamhet' },
			{ title: 'Prata anonymt om ensamhet', href: '/chat/b' }
		]
	},
	depression: {
		pillarSlug: 'depression',
		seoTitle: 'Nedstämdhet - förstå måendet och ta små steg framåt',
		seoDescription:
			'Stödjande information vid nedstämdhet: skillnaden mot depression, vanliga mönster och små steg som kan hjälpa i vardagen. Tydliga guider och lugna nästa steg.',
		h1: 'Stöd vid nedstämdhet i lugn takt',
		intro:
			'Nedstämdhet kan påverka energi, tankar och relationer. Här hittar du en tydlig översikt och konkreta steg som går att ta även när orken är låg.',
		sections: [
			{
				heading: 'Nedstämdhet eller depression?',
				body: 'Många undrar var gränsen går. Det viktigaste är hur länge måendet håller i sig och hur mycket vardagen påverkas. Du behöver inte vänta på "rätt ord" för att söka stöd.',
				links: [
					{ title: 'Nedstämdhet eller depression', href: '/guider/depression/nedstamdhet' },
					{ title: 'Skillnaden mellan sorg och depression', href: '/guider/depression/sorg-och-depression' }
				]
			},
			{
				heading: 'När energin inte räcker',
				body: 'Trötthet, tomhet och låg motivation är vanliga delar av nedstämdhet. Små steg och vardagsstruktur kan vara mer hjälpsamt än att försöka prestera sig ur läget.',
				links: [
					{ title: 'Trötthet och meningslöshet', href: '/guider/depression/trotthet-och-meningsloshet' },
					{ title: 'Små steg vid nedstämdhet', href: '/guider/depression/sma-steg-vid-nedstamdhet' }
				]
			},
			{
				heading: 'Lugn väg vidare',
				body: 'MittPsyke kan ge stöd för reflektion, men ersätter inte vård. Vid akut fara ringer du 112. För vårdråd finns 1177.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om nedstämdhet', href: '/guider/depression' },
			{ title: 'Läs mer på sidan Nedstämdhet', href: '/nedstamdhet' },
			{ title: 'Hjälp vid depression online', href: '/hjalp-vid-depression-online' }
		]
	},
	panikattack: {
		pillarSlug: 'panikattack',
		seoTitle: 'Panikattack - vad som händer och hur du kan landa i stunden',
		seoDescription:
			'Få en lugn förklaring av panikattacker och konkreta steg som kan hjälpa när kroppen larmar. Information, internlänkar och nästa steg i trygg takt.',
		h1: 'Stöd vid panikattack i stunden',
		intro:
			'En panikattack kan kännas skrämmande och överväldigande. Här hittar du lugn vägledning om vad som händer och hur du kan ta dig igenom attacken steg för steg.',
		sections: [
			{
				heading: 'När kroppen går i full alarmberedskap',
				body: 'Vid panik slår kroppens larmsystem på med hög intensitet. Hjärtklappning, yrsel och andningspåverkan är vanliga reaktioner. Det känns starkt, men går över.',
				links: [
					{ title: 'Panikattack - hjälp direkt när kroppen larmar', href: '/guider/angest/panikattack-hjalp' },
					{ title: 'Panikångest - vad som händer i kroppen', href: '/guider/angest/panikangest-och-kroppen' }
				]
			},
			{
				heading: 'Vad du kan göra när paniken stiger',
				body: 'Små, tydliga steg kan hjälpa kroppen att landa: långsam andning, grounding och att påminna dig om att reaktionen klingar av. Du behöver inte prestera för att få effekt.',
				links: [
					{ title: 'Lugna en panikattack - steg för steg', href: '/guider/angest/lugna-en-panikattack' },
					{ title: 'Grounding-övning vid stress', href: '/guider/stress/grounding-ovning-vid-stress' }
				]
			},
			{
				heading: 'Trygga nästa steg',
				body: 'Om panikattacker återkommer kan det hjälpa att prata med någon och följa mönster över tid. MittPsyke är ett komplement för stöd och reflektion, inte en ersättning för vård.'
			}
		],
		primaryLinks: [
			{ title: 'Läs mer om panikattack på MittPsyke', href: '/panikattack' },
			{ title: 'Se guider om ångest', href: '/guider/angest' },
			{ title: 'Starta chatt om panik och ångest', href: '/chat/a' }
		]
	},
	overtankande: {
		pillarSlug: 'overtankande',
		seoTitle: 'Ältande och övertänkande - när tankarna inte stannar',
		seoDescription:
			'Förstå varför tankar går i loopar och vad som kan hjälpa dig att bryta mönstret. Lugn vägledning med internlänkar till relevanta guider och nästa steg.',
		h1: 'Stöd vid ältande och övertänkande',
		intro:
			'När tankarna snurrar kan det vara svårt att få vila. Här får du en tydlig översikt av övertänkande och ältande, och små steg som hjälper dig tillbaka till lugn.',
		sections: [
			{
				heading: 'Varför hjärnan fastnar i loopar',
				body: 'Övertänkande är ofta ett försök att skapa kontroll. Men när tankarna går runt utan att leda till beslut ökar stressen i stället. Det går att träna på ett annat förhållningssätt.',
				links: [
					{
						title: 'Varför hjärnan fastnar i loopar – om grubblande och ältande',
						href: '/guider/overtankande/varfor-hjarnan-fastnar-i-loopar'
					},
					{
						title: 'Oro vs ältande – vad är skillnaden och varför spelar det roll?',
						href: '/guider/overtankande/skillnaden-mellan-oro-och-altande'
					}
				]
			},
			{
				heading: 'Ältande blir ofta starkare på kvällen',
				body: 'När tempot sjunker får oron mer plats. Det kan göra det svårt att somna eller koppla av. Tydliga kvällsrutiner och avgränsad orostid kan göra stor skillnad.',
				links: [
					{
						title: 'Sluta övertänka på kvällen – tips för lugna kvällar',
						href: '/guider/overtankande/sluta-overtanka-pa-kvallen'
					},
					{
						title: 'Mindfulness mot övertänkande – enkla övningar som bryter loopen',
						href: '/guider/overtankande/mindfulness-mot-overtankande'
					}
				]
			},
			{
				heading: 'Lugn väg vidare',
				body: 'Du kan börja med ett litet steg: chatta anonymt, skriv i dagboken eller prova en övning. MittPsyke ersätter inte vård men kan vara en trygg första ingång.'
			}
		],
		primaryLinks: [
			{ title: 'Läs mer om oro och övertänkande', href: '/oro' },
			{ title: 'Se guider om ångest', href: '/guider/angest' },
			{ title: 'Starta chatt om oro', href: '/chat/e' }
		]
	},
	sovproblem: {
		pillarSlug: 'sovproblem',
		seoTitle: 'Sömnproblem – förstå vad som stör sömnen och ta lugna steg framåt',
		seoDescription:
			'Läs om vanliga orsaker till sömnproblem, varför kroppen ibland inte kan varva ner och vilka små steg som kan hjälpa. Guider och varsamma nästa steg.',
		h1: 'Stöd vid sömnproblem i lugn takt',
		intro:
			'Sömnproblem kan ha många orsaker – stress, oro eller ett nervsystem som inte fått chansen att landa. Här får du en tydlig översikt och steg som är lätta att börja med.',
		sections: [
			{
				heading: 'Varför sömnen kan bli svår',
				body: 'Sömnproblem beror sällan på en enda sak. Stress, ångest och oro är vanliga orsaker, liksom ett nervsystem som inte hunnit varva ner. Det är ett vanligare problem än du kanske tror.',
				links: [
					{ title: 'Orsaker till sömnproblem', href: '/guider/sovproblem/orsaker' },
					{ title: 'Stress och sömn – sambandet som stör natten', href: '/guider/sovproblem/stress-och-somn' }
				]
			},
			{
				heading: 'Trött men uppvarvad',
				body: 'Att vara utmattad men ändå inte kunna somna är ett vanligt mönster. Det beror ofta på ett aktiverat nervsystem som inte fått signal om att det är tryggt att vila.',
				links: [
					{ title: 'Trött men uppvarvad – vad det beror på', href: '/guider/sovproblem/trott-men-uppvarvad' },
					{ title: 'Ältande på kvällen – när tankarna tar över', href: '/guider/sovproblem/altande-pa-kvallen' }
				]
			},
			{
				heading: 'Lugn väg framåt',
				body: 'Du behöver inte hitta perfekt sömn direkt. Små justeringar i rutiner och tankemönster kan göra stor skillnad över tid. MittPsyke är ett komplement för stöd och reflektion, inte en ersättning för vård.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om sömnproblem', href: '/guider/sovproblem' },
			{ title: 'Sömnbrist och mående – vad det gör med dig', href: '/guider/sovproblem/somnbrist-och-maendet' },
			{ title: 'Utforska övningar', href: '/ovningar' }
		]
	},
	sjalvkansla: {
		pillarSlug: 'sjalvkansla',
		seoTitle: 'Låg självkänsla – förstå mönstren och hitta en varsam väg framåt',
		seoDescription:
			'Läs om vad låg självkänsla handlar om, hur den inre kritikern påverkar dig och vilka steg du kan ta i din egen takt. Guider och trygga nästa steg.',
		h1: 'Stöd vid låg självkänsla i varsam takt',
		intro:
			'Självkänsla handlar om hur du värderar dig själv i grunden. Den kan förändras, och du behöver inte göra det snabbt eller ensam. Här hittar du en trygg ingång.',
		sections: [
			{
				heading: 'Vad låg självkänsla handlar om',
				body: 'Låg självkänsla visar sig ofta som en inre röst som ifrågasätter, jämför och kritiserar. Det är inte en karaktärsbrist, utan ett inlärt mönster som går att förändra steg för steg.',
				links: [
					{ title: 'Låg självkänsla – vad det är och vad som hjälper', href: '/guider/sjalvkansla/lag-sjalvkansla' },
					{ title: 'Inre kritikern – rösten som alltid hittar fel', href: '/guider/sjalvkansla/inre-kritikern' }
				]
			},
			{
				heading: 'Jämförelse och självbild',
				body: 'Att jämföra sig med andra kan förstärka känslan av att inte räcka till. Det finns sätt att se sig själv med lite mer rättvisa och värme, och det börjar ofta med ökad medvetenhet.',
				links: [
					{ title: 'Jämförelse och självbild – att se sig själv rättvist', href: '/guider/sjalvkansla/jamforelse-och-sjalvbild' },
					{ title: 'Perfektionism och självkänsla', href: '/guider/sjalvkansla/perfektionism-och-sjalvkansla' }
				]
			},
			{
				heading: 'Varsam väg vidare',
				body: 'Förändring i självkänsla sker sällan snabbt, men varje litet steg räknas. Du kan börja med att sätta ord på det som känns svårt, skriva i dagboken eller prova en enkel övning.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om självkänsla', href: '/guider/sjalvkansla' },
			{ title: 'Gränser och självkänsla', href: '/guider/sjalvkansla/gransen-och-sjalvkansla' },
			{ title: 'Utforska övningar', href: '/ovningar' }
		]
	},
	beroende: {
		pillarSlug: 'beroende',
		seoTitle: 'Beroende och missbruk – skam, ambivalens och första steg | MittPsyke',
		seoDescription:
			'Läs om beroende, skam, ambivalens och gradvis kontrollförlust i en varm och icke-dömande guide. Stöd för dig som vill förstå vad som händer och ta ett första steg.',
		h1: 'Stöd när något har börjat ta för stor plats',
		intro:
			'Beroende och destruktiva mönster växer ofta fram stegvis. Här finns en lugn ingång för att förstå skam, ambivalens och varför det kan vara så svårt att både vilja förändras och hålla fast.',
		sections: [
			{
				heading: 'Det sker ofta gradvis',
				body: 'Det som senare känns tydligt börjar ofta mycket stilla. Många vänjer sig, anpassar sig och märker först i efterhand hur mycket plats ett mönster har tagit.',
				links: [
					{
						title: 'När bruk blir ett sätt att stå ut',
						href: '/guider/beroende/nar-bruk-blir-ett-satt-att-sta-ut'
					},
					{
						title: 'Att vilja sluta och inte vilja samtidigt',
						href: '/guider/beroende/att-vilja-sluta-och-inte-vilja-samtidigt'
					}
				]
			},
			{
				heading: 'Skam och tystnad gör det ofta tyngre',
				body: 'Det är vanligt att fungera utåt och samtidigt bära mycket ensam. Skam kan göra det svårare att vara ärlig, söka stöd och ta små steg i tid.',
				links: [
					{ title: 'Nedstämdhet eller depression', href: '/guider/depression/nedstamdhet' },
					{ title: 'Orostankar som snurrar - när hjärnan inte kan stänga av', href: '/guider/angest/orostankar' }
				]
			},
			{
				heading: 'Stöd kan sökas innan allt rasat',
				body: 'Du behöver inte vänta på ett tydligt sammanbrott för att ta din situation på allvar. MittPsyke kan vara en lugn första plats för reflektion, men ersätter inte vård.'
			}
		],
		primaryLinks: [
			{
				title: 'Läs artikeln om ambivalens och kontrollförlust',
				href: '/guider/beroende/att-vilja-sluta-och-inte-vilja-samtidigt'
			},
			{ title: 'Börja skriva i dagboken', href: '/dagbok' },
			{ title: 'Hitta vidare stöd', href: 'https://www.stodlinjer.se/' }
		]
	},

	kbt: {
		pillarSlug: 'kbt',
		seoTitle: 'KBT – Kognitiv beteendeterapi | Tekniker och guider | MittPsyke',
		seoDescription: 'Lär dig hur KBT fungerar och prova konkreta tekniker hemma. Guider om tankeomstrukturering, beteendeaktivering och mer – i lugn takt.',
		h1: 'KBT – verktyg för tankar, känslor och beteenden',
		intro: 'Kognitiv beteendeterapi är en av de mest välstuderade metoderna för psykisk hälsa. Här hittar du förklaringar och övningar du kan använda i din vardag.',
		sections: [
			{
				heading: 'Förstå grunderna i KBT',
				body: 'KBT bygger på sambandet mellan tankar, känslor och beteenden. Genom att förändra ett led kan du påverka de andra. Det kräver inte en terapeut för att komma igång.',
				links: [
					{ title: 'Vad är KBT och hur fungerar det?', href: '/guider/kbt/vad-ar-kbt' },
					{ title: 'KBT vid ångest – hur det fungerar steg för steg', href: '/guider/kbt/kbt-vid-angest' }
				]
			},
			{
				heading: 'Tekniker du kan testa hemma',
				body: 'Många KBT-tekniker passar utmärkt som självhjälp. Tankeomstrukturering och beteendeaktivering är bra startpunkter som du kan öva på utan förkunskaper.',
				links: [
					{ title: 'Tankeomstrukturering – utmana dina negativa tankar', href: '/guider/kbt/tankeomstrukturering' },
					{ title: 'Beteendeaktivering – ta ett steg ut ur passiviteten', href: '/guider/kbt/beteendeaktivering' },
					{ title: 'KBT-tekniker du kan använda hemma', href: '/guider/kbt/kbt-tekniker-hemma' }
				]
			},
			{
				heading: 'Nästa steg',
				body: 'Du kan reflektera kring dina tankar och beteenden i MittPsykes dagbok, eller börja ett samtal för att utforska vad som känns svårt just nu.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla KBT-guider', href: '/guider/kbt' },
			{ title: 'Börja reflektera i dagboken', href: '/dagbok' }
		]
	}

};

export function getPillarLandingBySlug(slug: string): SeoLandingPage | null {
	return pillarLandingPages[slug as Pillar['slug']] ?? null;
}

export function getGuiderSeoPaths(): string[] {
	const paths: string[] = ['/guider'];

		for (const pillar of pillars) {
		paths.push(`/guider/${pillar.slug}`);
	}

	for (const guide of guides) {
		paths.push(`/guider/${guide.pillarSlug}/${guide.slug}`);
	}

	return paths;
}

