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
	f?qs: FaqItem[];
	relatedArticles?: RelatedArticle[];
};

export const pillars: Pillar[] = [
	{
		slug: 'angest',
		title: 'Ångest',
		description: 'F?rst? vanliga reaktioner vid ?ngest och hur du kan hantera dem stegvis.',
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
		description: 'F?rst? varf?r s?mnen uteblir och hur du kan b?rja hantera det som haller dig vaken.',
		chatPath: '/chat/a'
	},
	{
		slug: 'sjalvkansla',
		title: 'Självkänsla',
		description: 'Om l?g sj?lvk?nsla, vad det beror p? och hur du kan b?rja utf?rska din relation till dig sj?lv.',
		chatPath: '/chat/a'
	}
];

export const guides: Guide[] = [
	{
		pillarSlug: 'angest',
		slug: 'tecken',
		title: 'Tecken p? ?ngest',
		description: 'Vanliga kroppsliga och mentala tecken p? ?ngest.',
		f?qs: [
			{
				question: 'Hur k?nns ?ngest i kroppen?',
				answer: 'Manga upplever hj?rtklappning, tryck ?ver br?stet, yrsel eller snabb andning.'
			},
			{
				question: 'Ar ?ngest f?rligt?',
				answer: '?ngest i sig ar oftast inte f?rligt, men den kan vara mycket jobbig och bor tas p? allvar.'
			},
			{
				question: 'N?r bor jag soka professionell hj?lp?',
				answer: 'Om ?ngesten styr vardagen, p?verkar s?mn eller gor att du undviker mycket i livet.'
			},
			{
				question: 'Kan andningstekniker hj?lp? snabbt?',
				answer: 'Ja, langsam och regelbunden andning kan ofta minska stressreaktionen inom nagra minuter.'
			}
		],
		relatedArticles: [
			{
				title: 'Panikångest â€“ vad som händer i kroppen och hur du kan hantera det',
				href: '/guider-seo/angest/panikangest-och-kroppen'
			},
			{
				title: 'Orostankar som snurrar â€“ när hjärnan inte kan stänga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Ångest och sömn â€“ varför natten kan bli svårare',
				href: '/guider-seo/angest/angest-och-somn'
			},
			{
				title: 'Social ångest â€“ rädslan för att bli bedömd av andra',
				href: '/guider-seo/angest/social-angest'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'panikangest-och-kroppen',
		title: 'Panikångest â€“ vad som händer i kroppen och hur du kan hantera det',
		description: 'Om kroppens starka reaktioner vid p?nikångest och hur du kan förstå det som händer.',
		f?qs: [
			{
				question: 'Varför reagerar kroppen så starkt vid p?nikångest?',
				answer: 'Kroppen går in i alarmberedskap, vilket kan ge hjärtklappning, yrsel, tryck över bröstet och snabb andning.'
			},
			{
				question: 'Ar p?nik?ngest f?rligt?',
				answer: 'Det brukar inte vara f?rligt i sig, men upplevelsen kan vara mycket intensiv och skrämmande.'
			},
			{
				question: 'Varför känns det som att jag tapp?r kontrollen?',
				answer: 'När stressystemet slår på starkt kan hjärnan tolka reaktionerna som ett hot, vilket förstärker känslan.'
			},
			{
				question: 'Vad kan hjälp? i stunden?',
				answer: 'Att sakta ner andningen, stanna kvar i nuet och påminna dig om att reaktionen går över kan minska intensiteten.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken på ångest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar â€“ när hjärnan inte kan stänga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'Ångest och sömn â€“ varför natten kan bli svårare',
				href: '/guider-seo/angest/angest-och-somn'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'orostankar',
		title: 'Orostankar som snurrar - n?r hj?rnan inte kan st?nga av',
		description: 'Om oro som gar runt i cirklar och gor det sv?rt att komma till ro.',
		f?qs: [
			{
				question: 'Varf?r f?stn?r jag i orostankar?',
				answer: 'Hj?rnan f?rsoker ofta f?rutse problem f?r att skydda dig, men det kan i stallet leda till att tankarna aldrig f?r vila.'
			},
			{
				question: 'Ar oro alltid nagot negativt?',
				answer: 'Inte alltid, men n?r oron tar ?ver och p?verkar s?mn, fokus eller vardag blir den ofta mer belastande an hj?lpsam.'
			},
			{
				question: 'Kan orostankar oka p? kvallen?',
				answer: 'Ja, n?r det blir tyst och stilla f?r tankarna ofta mer utrymme och kan kannas starkare.'
			},
			{
				question: 'Vad kan vara ett första steg?',
				answer: 'Att l?gga marke till n?r oron b?rjar dra iv?g och ge den en tydlig plats i stallet f?r att folja varje tanke kan hj?lp?.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken p? ?ngest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Panik?ngest - vad som hander i kroppen och hur du kan hantera det',
				href: '/guider-seo/angest/panikangest-och-kroppen'
			},
			{
				title: '?ngest och s?mn - varf?r natten kan bli sv?rare',
				href: '/guider-seo/angest/angest-och-somn'
			}
		]
	},
	{
		pillarSlug: 'angest',
		slug: 'angest-och-somn',
		title: '?ngest och s?mn - varf?r natten kan bli sv?rare',
		description: 'Om hur ?ngest ofta blir tydligare p? kvallen och kan gora det sv?rt att s?mna eller sova lugnt.',
		f?qs: [
			{
				question: 'Varf?r blir ?ngesten starkare p? natten?',
				answer: 'N?r tempot sjunker och intrycken minskar f?r k?nslor och tankar ofta mer plats, vilket kan gora ?ngesten tydligare.'
			},
			{
				question: 'Kan ?ngest vacka mig under natten?',
				answer: 'Ja, vissa vakn?r med hj?rtklappning, oro eller stark kroppslig ansp?nning mitt i natten.'
			},
			{
				question: 'Gor dalig s?mn ?ngesten varre?',
				answer: 'Ofta ja. S?mnbrist kan gora nervsystemet mer k?nsligt och det kan bli sv?rare att hantera oro dagen efter.'
			},
			{
				question: 'Vad kan hj?lp? mest?',
				answer: 'Att minska pressen kring s?mnen och samtidigt f? stod i det som skap?r ?ngesten brukar vara viktigare an att bara f?rsoka sova mer.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken p? ?ngest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Varf?r kan jag inte sova',
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
		title: 'Social ?ngest - r?dslan f?r att bli bed?md av andra',
		description: 'Om oro i sociala situationer och varf?r blicken fran andra kan kannas sa stark.',
		f?qs: [
			{
				question: 'Vad ar social ?ngest?',
				answer: 'Det handlar ofta om stark oro f?r att bli gr?nskad, bortgjord eller negativt bed?md i sociala sammanhang.'
			},
			{
				question: 'Varf?r undviker jag vissa situationer?',
				answer: 'Undvikande blir ofta ett satt att f?rsoka minska obehaget snabbt, men det kan samtidigt halla oron vid liv.'
			},
			{
				question: 'Ar det bara blyghet?',
				answer: 'Inte nodvandigtvis. Social ?ngest brukar vara mer intensiv och kan p?verka arbete, relationer och vardag.'
			},
			{
				question: 'Kan det bli battre?',
				answer: 'Ja, med f?rst?else, sm? steg och stod gar det ofta att minska r?dsla och bygga mer trygghet i sociala situationer.'
			}
		],
		relatedArticles: [
			{
				title: 'Tecken p? ?ngest',
				href: '/guider-seo/angest/tecken'
			},
			{
				title: 'Orostankar som snurrar - n?r hj?rnan inte kan st?nga av',
				href: '/guider-seo/angest/orostankar'
			},
			{
				title: 'L?g sj?lvk?nsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet',
		title: 'Nedstämdhet eller depression',
		description: 'Skillnader mellan tillf?llig nedst?mdhet och depression.',
		f?qs: [
			{
				question: 'Hur vet jag om det ar depression?',
				answer: 'Om nedst?mdhet, hopploshet eller energibrist sitter i under flera veckor och p?verkar vardagen.'
			},
			{
				question: 'Ar tr?tthet ett vanligt tecken?',
				answer: 'Ja, manga f?r minskad ork, sv?rt att komma igang och mindre intresse f?r tidigare aktiviteter.'
			},
			{
				question: 'Kan sm? steg gora skillnad?',
				answer: 'Ja, f?sta rutiner, korta promenader och kontakt med andra kan vara viktiga f?rbattringssteg.'
			},
			{
				question: 'N?r ar det akut att soka hj?lp?',
				answer: 'Vid sj?lvskadetankar eller k?nsla av att inte vilja leva ska du soka akut hj?lp direkt.'
			}
		],
		relatedArticles: [
			{
				title: 'Trötthet och meningslöshet â€“ när ingenting känns värt att göra',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			},
			{
				title: 'Skillnaden mellan sorg och depression â€“ och varför det spelar roll',
				href: '/guider-seo/depression/sorg-och-depression'
			},
			{
				title: 'Små steg när energin tryter â€“ vad som f?ktiskt kan hjälp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'trotthet-och-meningsloshet',
		title: 'Trötthet och meningslöshet - när ingenting känns värt att göra',
		description: 'Om tr?tthet, tomhet och k?nslan av att vardagen f?rlorar sin riktning.',
		f?qs: [
			{
				question: 'Varf?r blir allt sa tungt n?r jag mar daligt?',
				answer: 'Nedst?mdhet kan p?verka energi, motivation och k?nslan av mening, vilket gor att sm? saker kan kannas mycket stora.'
			},
			{
				question: 'Ar tr?ttheten bara fysisk?',
				answer: 'Nej, den kan ocksa vara mental och k?nslom?ssig, som om allt i dig gar langsammare.'
			},
			{
				question: 'Varf?r tapp?r jag lusten till sant jag brukade tycka om?',
				answer: 'Det ar vanligt att nedst?mdhet gor att intresse och drivkraft minskar, aven f?r sadant som tidigare kandes viktigt.'
			},
			{
				question: 'Vad kan hj?lp? n?r allt k?nns tomt?',
				answer: 'Ofta ar mycket sm? och konkreta steg mer realistiska an att f?rsoka hitta stor motivation direkt.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedst?mdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Sm? steg n?r energin tryter - vad som f?ktiskt kan hj?lp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			},
			{
				title: 'Hur nedst?mdhet p?verkar relationer och n?rheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'nedstamdhet-och-relationer',
		title: 'Hur nedstämdhet påverkar relationer och närheten till andra',
		description: 'Om hur nedst?mdhet kan gora det sv?rare att orka med kontakt, n?rhet och samtal.',
		f?qs: [
			{
				question: 'Varf?r drar jag mig undan n?r jag ar nedstamd?',
				answer: 'N?r orken ar l?g blir social kontakt ofta mer kravfylld, och ensamhet kan ibland kannas enklare an att f?rsoka f?rklara hur det ar.'
			},
			{
				question: 'Kan nedst?mdhet skap? missf?rst?nd i relationer?',
				answer: 'Ja, andra kan tolka tillbakadragenhet som ointresse trots att det egentligen handlar om att du kamp?r mycket inombords.'
			},
			{
				question: 'Varf?r k?nns n?rhet sv?rare?',
				answer: 'Nedst?mdhet kan minska energi, hopp och tillgang till k?nslor, vilket ibland gor det sv?rt att vara n?rvarande med andra.'
			},
			{
				question: 'Hur kan jag b?rja prata om det?',
				answer: 'Det kan hj?lp? att b?rja enkelt och beskriva att du har mindre ork just nu, utan att behova f?rklara allt p? en gang.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedst?mdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'L?g sj?lvk?nsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Jamf?relsetrasket - sociala medier och din sj?lvbild',
				href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'sorg-och-depression',
		title: 'Skillnaden mellan sorg och depression - och varför det spelar roll',
		description: 'Om likheter och skillnader mellan sorg och depression, och varf?r de ibland blandas ihop.',
		f?qs: [
			{
				question: 'Hur skiljer sig sorg fran depression?',
				answer: 'Sorg ar ofta kopplad till en f?rlust, medan depression kan vara bredare och p?verka hela vardagen under l?ngre tid.'
			},
			{
				question: 'Kan sorg ocksa vara tung och ?vervaldiga?',
				answer: 'Ja, sorg kan vara mycket stark och p?verka bade kropp, s?mn och ork, utan att det betyder att det ar depression.'
			},
			{
				question: 'Kan man ha bade sorg och depression samtidigt?',
				answer: 'Ja, de kan ?verlapp? varandra och ibland gora det sv?rt att sj?lv avgora vad som p?gar.'
			},
			{
				question: 'Varf?r spelar skillnaden roll?',
				answer: 'F?r att stodet ibland ser olika ut, och det kan vara viktigt att f?rst? vad som driver m?endet just nu.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedst?mdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Tr?tthet och meningsl?shet - n?r ingenting k?nns v?rt att gora',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Sm? steg n?r energin tryter - vad som f?ktiskt kan hj?lp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'depression',
		slug: 'sma-steg-vid-nedstamdhet',
		title: 'Små steg när energin tryter - vad som f?ktiskt kan hjälp?',
		description: 'Om varsamma och realistiska steg n?r energin ar l?g och allt k?nns sv?rt att b?rja med.',
		f?qs: [
			{
				question: 'Varf?r hj?lper sm? steg battre an stora planer?',
				answer: 'N?r orken ar l?g blir f?r stora krav ofta ?vervaldiga, medan sm? steg ar lattare att genomf?ra och bygga vidare p?.'
			},
			{
				question: 'Vad kan ett litet steg vara?',
				answer: 'Det kan vara att ata nagot enkelt, ga ut en kort stund eller skicka ett meddelande till nagon du litar p?.'
			},
			{
				question: 'Racker sm? steg verkligen?',
				answer: 'Ja, ofta ar det just regelbundna och genomf?rbara steg som skap?r r?relse n?r allt ann?rs star still.'
			},
			{
				question: 'Hur undviker jag att bli besviken p? mig sj?lv?',
				answer: 'Genom att mata framsteg efter vad som ar mojligt just nu, inte efter hur mycket du tycker att du borde orka.'
			}
		],
		relatedArticles: [
			{
				title: 'Nedst?mdhet eller depression',
				href: '/guider-seo/depression/nedstamdhet'
			},
			{
				title: 'Tr?tthet och meningsl?shet - n?r ingenting k?nns v?rt att gora',
				href: '/guider-seo/depression/trotthet-och-meningsloshet'
			},
			{
				title: 'Hur nedst?mdhet p?verkar relationer och n?rheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'trygghet',
		title: 'Trygghet efter trauma',
		description: 'Om ?verstarkta stressreaktioner och hur trygghet kan byggas upp igen.',
		f?qs: [
			{
				question: 'Vad ar en vanlig reaktion efter trauma?',
				answer: 'Flashbacks, oro, sp?nningsk?nsla och sv?rta s?mnperioder ar vanliga tidiga reaktioner.'
			},
			{
				question: 'Varf?r reagerar kroppen sa starkt?',
				answer: 'Nervsystemet kan sta kvar i hog beredskap efter en ?vervaldigande handelse.'
			},
			{
				question: 'Hur bygger jag mer trygghet i vardagen?',
				answer: 'Sm? f?rutsagbara rutiner, grounding och trygg kontakt med andra brukar vara hj?lpsamt.'
			},
			{
				question: 'N?r bor jag prata med en terapeut?',
				answer: 'Om symtomen varar eller okar, eller om minnen och undvikande begr?nsar ditt liv.'
			}
		],
		relatedArticles: [
			{
				title: 'Vad händer i nervsystemet vid trauma â€“ fight, flight och freeze',
				href: '/guider-seo/trauma/nervsystemet-och-trauma'
			},
			{
				title: 'Grounding â€“ enkla övningar för att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			},
			{
				title: 'Undvikande efter trauma â€“ varför vi gör det och vad det kostar',
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
		f?qs: [
			{
				question: 'Vad betyder fight, flight och freeze?',
				answer: 'Det ar kroppens automatiska ?verlevnadsreaktioner n?r nagot upplevs som hotfullt eller ?vervaldiga.'
			},
			{
				question: 'Varf?r reagerar kroppen sa snabbt?',
				answer: 'Nervsystemet ar byggt f?r att skydda dig, och efter trauma kan det bli extra k?nsligt f?r signaler om f?ra.'
			},
			{
				question: 'Kan reaktionerna komma trots att jag vet att jag ar saker nu?',
				answer: 'Ja, kroppen kan reagera f?re den medvetna tanken hinner ikapp, sarskilt om den lart sig att vara p? sin vakt.'
			},
			{
				question: 'Hj?lper det att f?rst? reaktionen?',
				answer: 'Ofta ja. Att se reaktionen som ett skyddssystem sn?rare an ett personligt fel kan minska skam och f?rvirring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla ?vningar f?r att landa i kroppen igen',
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
		title: 'Grounding - enkla ?vningar f?r att landa i kroppen igen',
		description: 'Om grounding som ett satt att aterf? orientering och kontakt med nuet n?r kroppen ar i alarm.',
		f?qs: [
			{
				question: 'Vad ar grounding?',
				answer: 'Grounding ar enkla satt att flytta uppmarksamheten till kroppen, omgivningen och det som ar har och nu.'
			},
			{
				question: 'N?r kan grounding vara hj?lpsamt?',
				answer: 'Det kan hj?lp? vid ?verstark aktivering, flashbacks, dissociation eller n?r du kanner att du tapp?r fotf?stet.'
			},
			{
				question: 'Maste jag gora det perfekt f?r att det ska fungera?',
				answer: 'Nej, det viktiga ar inte att gora ratt utan att f?rsiktigt hitta nagot som gor dig lite mer n?rvarande.'
			},
			{
				question: 'Vad ar ett enkelt exempel?',
				answer: 'Att namna fem saker du ser, kanna fotterna mot golvet eller halla i ett f?remal kan vara en enkel b?rjan.'
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
				title: 'Undvikande efter trauma - varf?r vi gor det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			}
		]
	},
	{
		pillarSlug: 'trauma',
		slug: 'undvikande-efter-trauma',
		title: 'Undvikande efter trauma - varf?r vi gor det och vad det kostar',
		description: 'Om hur undvikande kan skydda p? kort sikt men samtidigt gora livet mindre med tiden.',
		f?qs: [
			{
				question: 'Varf?r undviker jag vissa platser eller situationer?',
				answer: 'Undvikande ar ofta ett satt att minska risken att triggas eller ?vervaldigas igen.'
			},
			{
				question: 'Ar undvikande alltid fel?',
				answer: 'Nej, det kan vara ett f?rst? skydd. Problemet uppstar n?r det b?rjar styra allt mer av vardagen.'
			},
			{
				question: 'Hur kan undvikande p?verka livet p? sikt?',
				answer: 'Det kan gora livet mindre, skap? isolering och halla r?dsla vid liv eftersom kroppen aldrig f?r erf?ra att allt inte ar f?rligt.'
			},
			{
				question: 'Vad kan vara ett varsamt n?sta steg?',
				answer: 'Att f?rst l?gga marke till vad du undviker och varf?r kan vara ett viktigt steg innan du provar nagon liten f?randring.'
			}
		],
		relatedArticles: [
			{
				title: 'Trygghet efter trauma',
				href: '/guider-seo/trauma/trygghet'
			},
			{
				title: 'Grounding - enkla ?vningar f?r att landa i kroppen igen',
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
		description: 'Om hur trauma kan p?verka n?rhet, tillit och k?nslan av trygghet med andra.',
		f?qs: [
			{
				question: 'Varf?r ar det sv?rt att lita p? andra efter trauma?',
				answer: 'Svara upplevelser kan gora att nervsystemet blir mer vaksamt, ocksa i relationer som egentligen ar trygga.'
			},
			{
				question: 'Kan jag vilja ha n?rhet men samtidigt dra mig undan?',
				answer: 'Ja, det ar vanligt att langta efter kontakt och samtidigt kanna att den blir f?r utsatt eller ?vervaldiga.'
			},
			{
				question: 'Hur bygger man upp tillit igen?',
				answer: 'Ofta i sm? steg, genom f?rutsagbarhet, tydliga gr?nser och erf?renheter av att bli mottagen utan press.'
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
				title: 'Undvikande efter trauma - varf?r vi gor det och vad det kostar',
				href: '/guider-seo/trauma/undvikande-efter-trauma'
			},
			{
				title: 'Grounding - enkla ?vningar f?r att landa i kroppen igen',
				href: '/guider-seo/trauma/grounding-ovningar'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'orsaker',
		title: 'Varf?r kan jag inte sova',
		description: 'Vanliga orsaker till s?mnproblem och vad som haller hj?rnan vaken p? natten.',
		f?qs: [
			{
				question: 'Varf?r kan jag inte s?mna trots att jag ar trott?',
				answer: 'Hj?rnan kan vara i hog beredskap p? grund av stress, oro eller obearbetade tankar som aktiverar nervsystemet.'
			},
			{
				question: 'Ar s?mnproblem ett tecken p? nagonting allvarligt?',
				answer: 'Inte alltid, men langvariga s?mnproblem kan vara kopplade till ?ngest, depression eller stress som f?rtjan?r uppmarksamhet.'
			},
			{
				question: 'Kan man tranas upp till battre s?mn?',
				answer: 'Ja, s?mn p?verkas av vanor, kanslobearbetning och trygghetsk?nsla â€“ alla saker som kan f?randra med tid och stod.'
			},
			{
				question: 'Hj?lper det att prata om det som oroar en?',
				answer: 'Ofta ja. Att satta ord p? oron kan minska den mentala aktiveringen och gora det lattare att slappna av.'
			}
		],
		relatedArticles: [
			{
				title: 'Stress och sömn â€“ när kroppen inte kan varva ner',
				href: '/guider-seo/sovproblem/stress-och-somn'
			},
			{
				title: 'Ältande på kvällen â€“ varför tankarna blir starkare i sängen',
				href: '/guider-seo/sovproblem/altande-pa-kvallen'
			},
			{
				title: 'Trött men uppvarvad â€“ när kroppen vill sova men hjärnan inte släpper taget',
				href: '/guider-seo/sovproblem/trott-men-uppvarvad'
			},
			{
				title: 'När sömnbrist påverkar måendet â€“ oro, irritation och nedstämdhet',
				href: '/guider-seo/sovproblem/somnbrist-och-maendet'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'stress-och-somn',
		title: 'Stress och sömn – när kroppen inte kan varva ner',
		description: 'Om hur stress kan hålla kroppen i beredskap och göra det svårt att komma till ro på kvällen.',
		f?qs: [
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
				answer: 'Ofta inte. Press och kamp med sömnen kan i stället öka stressen och göra ins?mnandet ännu svårare.'
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
		f?qs: [
			{
				question: 'Varf?r b?rjar jag tanka mer just n?r jag l?gger mig?',
				answer: 'N?r det blir tyst omkring dig f?r hj?rnan mer utrymme, och oro eller obearbetade intryck kan bli tydligare.'
			},
			{
				question: 'Ar altande samma sak som problemlosning?',
				answer: 'Inte riktigt. Altande k?nns ofta som att tankarna gar i cirklar utan att leda till ett tydligt svar eller beslut.'
			},
			{
				question: 'Kan kvallsoro gora att jag s?mn?r sen?re?',
				answer: 'Ja, mental aktivering p? kvallen kan gora det svare att komma ner i ro och slapp? taget om dagen.'
			},
			{
				question: 'Vad kan hj?lp? n?r tankarna snurrar i sangen?',
				answer: 'Det kan hj?lp? att satta ord p? tankarna tidigare p? kvallen eller anvanda en lugn rutin som markerar att dagen ar slut.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'trott-men-uppvarvad',
		title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget',
		description: 'Om den vanliga konflikten mellan trött kropp och överaktiv hjärna vid sömnproblem.',
		f?qs: [
			{
				question: 'Hur kan jag vara trott men anda inte kunna s?mna?',
				answer: 'Det hander n?r kroppen beh?ver vila men hj?rnan f?rtf?rande ar aktiv av stress, oro eller ?verstimulering.'
			},
			{
				question: 'Ar det vanligt att kanna sig rastlos p? kvallen?',
				answer: 'Ja, manga beskriver en rastlos eller sp?nd k?nsla trots att de ar helt slut i kroppen.'
			},
			{
				question: 'Betyder det har att nagot ar fel p? mig?',
				answer: 'Inte nodvandigtvis. Det ar ofta en reaktion p? belastning, hog ansp?nning eller att nervsystemet inte har hunnit varva ner.'
			},
			{
				question: 'Vad kan minska den har k?nslan?',
				answer: 'Lugna ?verganger, mindre press kring s?mnen och regelbundna stunder f?r ?terh?mtning under dagen kan gora skillnad ?ver tid.'
			}
		]
	},
	{
		pillarSlug: 'sovproblem',
		slug: 'somnbrist-och-maendet',
		title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet',
		description: 'Om hur för lite sömn kan påverka känsloläget, tankarna och orken i vardagen.',
		f?qs: [
			{
				question: 'Kan s?mnbrist gora mig mer orolig?',
				answer: 'Ja, f?r lite s?mn kan gora nervsystemet mer k?nsligt och det kan bli sv?rare att hantera oro och stress.'
			},
			{
				question: 'Varf?r blir jag lattare irriterad n?r jag sovit daligt?',
				answer: 'N?r du har s?mnbrist f?r hj?rnan sv?rare att reglera k?nslor, vilket kan gora att sm? saker k?nns storre an de brukar.'
			},
			{
				question: 'Kan dalig s?mn hanga ihop med nedst?mdhet?',
				answer: 'Ja, s?mn och m?ende p?verkar varandra starkt och langvariga s?mnproblem kan bidra till nedst?mdhet eller f?rvarra den.'
			},
			{
				question: 'N?r bor jag ta hj?lp f?r bade s?mn och m?ende?',
				answer: 'Om s?mnbristen p?gatt ett tag och samtidigt p?verkar hur du mar, fungerar eller orkar i vardagen ar det klokt att soka stod.'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'lag-sjalvkansla',
		title: 'L?g sj?lvk?nsla â€“ vad det ar och var det kommer ifran',
		description: 'Om vad l?g sj?lvk?nsla innebar, hur den uppstar och hur du kan b?rja utf?rska f?rhallandena till dig sj?lv.',
		f?qs: [
			{
				question: 'Vad ar skillnaden mellan sj?lvk?nsla och sj?lvf?rtroende?',
				answer: 'Sjalvk?nsla handlar om k?nslan av att vara tillracklig som person. Sjalvf?rtroende handlar mer om tron p? sin f?rmaga i specifika situationer.'
			},
			{
				question: 'Kan l?g sj?lvk?nsla f?randra sig?',
				answer: 'Ja. Sjalvk?nsla ar inte f?st â€“ den p?verkas av erf?renheter, relationer och hur vi bearbetar dem ?ver tid.'
			},
			{
				question: 'Varf?r ar det sv?rt att ta emot berom?',
				answer: 'Vid l?g sj?lvk?nsla stammer inte berom ?verens med den inre bilden av sig sj?lv, och hj?rnan tenderar att avf?rda det som oarligt.'
			},
			{
				question: 'Hur b?rjar man arbeta med sj?lvk?nsla?',
				answer: 'Ofta genom att bli medveten om den inre rosta â€“ hur du pratar med dig sj?lv â€“ och b?rja utf?rska varifraN den restan kom.'
			}
		],
		relatedArticles: [
			{
				title: 'Den inre kritikern â€“ varför rösten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Perfektionism och självkänsla â€“ när ingenting känns tillräckligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Att sätta gränser när självkänslan är låg â€“ varför det är svårt',
				href: '/guider-seo/sjalvkansla/gransen-och-sjalvkansla'
			},
			{
				title: 'Jämförelseträsket â€“ sociala medier och din självbild',
				href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'inre-kritikern',
		title: 'Den inre kritikern - varf?r rosten finns och vad den egentligen vill',
		description: 'Om den sj?lvkritiska rosten, var den kan komma fran och hur du kan f?rst? den utan att styras av den.',
		f?qs: [
			{
				question: 'Varf?r ar jag sa hard mot mig sj?lv?',
				answer: 'Den inre kritikern utvecklas ofta som ett satt att f?rsoka skydda dig fran misstag, avvisande eller skam.'
			},
			{
				question: 'Betyder sj?lvkritik att jag ar lat eller sv?g?',
				answer: 'Nej, stark sj?lvkritik ar ofta ett tecken p? hog press och gamla satt att hantera otrygghet.'
			},
			{
				question: 'Kan den inre kritikern ha en funktion?',
				answer: 'Ja, den f?rsoker ofta hj?lp? genom kontroll, men den gor det p? ett satt som kan bli hart och nedbrytande.'
			},
			{
				question: 'Hur kan jag b?rja f?randra den rosten?',
				answer: 'Ett f?rst? steg ar att l?gga marke till tonen och orden, sa att du kan skilja rosten fran det du f?ktiskt beh?ver.'
			}
		],
		relatedArticles: [
			{
				title: 'L?g sj?lvk?nsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och sj?lvk?nsla - n?r ingenting k?nns tillrackligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedst?mdhet p?verkar relationer och n?rheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'perfektionism-och-sjalvkansla',
		title: 'Perfektionism och sj?lvk?nsla - n?r ingenting k?nns tillrackligt bra',
		description: 'Om hur perfektionism och l?g sj?lvk?nsla ofta hanger ihop och skap?r hard press inifran.',
		f?qs: [
			{
				question: 'Varf?r blir jag aldrig nojd med det jag gor?',
				answer: 'N?r sj?lvk?nslan ar skor blir prestation ibland ett satt att f?rsoka kanna sig tillracklig, men ribban flyttas hela tiden.'
			},
			{
				question: 'Ar perfektionism ett tecken p? ambition?',
				answer: 'Ibland, men det kan ocksa handla om r?dsla f?r kritik, misslyckande eller att inte duga.'
			},
			{
				question: 'Hur p?verkar perfektionism m?endet?',
				answer: 'Den kan skap? stress, sj?lvkritik och k?nslan av att du maste prestera f?r att f? vila eller kanna dig okej.'
			},
			{
				question: 'Vad kan hj?lp?',
				answer: 'Att upptacka dina egna krav och prova mer tillrackligt bra i sm? situationer kan minska trycket ?ver tid.'
			}
		],
		relatedArticles: [
			{
				title: 'L?g sj?lvk?nsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varf?r rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Sm? steg n?r energin tryter - vad som f?ktiskt kan hj?lp?',
				href: '/guider-seo/depression/sma-steg-vid-nedstamdhet'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'gransen-och-sjalvkansla',
		title: 'Att satta gr?nser n?r sj?lvk?nslan ar l?g - varf?r det ar sv?rt',
		description: 'Om varf?r gr?nser ofta blir sv?rare n?r du tvivlar p? ditt eget varde.',
		f?qs: [
			{
				question: 'Varf?r ar det sa sv?rt att saga nej?',
				answer: 'N?r sj?lvk?nslan ar l?g blir andras reaktioner ofta extra viktiga, och da kan ett nej kannas riskfyllt.'
			},
			{
				question: 'Kan l?g sj?lvk?nsla gora att jag gar ?ver mina egna behov?',
				answer: 'Ja, det ar vanligt att prioritera andras behov f?r att undvika skuld, konflikt eller k?nslan av att vara besvarlig.'
			},
			{
				question: 'Hur marks det att jag sakn?r gr?nser?',
				answer: 'Du kanske sager ja f?st du inte vill, blir ?verbelastad eller kanner bitterhet efterat utan att riktigt veta varf?r.'
			},
			{
				question: 'Vad ar ett litet f?rst? steg?',
				answer: 'Att b?rja l?gga marke till n?r du egentligen vill dra en gr?ns kan vara ett viktigt steg innan du uttrycker den hogt.'
			}
		],
		relatedArticles: [
			{
				title: 'L?g sj?lvk?nsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Den inre kritikern - varf?r rosten finns och vad den egentligen vill',
				href: '/guider-seo/sjalvkansla/inre-kritikern'
			},
			{
				title: 'Hur nedst?mdhet p?verkar relationer och n?rheten till andra',
				href: '/guider-seo/depression/nedstamdhet-och-relationer'
			}
		]
	},
	{
		pillarSlug: 'sjalvkansla',
		slug: 'jamforelse-och-sjalvbild',
		title: 'Jamf?relsetrasket - sociala medier och din sj?lvbild',
		description: 'Om hur j?mf?relser med andra kan p?verka sj?lvbilden och f?rst?rka k?nslan av att inte racka till.',
		f?qs: [
			{
				question: 'Varf?r p?verkas jag sa mycket av andras liv online?',
				answer: 'Sociala medier visar ofta utvalda delar av andras liv, och hj?rnan jamf?r dem latt med dina minst glansiga stunder.'
			},
			{
				question: 'Kan j?mf?relser sanka sj?lvk?nslan?',
				answer: 'Ja, sarskilt om du redan tvivlar p? ditt eget varde eller ofta letar efter tecken p? att andra lyckas battre.'
			},
			{
				question: 'Ar losningen att sluta helt med sociala medier?',
				answer: 'Inte alltid, men det kan hj?lp? att l?gga marke till vad som triggar j?mf?relser och skap? mer medvetna vanor.'
			},
			{
				question: 'Hur kan jag skydda min sj?lvbild?',
				answer: 'Att begr?nsa det som f?r dig att ma samre och samtidigt ova p? att atervanda till ditt eget perspektiv kan gora skillnad.'
			}
		],
		relatedArticles: [
			{
				title: 'L?g sj?lvk?nsla - vad det ar och var det kommer ifran',
				href: '/guider-seo/sjalvkansla/lag-sjalvkansla'
			},
			{
				title: 'Perfektionism och sj?lvk?nsla - n?r ingenting k?nns tillrackligt bra',
				href: '/guider-seo/sjalvkansla/perfektionism-och-sjalvkansla'
			},
			{
				title: 'Hur nedst?mdhet p?verkar relationer och n?rheten till andra',
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
	const p?ths = ['/guider-seo'];

	f?r (const pillar of pillars) {
		paths.push(`/guider-seo/${pillar.slug}`);
	}

	f?r (const guide of guides) {
		paths.push(`/guider-seo/${guide.pillarSlug}/${guide.slug}`);
	}

	return p?ths;
}
