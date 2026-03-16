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
};

export const pillars: Pillar[] = [
	{
		slug: 'angest',
		title: 'Ångest',
		description: 'Förstå vanliga reaktioner vid ångest och hur du kan hantera dem stegvis.',
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
		description: 'Om stressreaktioner efter svaira handelser och sätt att bygga mer trygghet.',
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
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar – när hjärnan inte kan stänga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Ångest och sömn – varför natten kan bli svårare',
				href: '/guider-seo/angest/angest-och-somn'
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
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Panikångest - vad som händer i kroppen och hur du kan hantera det',
				href: '/guider-seo/angest/panikangest-och-kroppen'
			},
			{
				title: 'Ångest och sömn - varför natten kan bli svårare',
				href: '/guider-seo/angest/angest-och-somn'
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
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Varför kan jag inte sova',
				href: '/guider-seo/sovproblem/orsaker'
			},
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
			},
			{
				title: 'Hjälp vid oro på kvällen – vad du kan göra just nu',
				href: '/guider-seo/angest/hjalp-vid-oro-pa-kvallen'
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
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
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
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Låg självkänsla - vad det är och var det kommer ifrån',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Jämförelsetrasket - sociala medier och din självbild',
				href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild'
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
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
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
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla övningar för att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
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
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Vad händer i nervsystemet vid trauma - fight, flight och freeze',
				href: '/guider-seo/trauma/nervsystemet-och-trauma'
			},
			{
				title: 'Undvikande efter trauma - varför vi gör det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
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
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla övningar för att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Tillit och trygghet i relationer efter svara upplevelser',
				href: '/guider-seo/trauma/tillit-efter-trauma'
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
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Undvikande efter trauma - varför vi gör det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Grounding - enkla övningar för att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
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
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och självkänsla - när ingenting känns tillräckligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
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
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och självkänsla - när ingenting känns tillräckligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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
			{ title: 'Tecken på ångest', href: '/guider-seo/angest/tecken' },
			{ title: 'Ångest i kroppen – vad som händer och vad som hjälper', href: '/guider-seo/angest/angest-i-kroppen' },
			{ title: 'Lugna en panikattack – steg för steg', href: '/guider-seo/angest/lugna-en-panikattack' }
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
			{ title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det', href: '/guider-seo/angest/panikangest-och-kroppen' },
			{ title: 'Lugna en panikattack – steg för steg', href: '/guider-seo/angest/lugna-en-panikattack' },
			{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider-seo/angest/angest-hjalp' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1-tekniken', href: '/guider-seo/stress/grounding-ovning-vid-stress' }
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
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider-seo/angest/orostankar' },
			{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider-seo/angest/overtankande-hjalp' },
			{ title: 'När tankarna inte stannar – att hitta ro på kvällen', href: '/guider-seo/angest/nar-tankarna-inte-stannar' },
			{ title: 'Varför orkar jag ingenting? – om utmattning och energibrist', href: '/guider-seo/stress/varfor-orkar-jag-ingenting' }
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-pa-kvallen',
		title: 'Ångest på kvällen – varför det ökar när dagen tar slut',
		description: 'Om varför ångesten ofta blir starkare på kvällen och vad du kan göra för att hitta mer ro.',
		updatedAt: '2026-03-14',
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqs: [
			{
				question: 'Varför är det värre på kvällen?',
				answer: 'Dagen ger distraktioner. När det lugnar ner sig får tankar och känslor mer utrymme – och ångesten kan fylla ut tystnaden.'
			},
			{
				question: 'Är det normalt att inte kunna varva ner?',
				answer: 'Ja, väldigt vanligt. Nervsystemet behöver aktiv hjälp att växla ner – det sker inte automatiskt för alla.'
			},
			{
				question: 'Vad kan hjälpa mig att landa på kvällen?',
				answer: 'En lugn rutin, minska skärmar en timme innan läggdags och något som ger kroppen signal om att dagen är slut – ett te, en promenad, lugn musik.'
			},
			{
				question: 'Hur skiljer jag på trötthet och ångest?',
				answer: 'Trötthet vill sova. Ångest håller dig vaken fast kroppen är slut. Om du är trött men inte kan somna kan ångesten vara inblandad.'
			}
		],
		relatedArticles: [
			{ title: 'Ångest och sömn – varför natten kan bli svårare', href: '/guider-seo/angest/angest-och-somn' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider-seo/sovproblem/nattlig-oro' },
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider-seo/stress/kan-inte-varva-ner' }
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
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider-seo/angest/angest-pa-kvallen' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider-seo/sovproblem/nattlig-oro' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider-seo/angest/orostankar' }
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
			{ title: 'Ångest och sömn – varför natten kan bli svårare', href: '/guider-seo/angest/angest-och-somn' },
			{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider-seo/angest/angest-hjalp' },
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider-seo/stress/stressymtom' }
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
			{ title: 'Ångest i kroppen – vad som händer och vad som hjälper', href: '/guider-seo/angest/angest-i-kroppen' },
			{ title: 'Tecken på ångest', href: '/guider-seo/angest/tecken' },
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider-seo/stress/stressymtom' }
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
			{ title: 'Panikattack – hjälp direkt när kroppen larmar', href: '/guider-seo/angest/panikattack-hjalp' },
			{ title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det', href: '/guider-seo/angest/panikangest-och-kroppen' },
			{ title: 'Ångest i kroppen – vad som händer och vad som hjälper', href: '/guider-seo/angest/angest-i-kroppen' }
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
			{ title: 'Oro i kroppen – när ångesten sitter fysiskt', href: '/guider-seo/angest/oro-i-kroppen' },
			{ title: 'Ångesthjälp – vad du kan göra när ångesten tar tag', href: '/guider-seo/angest/angest-hjalp' },
			{ title: 'Tecken på ångest', href: '/guider-seo/angest/tecken' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1-tekniken', href: '/guider-seo/stress/grounding-ovning-vid-stress' }
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
			{ title: 'Kan inte sluta tänka – när tankarna bara snurrar', href: '/guider-seo/angest/kan-inte-sluta-tanka' },
			{ title: 'När tankarna inte stannar – att hitta ro på kvällen', href: '/guider-seo/angest/nar-tankarna-inte-stannar' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider-seo/angest/orostankar' }
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
			{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider-seo/angest/overtankande-hjalp' },
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider-seo/angest/angest-pa-kvallen' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider-seo/sovproblem/nattlig-oro' }
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
			{ title: 'Varför orkar jag ingenting? – när energin tar slut', href: '/guider-seo/stress/varfor-orkar-jag-ingenting' },
			{ title: 'Stressymtom – så märker du att kroppen är under press', href: '/guider-seo/stress/stressymtom' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1', href: '/guider-seo/stress/grounding-ovning-vid-stress' },
			{ title: 'Hur återhämtar man sig mentalt?', href: '/guider-seo/stress/hur-aterhamtar-man-sig-mentalt' }
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
			{ title: 'Inre stress – när det är stressigt inombords trots lugn yta', href: '/guider-seo/stress/inre-stress' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider-seo/stress/stressad-hela-tiden' },
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider-seo/stress/utmattad-mentalt' },
			{ title: 'Grounding-övning vid stress – 5-4-3-2-1-tekniken', href: '/guider-seo/stress/grounding-ovning-vid-stress' }
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
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider-seo/stress/stressymtom' },
			{ title: 'Känner mig överväldigad – när allt är för mycket', href: '/guider-seo/stress/kanner-mig-overvaldigad' },
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider-seo/stress/kan-inte-varva-ner' }
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
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider-seo/stress/utmattad-mentalt' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider-seo/stress/stressad-hela-tiden' },
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider-seo/stress/stressymtom' },
			{ title: 'Varför orkar jag ingenting? – om utmattning och energibrist', href: '/guider-seo/stress/varfor-orkar-jag-ingenting' }
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
			{ title: 'Inre stress – när det är stressigt inombords trots lugn yta', href: '/guider-seo/stress/inre-stress' },
			{ title: 'Hjärntrötthet – när hjärnan inte orkar bearbeta mer', href: '/guider-seo/stress/hjarntrotthet-hjalp' },
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider-seo/ensamhet/orkar-ingenting' }
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
			{ title: 'Stressymtom – tecken på att kroppen bär för mycket', href: '/guider-seo/stress/stressymtom' },
			{ title: 'Inre stress – när det är stressigt inombords trots lugn yta', href: '/guider-seo/stress/inre-stress' },
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider-seo/stress/kan-inte-varva-ner' }
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
			{ title: 'Hjärntrötthet – när hjärnan inte orkar bearbeta mer', href: '/guider-seo/stress/hjarntrotthet-hjalp' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider-seo/stress/stressad-hela-tiden' },
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider-seo/ensamhet/orkar-ingenting' }
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
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider-seo/stress/stressad-hela-tiden' },
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider-seo/angest/angest-pa-kvallen' },
			{ title: 'Kan inte sova av stress – när kroppen inte ger sig', href: '/guider-seo/sovproblem/kan-inte-sova-stress' },
			{ title: 'Hjälp vid oro på kvällen – vad du kan göra just nu', href: '/guider-seo/angest/hjalp-vid-oro-pa-kvallen' }
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
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider-seo/stress/kan-inte-varva-ner' },
			{ title: 'När tankarna inte stannar – att hitta ro på kvällen', href: '/guider-seo/angest/nar-tankarna-inte-stannar' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider-seo/sovproblem/nattlig-oro' }
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
			{ title: 'Ensamhet – hjälp att förstå och hantera känslan', href: '/guider-seo/ensamhet/ensamhet-hjalp' },
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider-seo/ensamhet/orkar-ingenting' },
			{ title: 'Tomhetskänsla – när inget riktigt känns', href: '/guider-seo/ensamhet/tomhetskansla' }
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
			{ title: 'Känner mig ensam – när ensamheten gör ont', href: '/guider-seo/ensamhet/kanner-mig-ensam' },
			{ title: 'Tomhetskänsla – när inget riktigt känns', href: '/guider-seo/ensamhet/tomhetskansla' },
			{ title: 'Hur nedstämdhet påverkar relationer och närheten till andra', href: '/guider-seo/depression/nedstamdhet-och-relationer' }
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
			{ title: 'Trötthet och meningslöshet – när ingenting känns värt att göra', href: '/guider-seo/depression/trotthet-och-meningsloshet' },
			{ title: 'Tomhetskänsla – när inget riktigt känns', href: '/guider-seo/ensamhet/tomhetskansla' },
			{ title: 'Utmattad mentalt – när hjärnan inte orkar mer', href: '/guider-seo/stress/utmattad-mentalt' },
			{ title: 'Varför orkar jag ingenting? – om utmattning och energibrist', href: '/guider-seo/stress/varfor-orkar-jag-ingenting' }
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
			{ title: 'Orkar ingenting – om tomhet och tyngd som inte släpper', href: '/guider-seo/ensamhet/orkar-ingenting' },
			{ title: 'Känner mig ensam – när ensamheten gör ont', href: '/guider-seo/ensamhet/kanner-mig-ensam' },
			{ title: 'Trötthet och meningslöshet – när ingenting känns värt att göra', href: '/guider-seo/depression/trotthet-och-meningsloshet' }
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
			{ title: 'Kan inte varva ner – om stress som sitter kvar i kroppen', href: '/guider-seo/stress/kan-inte-varva-ner' },
			{ title: 'Svårt att somna av ångest – när oron tar sig in i sängkammaren', href: '/guider-seo/sovproblem/svart-att-somna-angest' },
			{ title: 'Stressad hela tiden – om kronisk stress och hur du bryter mönstret', href: '/guider-seo/stress/stressad-hela-tiden' }
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
			{ title: 'Ångest och sömn – varför natten kan bli svårare', href: '/guider-seo/angest/angest-och-somn' },
			{ title: 'Kan inte sova av stress – när kroppen inte ger sig', href: '/guider-seo/sovproblem/kan-inte-sova-stress' },
			{ title: 'Nattlig oro – att vakna med tankar som inte ger ro', href: '/guider-seo/sovproblem/nattlig-oro' }
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
			{ title: 'Svårt att somna av ångest – när oron tar sig in i sängkammaren', href: '/guider-seo/sovproblem/svart-att-somna-angest' },
			{ title: 'Kan inte sova av stress – när kroppen inte ger sig', href: '/guider-seo/sovproblem/kan-inte-sova-stress' },
			{ title: 'Ångest på kvällen – varför det ökar när dagen tar slut', href: '/guider-seo/angest/angest-pa-kvallen' },
			{ title: 'Hjälp vid oro på kvällen – vad du kan göra just nu', href: '/guider-seo/angest/hjalp-vid-oro-pa-kvallen' }
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
			{ title: 'Låg självkänsla – vad det är och var det kommer ifrån', href: '/guider-seo/sjalvkansla/lag-sjalvkansla' },
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider-seo/sjalvkansla/sjalvkritiska-tankar' },
			{ title: 'Hur får man bättre självkänsla – ett praktiskt perspektiv', href: '/guider-seo/sjalvkansla/hur-far-man-battre-sjalvkansla' }
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
			{ title: 'Den inre kritikern – varför rösten finns och vad den egentligen vill', href: '/guider-seo/sjalvkansla/inre-kritikern' },
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider-seo/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Känner mig värdelös – om tankar som ljuger om vem du är', href: '/guider-seo/sjalvkansla/kanner-mig-vardelos' }
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
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider-seo/sjalvkansla/sjalvkritiska-tankar' },
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider-seo/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Hur får man bättre självkänsla – ett praktiskt perspektiv', href: '/guider-seo/sjalvkansla/hur-far-man-battre-sjalvkansla' }
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
			{ title: 'Jämförelsetrasket – sociala medier och din självbild', href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild' },
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider-seo/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider-seo/sjalvkansla/sjalvkritiska-tankar' }
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
			{ title: 'Dålig självkänsla – vad det beror på och hur du kan börja förändra det', href: '/guider-seo/sjalvkansla/dalig-sjalvkansla' },
			{ title: 'Självkritiska tankar – den röst som aldrig är nöjd', href: '/guider-seo/sjalvkansla/sjalvkritiska-tankar' },
			{ title: 'Låg självkänsla – vad det är och var det kommer ifrån', href: '/guider-seo/sjalvkansla/lag-sjalvkansla' }
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
			{ title: 'Övertänkande – hjälp när hjärnan kör på för högt varv', href: '/guider-seo/angest/overtankande-hjalp' },
			{ title: 'Orostankar som snurrar – när hjärnan inte kan stänga av', href: '/guider-seo/angest/orostankar' },
			{ title: 'Kan inte sluta tänka – när tankarna bara snurrar', href: '/guider-seo/angest/kan-inte-sluta-tanka' }
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
			{ title: 'Stressymtom – vad kroppen försöker säga', href: '/guider-seo/stress/stressymtom' },
			{ title: 'Hjärntrötthet – när hjärnan stänger av', href: '/guider-seo/stress/hjarntrotthet-hjalp' },
			{ title: 'Svårt att sova när oron tar över', href: '/guider-seo/sovproblem/svart-att-somna-angest' }
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
				href: '/guider-seo/stress/tecken-pa-mental-overbelastning'
			},
			{
				title: 'Stressymtom – hur stress visar sig i kropp och tankar',
				href: '/guider-seo/stress/stressymtom'
			},
			{
				title: 'Grounding-övning vid stress',
				href: '/guider-seo/stress/grounding-ovning-vid-stress'
			},
			{
				title: 'Hur återhämtar man sig mentalt?',
				href: '/guider-seo/stress/hur-aterhamtar-man-sig-mentalt'
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
				href: '/guider-seo/stress/tecken-pa-mental-overbelastning'
			},
			{
				title: 'När kroppen säger ifrån av stress',
				href: '/guider-seo/stress/nar-kroppen-sager-ifran-stress'
			},
			{
				title: 'Grounding-övning vid stress',
				href: '/guider-seo/stress/grounding-ovning-vid-stress'
			},
			{
				title: 'Varför orkar jag ingenting?',
				href: '/guider-seo/stress/varfor-orkar-jag-ingenting'
			}
		],
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
		seoTitle: 'Stöd vid ångest - förstå känslorna och ta små steg i lugn takt',
		seoDescription:
			'Lär dig mer om ångest, vad som händer i kroppen och vilka små steg som kan hjälpa. Läs guider och välj nästa steg med chatt, dagbok eller övning.',
		h1: 'Stöd vid ångest i lugn takt',
		intro:
			'Ångest kan kännas stark och överväldigande, men du behöver inte hantera allt på en gång. Här får du en trygg översikt och tydliga vägar vidare.',
		sections: [
			{
				heading: 'Vad händer vid ångest?',
				body: 'När hjärnan tolkar något som hot aktiveras kroppen snabbt. Hjärtat slår hårdare, andningen blir snabbare och tankarna kan rusa. Reaktionen är vanlig och går att förstå steg för steg.',
				links: [
					{ title: 'Tecken på ångest', href: '/guider-seo/angest/tecken' },
					{
						title: 'Panikångest - vad som händer i kroppen och hur du kan hantera det',
						href: '/guider-seo/angest/panikangest-och-kroppen'
					}
				]
			},
			{
				heading: 'När tankarna snurrar och sömnen påverkas',
				body: 'Oro och ångest blir ofta tydligare på kvällen. Det kan göra det svårt att varva ner eller somna. Små, återkommande strategier brukar hjälpa mer än att pressa sig.',
				links: [
					{
						title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
						href: '/guider-seo/angest/orostankar'
					},
					{
						title: 'Ångest och sömn - varför natten kan bli svårare',
						href: '/guider-seo/angest/angest-och-somn'
					}
				]
			},
			{
				heading: 'Lugna nästa steg',
				body: 'Du kan välja ett enkelt nästa steg: prata anonymt, skriva av dig eller prova en övning. MittPsyke är ett komplement för stöd och reflektion, inte en ersättning för vård.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om ångest', href: '/guider-seo/angest' },
			{ title: 'Utforska övningar mot ångest', href: '/ovningar-mot-angest-online' },
			{ title: 'Läs om hjälp vid ångest online', href: '/hjalp-vid-angest-online' }
		]
	},
	stress: {
		pillarSlug: 'stress',
		seoTitle: 'Stress och sömn - när kroppen inte kan varva ner',
		seoDescription:
			'Förstå sambandet mellan stress och sömn, varför kroppen blir uppvarvad och vad du kan prova i lugn takt. Guider, övningar och varsamma nästa steg.',
		h1: 'Stress och sömn - när kroppen inte kan varva ner',
		intro:
			'När stressen blir långvarig påverkas både sömn, återhämtning och ork. Här hittar du en tydlig översikt och hjälpsamma steg som går att börja med direkt.',
		sections: [
			{
				heading: 'Varför stress påverkar sömnen',
				body: 'Ett uppvarvat nervsystem gör det svårare att somna och lättare att vakna under natten. Det handlar inte om svaghet, utan om hur kroppen reagerar på belastning.',
				links: [{ title: 'Stressymtom - hur stress visar sig i kropp och tankar', href: '/guider-seo/stress/stressymtom' }]
			},
			{
				heading: 'När trötthet och oro förstärker varandra',
				body: 'Sömnbrist gör oss mer sårbara för oro och stress nästa dag. Det kan bli en cirkel som känns svår att bryta. Små justeringar i vardagen kan minska trycket stegvis.',
				links: [
					{ title: 'Mycket tankar på kvällen - när hjärnan inte stänger av', href: '/guider-seo/stress/mycket-tankar-pa-kvallen' },
					{ title: 'Varför orkar jag ingenting? - vad det kan bero på och vad som hjälper', href: '/guider-seo/stress/varfor-orkar-jag-ingenting' }
				]
			},
			{
				heading: 'Små steg för återhämtning',
				body: 'Du behöver inte lösa allt direkt. Ett lugnt nästa steg kan vara en kort övning, en stund i dagboken eller att prata med någon. Vid akut fara ringer du 112 och för vårdråd finns 1177.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om stress', href: '/guider-seo/stress' },
			{ title: 'Läs mer om stöd vid stress online', href: '/stress' },
			{ title: 'Stöd vid stress online', href: '/stod-vid-stress-online' }
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
					{ title: 'Nervsystemet och trauma - varför kroppen reagerar starkt', href: '/guider-seo/trauma/nervsystemet-och-trauma' },
					{ title: 'Trygghet efter trauma - små steg som hjälper', href: '/guider-seo/trauma/trygghet' }
				]
			},
			{
				heading: 'Varsam stabilisering i vardagen',
				body: 'Många behöver börja med stabilisering innan fördjupad bearbetning. Små, trygga rutiner och enkla grounding-övningar kan hjälpa nervsystemet att hitta mer lugn.',
				links: [
					{ title: 'Grounding-övningar vid trauma', href: '/guider-seo/trauma/grounding-ovningar' },
					{ title: 'Undvikande efter trauma - varför det händer', href: '/guider-seo/trauma/undvikande-efter-trauma' }
				]
			},
			{
				heading: 'När du vill ta nästa steg',
				body: 'Du kan prata anonymt, skriva av dig eller prova en enkel övning. MittPsyke är ett komplement för stöd och reflektion, inte en ersättning för vård.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om trauma', href: '/guider-seo/trauma' },
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
					{ title: 'Känner mig ensam - varför det gör så ont', href: '/guider-seo/ensamhet/kanner-mig-ensam' },
					{ title: 'Tomhetskänsla - när allt känns långt bort', href: '/guider-seo/ensamhet/tomhetskansla' }
				]
			},
			{
				heading: 'Små vägar tillbaka till kontakt',
				body: 'När orken är låg hjälper det ofta att börja mycket smått. En kort hälsning, ett lugnt samtal eller några rader i dagboken kan vara tillräckligt som start.',
				links: [
					{ title: 'Ensamhet - hjälp när du fastnat i isolering', href: '/guider-seo/ensamhet/ensamhet-hjalp' },
					{ title: 'Orkar ingenting - när ensamheten tar energi', href: '/guider-seo/ensamhet/orkar-ingenting' }
				]
			},
			{
				heading: 'Fortsätt i din egen takt',
				body: 'Du behöver inte lösa allt direkt. MittPsyke kan vara en lågtröskel ingång för stöd och reflektion, som komplement till vård när mer hjälp behövs.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om ensamhet', href: '/guider-seo/ensamhet' },
			{ title: 'Läs mer om ensamhet hos MittPsyke', href: '/ensamhet' },
			{ title: 'Hitta stödlinjer', href: 'https://stodlinjer.se' }
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
					{ title: 'Nedstämdhet eller depression', href: '/guider-seo/depression/nedstamdhet' },
					{ title: 'Skillnaden mellan sorg och depression', href: '/guider-seo/depression/sorg-och-depression' }
				]
			},
			{
				heading: 'När energin inte räcker',
				body: 'Trötthet, tomhet och låg motivation är vanliga delar av nedstämdhet. Små steg och vardagsstruktur kan vara mer hjälpsamt än att försöka prestera sig ur läget.',
				links: [
					{ title: 'Trötthet och meningslöshet', href: '/guider-seo/depression/trotthet-och-meningsloshet' },
					{ title: 'Små steg vid nedstämdhet', href: '/guider-seo/depression/sma-steg-vid-nedstamdhet' }
				]
			},
			{
				heading: 'Lugn väg vidare',
				body: 'MittPsyke kan ge stöd för reflektion, men ersätter inte vård. Vid akut fara ringer du 112. För vårdråd finns 1177.'
			}
		],
		primaryLinks: [
			{ title: 'Se alla artiklar om nedstämdhet', href: '/guider-seo/depression' },
			{ title: 'Läs mer på sidan Nedstämdhet', href: '/nedstamdhet' },
			{ title: 'Hjälp vid depression online', href: '/hjalp-vid-depression-online' }
		]
	}
};

export function getPillarLandingBySlug(slug: string): SeoLandingPage | null {
	return pillarLandingPages[slug as Pillar['slug']] ?? null;
}

export function getGuiderSeoPaths(): string[] {
	const paths: string[] = ['/guider-seo'];

		for (const pillar of pillars) {
		paths.push(`/guider-seo/${pillar.slug}`);
	}

	for (const guide of guides) {
		paths.push(`/guider-seo/${guide.pillarSlug}/${guide.slug}`);
	}

	return paths;
}

