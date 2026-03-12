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
	title: string;
	description: string;
	faqs: FaqItem[];
	relatedArticles?: RelatedArticle[];
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
];

export const guides: Guide[] = [
	{
		pillarSlug: 'angest',
		slug: 'tecken',
		title: 'Tecken på ångest',
		description: 'Vanliga kroppsliga och mentala tecken på ångest.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Ångest', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'panikangest-och-kroppen',
		title: 'Panikångest – vad som händer i kroppen och hur du kan hantera det',
		description: 'Om kroppens starka reaktioner vid panikångest och hur du kan förstå det som händer.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Paniksyndrom', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/paniksyndrom/' },
			{ label: '1177 – Ångest', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'orostankar',
		title: 'Orostankar som snurrar - när hjärnan inte kan stänga av',
		description: 'Om oro som går runt i cirklar och gör det svårt att komma till ro.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Ångest', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-och-somn',
		title: 'Ångest och sömn - varför natten kan bli svårare',
		description: 'Om hur ångest ofta blir tydligare på kvällen och kan göra det svårt att somna eller sova lugnt.',
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
			}
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Ångest', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: '1177 – Sömnsvårigheter', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
		],
	},
	{
		pillarSlug: 'angest',
		slug: 'social-angest',
		title: 'Social ångest - rädslan för att bli bedömd av andra',
		description: 'Om oro i sociala situationer och varför blicken från andra kan kännas så stark.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Ångest', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet',
		title: 'Nedstämdhet eller depression',
		description: 'Skillnader mellan tillfällig nedstämdhet och depression.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Psykisk hälsa', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'trotthet-och-meningsloshet',
		title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
		description: 'Om trötthet, tomhet och känslan av att vardagen förlorar sin riktning.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Psykisk hälsa', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet-och-relationer',
		title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
		description: 'Om hur nedstämdhet kan göra det svårare att orka med kontakt, närhet och samtal.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Psykisk hälsa', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Mind – Psykisk ohälsa', url: 'https://mind.se/' },
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'sorg-och-depression',
		title: 'Skillnaden mellan sorg och depression - och varför det spelar roll',
		description: 'Om likheter och skillnader mellan sorg och depression, och varför de ibland blandas ihop.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Psykisk hälsa', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Mind – Psykisk ohälsa', url: 'https://mind.se/' },
		],
	},
	{
		pillarSlug: 'depression',
		slug: 'sma-steg-vid-nedstamdhet',
		title: 'Små steg när energin tryter - vad som faktiskt kan hjälpa',
		description: 'Om varsamma och realistiska steg när energin är låg och allt känns svårt att börja med.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Psykisk hälsa', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'trygghet',
		title: 'Trygghet efter trauma',
		description: 'Om överstärkta stressreaktioner och hur trygghet kan byggas upp igen.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – PTSD och trauma', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Socialstyrelsen – TF-KBT', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/evidensbaserad-praktik/metodguiden/tf-kbt-traumafokuserad-kognitiv-beteendeterapi/' },
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'nervsystemet-och-trauma',
		title: 'Vad händer i nervsystemet vid trauma - fight, flight och freeze',
		description: 'Om hur nervsystemet kan fastna i stark beredskap efter svara upplevelser.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – PTSD och trauma', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Socialstyrelsen – TF-KBT', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/evidensbaserad-praktik/metodguiden/tf-kbt-traumafokuserad-kognitiv-beteendeterapi/' },
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'grounding-ovningar',
		title: 'Grounding - enkla övningar för att landa i kroppen igen',
		description: 'Om grounding som ett sätt att återfå orientering och kontakt med nuet när kroppen är i alarm.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – PTSD och trauma', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: '1177 – Mindfulness och avslappning', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/mindfulness/' },
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'undvikande-efter-trauma',
		title: 'Undvikande efter trauma - varför vi gör det och vad det kostar',
		description: 'Om hur undvikande kan skydda på kort sikt men samtidigt göra livet mindre med tiden.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – PTSD och trauma', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Socialstyrelsen – TF-KBT', url: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/evidensbaserad-praktik/metodguiden/tf-kbt-traumafokuserad-kognitiv-beteendeterapi/' },
		],
	},
	{
		pillarSlug: 'trauma',
		slug: 'tillit-efter-trauma',
		title: 'Tillit och trygghet i relationer efter svara upplevelser',
		description: 'Om hur trauma kan påverka närhet, tillit och känslan av trygghet med andra.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – PTSD och trauma', url: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Mind – Psykisk ohälsa', url: 'https://mind.se/' },
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'orsaker',
		title: 'Varför kan jag inte sova',
		description: 'Vanliga orsaker till sömnproblem och vad som håller hjärnan vaken på natten.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Sömn och hälsa', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnen-ar-viktig-for-din-halsa/' },
			{ label: '1177 – Sömnsvårigheter', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'stress-och-somn',
		title: 'Stress och sömn – när kroppen inte kan varva ner',
		description: 'Om hur stress kan hålla kroppen i beredskap och göra det svårt att komma till ro på kvällen.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Stress', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: '1177 – Sömnsvårigheter', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'altande-pa-kvallen',
		title: 'Ältande på kvällen – varför tankarna blir starkare i sängen',
		description: 'Om varför tankar ofta tar mer plats på kvällen och hur ältande kan hålla dig vaken.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Sömnsvårigheter', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: '1177 – Mindfulness och avslappning', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/mindfulness/' },
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'trott-men-uppvarvad',
		title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget',
		description: 'Om den vanliga konflikten mellan trött kropp och överaktiv hjärna vid sömnproblem.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Sömnsvårigheter', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: '1177 – Stress', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
		],
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'somnbrist-och-maendet',
		title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet',
		description: 'Om hur för lite sömn kan påverka känsloläget, tankarna och orken i vardagen.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Sömnsvårigheter', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/somnsvarigheter/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'lag-sjalvkansla',
		title: 'Låg självkänsla – vad det är och var det kommer ifrån',
		description: 'Om vad låg självkänsla innebär, hur den uppstår och hur du kan börja utforska förhållandena till dig själv.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Självkänsla', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'inre-kritikern',
		title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
		description: 'Om den självkritiska rosten, var den kan komma fran och hur du kan förstå den utan att styras av den.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Självkänsla', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'perfektionism-och-sjalvkansla',
		title: 'Perfektionism och självkänsla - när ingenting känns tillräckligt bra',
		description: 'Om hur perfektionism och låg självkänsla ofta hänger ihop och skapar hård press inifrån.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Självkänsla', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: '1177 – Stress', url: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'gransen-och-sjalvkansla',
		title: 'Att sätta gränser när självkänslan är låg - varför det är svårt',
		description: 'Om varför gränser ofta blir svårare när du tvivlar på ditt eget varde.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Självkänsla', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Mind – Psykisk ohälsa', url: 'https://mind.se/' },
		],
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'jamforelse-och-sjalvbild',
		title: 'Jämförelsetrasket - sociala medier och din självbild',
		description: 'Om hur jämförelser med andra kan påverka självbilden och förstärka känslan av att inte racka till.',
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
		]
		updatedAt: '2026-03-12',
		sources: [
			{ label: '1177 – Självkänsla', url: 'https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/' },
			{ label: 'Folkhälsomyndigheten – Psykisk hälsa', url: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
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

