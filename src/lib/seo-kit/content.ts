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
		pillarSlug: 'depression',
		slug: 'trotthet-och-meningsloshet',
		title: 'Trotthet och meningsloshet - nar ingenting kanns vart att gora',
		description: 'Om trotthet, tomhet och kanslan av att vardagen forlorar sin riktning.',
		faqs: [
			{
				question: 'Varfor blir allt sa tungt nar jag mar daligt?',
				answer: 'Nedstamdhet kan paverka energi, motivation och kanslan av mening, vilket gor att sma saker kan kannas mycket stora.'
			},
			{
				question: 'Ar trottheten bara fysisk?',
				answer: 'Nej, den kan ocksa vara mental och kanslomassig, som om allt i dig gar langsammare.'
			},
			{
				question: 'Varfor tappar jag lusten till sant jag brukade tycka om?',
				answer: 'Det ar vanligt att nedstamdhet gor att intresse och drivkraft minskar, aven for sadant som tidigare kandes viktigt.'
			},
			{
				question: 'Vad kan hjalpa nar allt kanns tomt?',
				answer: 'Ofta ar mycket sma och konkreta steg mer realistiska an att forsoka hitta stor motivation direkt.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstamdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Sma steg nar energin tryter - vad som faktiskt kan hjalpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			},
			{
				title: 'Hur nedstamdhet paverkar relationer och narheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet-och-relationer',
		title: 'Hur nedstamdhet paverkar relationer och narheten till andra',
		description: 'Om hur nedstamdhet kan gora det svarare att orka med kontakt, narhet och samtal.',
		faqs: [
			{
				question: 'Varfor drar jag mig undan nar jag ar nedstamd?',
				answer: 'Nar orken ar lag blir social kontakt ofta mer kravfylld, och ensamhet kan ibland kannas enklare an att forsoka forklara hur det ar.'
			},
			{
				question: 'Kan nedstamdhet skapa missforstand i relationer?',
				answer: 'Ja, andra kan tolka tillbakadragenhet som ointresse trots att det egentligen handlar om att du kampar mycket inombords.'
			},
			{
				question: 'Varfor kanns narhet svarare?',
				answer: 'Nedstamdhet kan minska energi, hopp och tillgang till kanslor, vilket ibland gor det svart att vara narvarande med andra.'
			},
			{
				question: 'Hur kan jag borja prata om det?',
				answer: 'Det kan hjalpa att borja enkelt och beskriva att du har mindre ork just nu, utan att behova forklara allt pa en gang.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstamdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Lag sjalvkansla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Jamforelsetrasket - sociala medier och din sjalvbild',
				href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'sorg-och-depression',
		title: 'Skillnaden mellan sorg och depression - och varfor det spelar roll',
		description: 'Om likheter och skillnader mellan sorg och depression, och varfor de ibland blandas ihop.',
		faqs: [
			{
				question: 'Hur skiljer sig sorg fran depression?',
				answer: 'Sorg ar ofta kopplad till en forlust, medan depression kan vara bredare och paverka hela vardagen under langre tid.'
			},
			{
				question: 'Kan sorg ocksa vara tung och overvaldiga?',
				answer: 'Ja, sorg kan vara mycket stark och paverka bade kropp, somn och ork, utan att det betyder att det ar depression.'
			},
			{
				question: 'Kan man ha bade sorg och depression samtidigt?',
				answer: 'Ja, de kan overlappa varandra och ibland gora det svart att sjalv avgora vad som pagar.'
			},
			{
				question: 'Varfor spelar skillnaden roll?',
				answer: 'For att stodet ibland ser olika ut, och det kan vara viktigt att forsta vad som driver maendet just nu.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstamdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Trotthet och meningsloshet - nar ingenting kanns vart att gora',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Sma steg nar energin tryter - vad som faktiskt kan hjalpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'sma-steg-vid-nedstamdhet',
		title: 'Sma steg nar energin tryter - vad som faktiskt kan hjalpa',
		description: 'Om varsamma och realistiska steg nar energin ar lag och allt kanns svart att borja med.',
		faqs: [
			{
				question: 'Varfor hjalper sma steg battre an stora planer?',
				answer: 'Nar orken ar lag blir for stora krav ofta overvaldiga, medan sma steg ar lattare att genomfora och bygga vidare pa.'
			},
			{
				question: 'Vad kan ett litet steg vara?',
				answer: 'Det kan vara att ata nagot enkelt, ga ut en kort stund eller skicka ett meddelande till nagon du litar pa.'
			},
			{
				question: 'Racker sma steg verkligen?',
				answer: 'Ja, ofta ar det just regelbundna och genomforbara steg som skapar rorelse nar allt annars star still.'
			},
			{
				question: 'Hur undviker jag att bli besviken pa mig sjalv?',
				answer: 'Genom att mata framsteg efter vad som ar mojligt just nu, inte efter hur mycket du tycker att du borde orka.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedstamdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Trotthet och meningsloshet - nar ingenting kanns vart att gora',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstamdhet paverkar relationer och narheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
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
		pillarSlug: 'trauma',
		slug: 'nervsystemet-och-trauma',
		title: 'Vad hander i nervsystemet vid trauma - fight, flight och freeze',
		description: 'Om hur nervsystemet kan fastna i stark beredskap efter svara upplevelser.',
		faqs: [
			{
				question: 'Vad betyder fight, flight och freeze?',
				answer: 'Det ar kroppens automatiska overlevnadsreaktioner nar nagot upplevs som hotfullt eller overvaldiga.'
			},
			{
				question: 'Varfor reagerar kroppen sa snabbt?',
				answer: 'Nervsystemet ar byggt for att skydda dig, och efter trauma kan det bli extra kansligt for signaler om fara.'
			},
			{
				question: 'Kan reaktionerna komma trots att jag vet att jag ar saker nu?',
				answer: 'Ja, kroppen kan reagera fore den medvetna tanken hinner ikapp, sarskilt om den lart sig att vara pa sin vakt.'
			},
			{
				question: 'Hjalper det att forsta reaktionen?',
				answer: 'Ofta ja. Att se reaktionen som ett skyddssystem snarare an ett personligt fel kan minska skam och forvirring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla ovningar for att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Stress och somn - nar kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'grounding-ovningar',
		title: 'Grounding - enkla ovningar for att landa i kroppen igen',
		description: 'Om grounding som ett satt att aterfa orientering och kontakt med nuet nar kroppen ar i alarm.',
		faqs: [
			{
				question: 'Vad ar grounding?',
				answer: 'Grounding ar enkla satt att flytta uppmarksamheten till kroppen, omgivningen och det som ar har och nu.'
			},
			{
				question: 'Nar kan grounding vara hjalpsamt?',
				answer: 'Det kan hjalpa vid overstark aktivering, flashbacks, dissociation eller nar du kanner att du tappar fotfastet.'
			},
			{
				question: 'Maste jag gora det perfekt for att det ska fungera?',
				answer: 'Nej, det viktiga ar inte att gora ratt utan att forsiktigt hitta nagot som gor dig lite mer narvarande.'
			},
			{
				question: 'Vad ar ett enkelt exempel?',
				answer: 'Att namna fem saker du ser, kanna fotterna mot golvet eller halla i ett foremal kan vara en enkel borjan.'
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
				title: 'Undvikande efter trauma - varfor vi gor det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'undvikande-efter-trauma',
		title: 'Undvikande efter trauma - varfor vi gor det och vad det kostar',
		description: 'Om hur undvikande kan skydda pa kort sikt men samtidigt gora livet mindre med tiden.',
		faqs: [
			{
				question: 'Varfor undviker jag vissa platser eller situationer?',
				answer: 'Undvikande ar ofta ett satt att minska risken att triggas eller overvaldigas igen.'
			},
			{
				question: 'Ar undvikande alltid fel?',
				answer: 'Nej, det kan vara ett forsta skydd. Problemet uppstar nar det borjar styra allt mer av vardagen.'
			},
			{
				question: 'Hur kan undvikande paverka livet pa sikt?',
				answer: 'Det kan gora livet mindre, skapa isolering och halla radsla vid liv eftersom kroppen aldrig far erfara att allt inte ar farligt.'
			},
			{
				question: 'Vad kan vara ett varsamt nasta steg?',
				answer: 'Att forst lagga marke till vad du undviker och varfor kan vara ett viktigt steg innan du provar nagon liten forandring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla ovningar for att landa i kroppen igen',
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
		description: 'Om hur trauma kan paverka narhet, tillit och kanslan av trygghet med andra.',
		faqs: [
			{
				question: 'Varfor ar det svart att lita pa andra efter trauma?',
				answer: 'Svara upplevelser kan gora att nervsystemet blir mer vaksamt, ocksa i relationer som egentligen ar trygga.'
			},
			{
				question: 'Kan jag vilja ha narhet men samtidigt dra mig undan?',
				answer: 'Ja, det ar vanligt att langta efter kontakt och samtidigt kanna att den blir for utsatt eller overvaldiga.'
			},
			{
				question: 'Hur bygger man upp tillit igen?',
				answer: 'Ofta i sma steg, genom forutsagbarhet, tydliga granser och erfarenheter av att bli mottagen utan press.'
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
				title: 'Undvikande efter trauma - varfor vi gor det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Grounding - enkla ovningar for att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
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
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'inre-kritikern',
		title: 'Den inre kritikern - varfor rosten finns och vad den egentligen vill',
		description: 'Om den sjalvkritiska rosten, var den kan komma fran och hur du kan forsta den utan att styras av den.',
		faqs: [
			{
				question: 'Varfor ar jag sa hard mot mig sjalv?',
				answer: 'Den inre kritikern utvecklas ofta som ett satt att forsoka skydda dig fran misstag, avvisande eller skam.'
			},
			{
				question: 'Betyder sjalvkritik att jag ar lat eller svag?',
				answer: 'Nej, stark sjalvkritik ar ofta ett tecken pa hog press och gamla satt att hantera otrygghet.'
			},
			{
				question: 'Kan den inre kritikern ha en funktion?',
				answer: 'Ja, den forsoker ofta hjalpa genom kontroll, men den gor det pa ett satt som kan bli hart och nedbrytande.'
			},
			{
				question: 'Hur kan jag borja forandra den rosten?',
				answer: 'Ett forsta steg ar att lagga marke till tonen och orden, sa att du kan skilja rosten fran det du faktiskt behover.'
			}
		],
		relatedArticles: [
			{
				title: 'Lag sjalvkansla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och sjalvkansla - nar ingenting kanns tillrackligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstamdhet paverkar relationer och narheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'perfektionism-och-sjalvkansla',
		title: 'Perfektionism och sjalvkansla - nar ingenting kanns tillrackligt bra',
		description: 'Om hur perfektionism och lag sjalvkansla ofta hanger ihop och skapar hard press inifran.',
		faqs: [
			{
				question: 'Varfor blir jag aldrig nojd med det jag gor?',
				answer: 'Nar sjalvkanslan ar skor blir prestation ibland ett satt att forsoka kanna sig tillracklig, men ribban flyttas hela tiden.'
			},
			{
				question: 'Ar perfektionism ett tecken pa ambition?',
				answer: 'Ibland, men det kan ocksa handla om radsla for kritik, misslyckande eller att inte duga.'
			},
			{
				question: 'Hur paverkar perfektionism maendet?',
				answer: 'Den kan skapa stress, sjalvkritik och kanslan av att du maste prestera for att fa vila eller kanna dig okej.'
			},
			{
				question: 'Vad kan hjalpa?',
				answer: 'Att upptacka dina egna krav och prova mer tillrackligt bra i sma situationer kan minska trycket over tid.'
			}
		],
		relatedArticles: [
			{
				title: 'Lag sjalvkansla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varfor rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Sma steg nar energin tryter - vad som faktiskt kan hjalpa',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'gransen-och-sjalvkansla',
		title: 'Att satta granser nar sjalvkanslan ar lag - varfor det ar svart',
		description: 'Om varfor granser ofta blir svarare nar du tvivlar pa ditt eget varde.',
		faqs: [
			{
				question: 'Varfor ar det sa svart att saga nej?',
				answer: 'Nar sjalvkanslan ar lag blir andras reaktioner ofta extra viktiga, och da kan ett nej kannas riskfyllt.'
			},
			{
				question: 'Kan lag sjalvkansla gora att jag gar over mina egna behov?',
				answer: 'Ja, det ar vanligt att prioritera andras behov for att undvika skuld, konflikt eller kanslan av att vara besvarlig.'
			},
			{
				question: 'Hur marks det att jag saknar granser?',
				answer: 'Du kanske sager ja fast du inte vill, blir overbelastad eller kanner bitterhet efterat utan att riktigt veta varfor.'
			},
			{
				question: 'Vad ar ett litet forsta steg?',
				answer: 'Att borja lagga marke till nar du egentligen vill dra en grans kan vara ett viktigt steg innan du uttrycker den hogt.'
			}
		],
		relatedArticles: [
			{
				title: 'Lag sjalvkansla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varfor rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Hur nedstamdhet paverkar relationer och narheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'jamforelse-och-sjalvbild',
		title: 'Jamforelsetrasket - sociala medier och din sjalvbild',
		description: 'Om hur jamforelser med andra kan paverka sjalvbilden och forstarka kanslan av att inte racka till.',
		faqs: [
			{
				question: 'Varfor paverkas jag sa mycket av andras liv online?',
				answer: 'Sociala medier visar ofta utvalda delar av andras liv, och hjarnan jamfor dem latt med dina minst glansiga stunder.'
			},
			{
				question: 'Kan jamforelser sanka sjalvkanslan?',
				answer: 'Ja, sarskilt om du redan tvivlar pa ditt eget varde eller ofta letar efter tecken pa att andra lyckas battre.'
			},
			{
				question: 'Ar losningen att sluta helt med sociala medier?',
				answer: 'Inte alltid, men det kan hjalpa att lagga marke till vad som triggar jamforelser och skapa mer medvetna vanor.'
			},
			{
				question: 'Hur kan jag skydda min sjalvbild?',
				answer: 'Att begransa det som far dig att ma samre och samtidigt ova pa att atervanda till ditt eget perspektiv kan gora skillnad.'
			}
		],
		relatedArticles: [
			{
				title: 'Lag sjalvkansla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och sjalvkansla - nar ingenting kanns tillrackligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedstamdhet paverkar relationer och narheten till andra',
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
