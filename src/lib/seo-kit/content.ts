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
		title: 'Ångest',
		description: 'Förstå vanliga reaktioner vid ?ngest och hur du kan hantera dem stegvis.',
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
		description: 'Om stressreaktioner efter svaira handelser och satt att bygga mer trygghet.',
		chatPath: '/chat/e'
	},
	{
		slug: 'sovproblem',
		title: 'Sömnproblem',
		description: 'Förstå varför sömnen uteblir och hur du kan börja hantera det som haller dig vaken.',
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
				title: 'Tecken på ?ngest',
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
				title: 'Låg självkänsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet',
		title: 'Nedstämdhet eller depression',
		description: 'Skillnader mellan tillfällig nedstämdhet och depression.',
		faqs: [
			{
				question: 'Hur vet jag om det ar depression?',
				answer: 'Om nedstämdhet, hopploshet eller energibrist sitter i under flera veckor och påverkar vardagen.'
			},
			{
				question: 'Ar trötthet ett vanligt tecken?',
				answer: 'Ja, manga for minskad ork, svårt att komma igang och mindre intresse for tidigare aktiviteter.'
			},
			{
				question: 'Kan små steg gora skillnad?',
				answer: 'Ja, f?sta rutiner, korta promenader och kontakt med andra kan vara viktiga f?rbattringssteg.'
			},
			{
				question: 'När ar det akut att soka hjälp?',
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
				title: 'Små steg när energin tryter – vad som f?ktiskt kan hjälp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'trotthet-och-meningsloshet',
		title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
		description: 'Om trötthet, tomhet och känslan av att vardagen förlorar sin riktning.',
		faqs: [
			{
				question: 'Varför blir allt sa tungt när jag mar daligt?',
				answer: 'Nedstämdhet kan påverka energi, motivation och känslan av mening, vilket gor att små saker kan kannas mycket stora.'
			},
			{
				question: 'Ar tröttheten bara fysisk?',
				answer: 'Nej, den kan ocksa vara mental och känslomässig, som om allt i dig gar langsammare.'
			},
			{
				question: 'Varför tapp?r jag lusten till sant jag brukade tycka om?',
				answer: 'Det ar vanligt att nedstämdhet gor att intresse och drivkraft minskar, aven for sadant som tidigare kandes viktigt.'
			},
			{
				question: 'Vad kan hjälp? när allt känns tomt?',
				answer: 'Ofta ar mycket små och konkreta steg mer realistiska an att f?rsoka hitta stor motivation direkt.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Sm? steg när energin tryter - vad som f?ktiskt kan hjälp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet-och-relationer',
		title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
		description: 'Om hur nedstämdhet kan gora det svårare att orka med kontakt, närhet och samtal.',
		faqs: [
			{
				question: 'Varför drar jag mig undan när jag ar nedstamd?',
				answer: 'När orken ar låg blir social kontakt ofta mer kravfylld, och ensamhet kan ibland kannas enklare an att f?rsoka förklara hur det ar.'
			},
			{
				question: 'Kan nedstämdhet skap? missförstånd i relationer?',
				answer: 'Ja, andra kan tolka tillbakadragenhet som ointresse trots att det egentligen handlar om att du kamp?r mycket inombords.'
			},
			{
				question: 'Varför känns närhet svårare?',
				answer: 'Nedstämdhet kan minska energi, hopp och tillgang till känslor, vilket ibland gor det svårt att vara närvarande med andra.'
			},
			{
				question: 'Hur kan jag börja prata om det?',
				answer: 'Det kan hjälp? att börja enkelt och beskriva att du har mindre ork just nu, utan att behova förklara allt på en gang.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Låg självkänsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Jamf?relsetrasket - sociala medier och din självbild',
				href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'sorg-och-depression',
		title: 'Skillnaden mellan sorg och depression - och varför det spelar roll',
		description: 'Om likheter och skillnader mellan sorg och depression, och varför de ibland blandas ihop.',
		faqs: [
			{
				question: 'Hur skiljer sig sorg fran depression?',
				answer: 'Sorg ar ofta kopplad till en förlust, medan depression kan vara bredare och påverka hela vardagen under längre tid.'
			},
			{
				question: 'Kan sorg ocksa vara tung och ?vervaldiga?',
				answer: 'Ja, sorg kan vara mycket stark och påverka bade kropp, sömn och ork, utan att det betyder att det ar depression.'
			},
			{
				question: 'Kan man ha bade sorg och depression samtidigt?',
				answer: 'Ja, de kan ?verlapp? varandra och ibland gora det svårt att själv avgora vad som p?gar.'
			},
			{
				question: 'Varför spelar skillnaden roll?',
				answer: 'for att stodet ibland ser olika ut, och det kan vara viktigt att först? vad som driver måendet just nu.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Trötthet och meningslöshet - när ingenting känns värt att gora',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Sm? steg när energin tryter - vad som f?ktiskt kan hjälp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'sma-steg-vid-nedstamdhet',
		title: 'Små steg när energin tryter - vad som f?ktiskt kan hjälp?',
		description: 'Om varsamma och realistiska steg när energin ar låg och allt känns svårt att börja med.',
		faqs: [
			{
				question: 'Varför hjälper små steg battre an stora planer?',
				answer: 'När orken ar låg blir for stora krav ofta ?vervaldiga, medan små steg ar lattare att genomföra och bygga vidare på.'
			},
			{
				question: 'Vad kan ett litet steg vara?',
				answer: 'Det kan vara att ata nagot enkelt, ga ut en kort stund eller skicka ett meddelande till nagon du litar på.'
			},
			{
				question: 'Racker små steg verkligen?',
				answer: 'Ja, ofta ar det just regelbundna och genomförbara steg som skap?r rörelse när allt ann?rs star still.'
			},
			{
				question: 'Hur undviker jag att bli besviken på mig själv?',
				answer: 'Genom att mata framsteg efter vad som ar mojligt just nu, inte efter hur mycket du tycker att du borde orka.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstämdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Trötthet och meningslöshet - när ingenting känns värt att gora',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'trygghet',
		title: 'Trygghet efter trauma',
		description: 'Om ?verstarkta stressreaktioner och hur trygghet kan byggas upp igen.',
		faqs: [
			{
				question: 'Vad ar en vanlig reaktion efter trauma?',
				answer: 'Flashbacks, oro, spänningskänsla och sv?rta sömnperioder ar vanliga tidiga reaktioner.'
			},
			{
				question: 'Varför reagerar kroppen sa starkt?',
				answer: 'Nervsystemet kan sta kvar i hog beredskap efter en ?vervaldigande handelse.'
			},
			{
				question: 'Hur bygger jag mer trygghet i vardagen?',
				answer: 'Sm? f?rutsagbara rutiner, grounding och trygg kontakt med andra brukar vara hjälpsamt.'
			},
			{
				question: 'När bor jag prata med en terapeut?',
				answer: 'Om symtomen varar eller okar, eller om minnen och undvikande begränsar ditt liv.'
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
		pillarSlug: 'trauma',
		slug: 'nervsystemet-och-trauma',
		title: 'Vad hander i nervsystemet vid trauma - fight, flight och freeze',
		description: 'Om hur nervsystemet kan f?stna i stark beredskap efter svara upplevelser.',
		faqs: [
			{
				question: 'Vad betyder fight, flight och freeze?',
				answer: 'Det ar kroppens automatiska ?verlevnadsreaktioner när nagot upplevs som hotfullt eller ?vervaldiga.'
			},
			{
				question: 'Varför reagerar kroppen sa snabbt?',
				answer: 'Nervsystemet ar byggt for att skydda dig, och efter trauma kan det bli extra känsligt for signaler om fara.'
			},
			{
				question: 'Kan reaktionerna komma trots att jag vet att jag ar saker nu?',
				answer: 'Ja, kroppen kan reagera före den medvetna tanken hinner ikapp, sarskilt om den lart sig att vara på sin vakt.'
			},
			{
				question: 'Hjälper det att först? reaktionen?',
				answer: 'Ofta ja. Att se reaktionen som ett skyddssystem sn?rare an ett personligt fel kan minska skam och förvirring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla ?vningar for att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Stress och sömn – när kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'grounding-ovningar',
		title: 'Grounding - enkla ?vningar for att landa i kroppen igen',
		description: 'Om grounding som ett satt att aterf? orientering och kontakt med nuet när kroppen ar i alarm.',
		faqs: [
			{
				question: 'Vad ar grounding?',
				answer: 'Grounding ar enkla satt att flytta uppmarksamheten till kroppen, omgivningen och det som ar har och nu.'
			},
			{
				question: 'När kan grounding vara hjälpsamt?',
				answer: 'Det kan hjälp? vid ?verstark aktivering, flashbacks, dissociation eller när du kanner att du tapp?r fotfästet.'
			},
			{
				question: 'Maste jag gora det perfekt for att det ska fungera?',
				answer: 'Nej, det viktiga ar inte att gora ratt utan att försiktigt hitta nagot som gor dig lite mer närvarande.'
			},
			{
				question: 'Vad ar ett enkelt exempel?',
				answer: 'Att namna fem saker du ser, kanna fotterna mot golvet eller halla i ett f?remal kan vara en enkel början.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Vad hander i nervsystemet vid trauma - fight, flight och freeze',
				href: '/guider-seo/trauma/nervsystemet-och-trauma'
			},
			{
				title: 'Undvikande efter trauma - varför vi gor det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'undvikande-efter-trauma',
		title: 'Undvikande efter trauma - varför vi gor det och vad det kostar',
		description: 'Om hur undvikande kan skydda på kort sikt men samtidigt gora livet mindre med tiden.',
		faqs: [
			{
				question: 'Varför undviker jag vissa platser eller situationer?',
				answer: 'Undvikande ar ofta ett satt att minska risken att triggas eller ?vervaldigas igen.'
			},
			{
				question: 'Ar undvikande alltid fel?',
				answer: 'Nej, det kan vara ett först? skydd. Problemet uppstar när det börjar styra allt mer av vardagen.'
			},
			{
				question: 'Hur kan undvikande påverka livet på sikt?',
				answer: 'Det kan gora livet mindre, skap? isolering och halla rädsla vid liv eftersom kroppen aldrig for erf?ra att allt inte ar f?rligt.'
			},
			{
				question: 'Vad kan vara ett varsamt nästa steg?',
				answer: 'Att först l?gga marke till vad du undviker och varför kan vara ett viktigt steg innan du provar nagon liten f?randring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla ?vningar for att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Tillit och trygghet i relationer efter svara upplevelser',
				href: '/guider-seo/trauma/tillit-efter-trauma'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'tillit-efter-trauma',
		title: 'Tillit och trygghet i relationer efter svara upplevelser',
		description: 'Om hur trauma kan påverka närhet, tillit och känslan av trygghet med andra.',
		faqs: [
			{
				question: 'Varför ar det svårt att lita på andra efter trauma?',
				answer: 'Svara upplevelser kan gora att nervsystemet blir mer vaksamt, ocksa i relationer som egentligen ar trygga.'
			},
			{
				question: 'Kan jag vilja ha närhet men samtidigt dra mig undan?',
				answer: 'Ja, det ar vanligt att langta efter kontakt och samtidigt kanna att den blir for utsatt eller ?vervaldiga.'
			},
			{
				question: 'Hur bygger man upp tillit igen?',
				answer: 'Ofta i små steg, genom f?rutsagbarhet, tydliga gränser och erf?renheter av att bli mottagen utan press.'
			},
			{
				question: 'Ar det konstigt om gamla reaktioner kommer tillbaka i relationer?',
				answer: 'Nej, relationer kan vacka gamla skyddsreaktioner, sarskilt om du tidigare blivit sarad eller otrygg med andra.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Undvikande efter trauma - varför vi gor det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Grounding - enkla ?vningar for att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'orsaker',
		title: 'Varför kan jag inte sova',
		description: 'Vanliga orsaker till s?mnproblem och vad som haller hjärnan vaken på natten.',
		faqs: [
			{
				question: 'Varför kan jag inte s?mna trots att jag ar trott?',
				answer: 'Hjärnan kan vara i hog beredskap på grund av stress, oro eller obearbetade tankar som aktiverar nervsystemet.'
			},
			{
				question: 'Ar s?mnproblem ett tecken på nagonting allvarligt?',
				answer: 'Inte alltid, men langvariga s?mnproblem kan vara kopplade till ?ngest, depression eller stress som f?rtjan?r uppmarksamhet.'
			},
			{
				question: 'Kan man tranas upp till battre sömn?',
				answer: 'Ja, sömn påverkas av vanor, kanslobearbetning och trygghetsk?nsla – alla saker som kan f?randra med tid och stod.'
			},
			{
				question: 'Hjälper det att prata om det som oroar en?',
				answer: 'Ofta ja. Att satta ord på oron kan minska den mentala aktiveringen och gora det lattare att slappna av.'
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
		title: 'Stress och sömn – när kroppen inte kan varva ner',
		description: 'Om hur stress kan hålla kroppen i beredskap och göra det svårt att komma till ro på kvällen.',
		faqs: [
			{
				question: 'Varför blir sömnen svårare när jag är stressad?',
				answer: 'Stress aktiverar nervsystemet och gör att kroppen stann?r i hög beredskap trots att du egentligen behöver vila.'
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
				answer: 'Att lägga märke till stresspåsl?get, sakta ner tempot och ge kroppen en tydlig övergång mellan dag och natt kan vara en bra början.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'altande-pa-kvallen',
		title: 'Ältande på kvällen – varför tankarna blir starkare i sängen',
		description: 'Om varför tankar ofta tar mer plats på kvällen och hur ältande kan hålla dig vaken.',
		faqs: [
			{
				question: 'Varför börjar jag tanka mer just när jag l?gger mig?',
				answer: 'När det blir tyst omkring dig for hjärnan mer utrymme, och oro eller obearbetade intryck kan bli tydligare.'
			},
			{
				question: 'Ar altande samma sak som problemlosning?',
				answer: 'Inte riktigt. Altande känns ofta som att tankarna gar i cirklar utan att leda till ett tydligt svar eller beslut.'
			},
			{
				question: 'Kan kvallsoro gora att jag sömn?r sen?re?',
				answer: 'Ja, mental aktivering på kvallen kan gora det svare att komma ner i ro och slapp? taget om dagen.'
			},
			{
				question: 'Vad kan hjälp? när tankarna snurrar i sangen?',
				answer: 'Det kan hjälp? att satta ord på tankarna tidigare på kvallen eller anvanda en lugn rutin som markerar att dagen ar slut.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'trott-men-uppvarvad',
		title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget',
		description: 'Om den vanliga konflikten mellan trött kropp och överaktiv hjärna vid sömnproblem.',
		faqs: [
			{
				question: 'Hur kan jag vara trott men anda inte kunna s?mna?',
				answer: 'Det hander när kroppen behöver vila men hjärnan f?rtf?rande ar aktiv av stress, oro eller ?verstimulering.'
			},
			{
				question: 'Ar det vanligt att kanna sig rastlos på kvallen?',
				answer: 'Ja, manga beskriver en rastlos eller sp?nd känsla trots att de ar helt slut i kroppen.'
			},
			{
				question: 'Betyder det har att nagot ar fel på mig?',
				answer: 'Inte nodvandigtvis. Det ar ofta en reaktion på belastning, hog ansp?nning eller att nervsystemet inte har hunnit varva ner.'
			},
			{
				question: 'Vad kan minska den har känslan?',
				answer: 'Lugna ?verganger, mindre press kring sömnen och regelbundna stunder for ?terh?mtning under dagen kan gora skillnad ?ver tid.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'somnbrist-och-maendet',
		title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet',
		description: 'Om hur för lite sömn kan påverka känsloläget, tankarna och orken i vardagen.',
		faqs: [
			{
				question: 'Kan s?mnbrist gora mig mer orolig?',
				answer: 'Ja, for lite sömn kan gora nervsystemet mer känsligt och det kan bli svårare att hantera oro och stress.'
			},
			{
				question: 'Varför blir jag lattare irriterad när jag sovit daligt?',
				answer: 'När du har s?mnbrist for hjärnan svårare att reglera känslor, vilket kan gora att små saker känns storre an de brukar.'
			},
			{
				question: 'Kan dalig sömn hanga ihop med nedstämdhet?',
				answer: 'Ja, sömn och mående påverkar varandra starkt och langvariga s?mnproblem kan bidra till nedstämdhet eller f?rvarra den.'
			},
			{
				question: 'När bor jag ta hjälp for bade sömn och mående?',
				answer: 'Om sömnbristen p?gatt ett tag och samtidigt påverkar hur du mar, fungerar eller orkar i vardagen ar det klokt att soka stod.'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'lag-sjalvkansla',
		title: 'Låg självkänsla – vad det ar och var det kommer ifran',
		description: 'Om vad låg självkänsla innebar, hur den uppstar och hur du kan börja utforska f?rhallandena till dig själv.',
		faqs: [
			{
				question: 'Vad ar skillnaden mellan självkänsla och sj?lvf?rtroende?',
				answer: 'Sjalvk?nsla handlar om känslan av att vara tillracklig som person. Sjalvf?rtroende handlar mer om tron på sin f?rmaga i specifika situationer.'
			},
			{
				question: 'Kan låg självkänsla f?randra sig?',
				answer: 'Ja. Sjalvk?nsla ar inte f?st – den påverkas av erf?renheter, relationer och hur vi bearbetar dem ?ver tid.'
			},
			{
				question: 'Varför ar det svårt att ta emot berom?',
				answer: 'Vid låg självkänsla stammer inte berom ?verens med den inre bilden av sig själv, och hjärnan tenderar att avf?rda det som oarligt.'
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
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'inre-kritikern',
		title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
		description: 'Om den självkritiska rosten, var den kan komma fran och hur du kan först? den utan att styras av den.',
		faqs: [
			{
				question: 'Varför ar jag sa hard mot mig själv?',
				answer: 'Den inre kritikern utvecklas ofta som ett satt att f?rsoka skydda dig fran misstag, avvisande eller skam.'
			},
			{
				question: 'Betyder sj?lvkritik att jag ar lat eller sv?g?',
				answer: 'Nej, stark sj?lvkritik ar ofta ett tecken på hog press och gamla satt att hantera otrygghet.'
			},
			{
				question: 'Kan den inre kritikern ha en funktion?',
				answer: 'Ja, den f?rsoker ofta hjälp? genom kontroll, men den gor det på ett satt som kan bli hart och nedbrytande.'
			},
			{
				question: 'Hur kan jag börja f?randra den rosten?',
				answer: 'Ett först? steg ar att l?gga marke till tonen och orden, sa att du kan skilja rosten fran det du f?ktiskt behöver.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och självkänsla - när ingenting känns tillrackligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'perfektionism-och-sjalvkansla',
		title: 'Perfektionism och självkänsla - när ingenting känns tillrackligt bra',
		description: 'Om hur perfektionism och låg självkänsla ofta hanger ihop och skap?r hard press inifran.',
		faqs: [
			{
				question: 'Varför blir jag aldrig nojd med det jag gor?',
				answer: 'När sj?lvk?nslan ar skor blir prestation ibland ett satt att f?rsoka kanna sig tillracklig, men ribban flyttas hela tiden.'
			},
			{
				question: 'Ar perfektionism ett tecken på ambition?',
				answer: 'Ibland, men det kan ocksa handla om rädsla for kritik, misslyckande eller att inte duga.'
			},
			{
				question: 'Hur påverkar perfektionism måendet?',
				answer: 'Den kan skap? stress, sj?lvkritik och känslan av att du maste prestera for att f? vila eller kanna dig okej.'
			},
			{
				question: 'Vad kan hjälp?',
				answer: 'Att upptacka dina egna krav och prova mer tillrackligt bra i små situationer kan minska trycket ?ver tid.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varför rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Sm? steg när energin tryter - vad som f?ktiskt kan hjälp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'gransen-och-sjalvkansla',
		title: 'Att satta gränser när sj?lvk?nslan ar låg - varför det ar svårt',
		description: 'Om varför gränser ofta blir svårare när du tvivlar på ditt eget varde.',
		faqs: [
			{
				question: 'Varför ar det sa svårt att saga nej?',
				answer: 'När sj?lvk?nslan ar låg blir andras reaktioner ofta extra viktiga, och da kan ett nej kannas riskfyllt.'
			},
			{
				question: 'Kan låg självkänsla gora att jag gar ?ver mina egna behov?',
				answer: 'Ja, det ar vanligt att prioritera andras behov for att undvika skuld, konflikt eller känslan av att vara besvarlig.'
			},
			{
				question: 'Hur marks det att jag sakn?r gränser?',
				answer: 'Du kanske sager ja f?st du inte vill, blir ?verbelastad eller kanner bitterhet efterat utan att riktigt veta varför.'
			},
			{
				question: 'Vad ar ett litet först? steg?',
				answer: 'Att börja l?gga marke till när du egentligen vill dra en gr?ns kan vara ett viktigt steg innan du uttrycker den hogt.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det ar och var det kommer ifran',
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
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'jamforelse-och-sjalvbild',
		title: 'Jamf?relsetrasket - sociala medier och din självbild',
		description: 'Om hur jämförelser med andra kan påverka självbilden och först?rka känslan av att inte racka till.',
		faqs: [
			{
				question: 'Varför påverkas jag sa mycket av andras liv online?',
				answer: 'Sociala medier visar ofta utvalda delar av andras liv, och hjärnan jamf?r dem latt med dina minst glansiga stunder.'
			},
			{
				question: 'Kan jämförelser sanka sj?lvk?nslan?',
				answer: 'Ja, sarskilt om du redan tvivlar på ditt eget varde eller ofta letar efter tecken på att andra lyckas battre.'
			},
			{
				question: 'Ar losningen att sluta helt med sociala medier?',
				answer: 'Inte alltid, men det kan hjälp? att l?gga marke till vad som triggar jämförelser och skap? mer medvetna vanor.'
			},
			{
				question: 'Hur kan jag skydda min självbild?',
				answer: 'Att begr?nsa det som for dig att ma samre och samtidigt ova på att atervanda till ditt eget perspektiv kan gora skillnad.'
			}
		],
		relatedArticles: [
			{
				title: 'Låg självkänsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och självkänsla - när ingenting känns tillrackligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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

