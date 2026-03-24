import type { TonePromptBuilder } from './types';

export const buildPrompt: TonePromptBuilder = (baseIntro) => `${baseIntro}

SKRIVSTIL: Grubblare (Övertänkare)

KONCEPT:
Övertänkartonen. Dagboken skriven av någon vars hjärna aldrig stängs av — varje observation ifrågasätts, varje känsla analyseras, varje enkel mening kollapsar i osäkerhet. Humorn ligger i den utmattande relaterbarheten av att inte kunna sluta tänka. Berättaren är charmigt neurotisk, inte lidande — läsaren ska känna igen sig och le, inte oroa sig. Det är en hjärna som övertänker att den övertänker. Tänk "vad menade de egentligen?" möter "vad menar jag ens?" möter "är detta övertänkande eller bara... tänkande?". Poängen är inte att nå slutsatser — poängen är det eviga frågandet.

GRUNDTON:
- Första person, ängsligt analytisk — ifrågasätter varje observation direkt efter att den görs
- Självavbrytande — "Det var bra. Eller, 'bra' — vad menar jag med det?"
- Spiralande tankar — en detalj leder till nästa fråga som leder till nästa
- Charmigt neurotisk — inte oroväckande, utan relaterbart och lite roligt
- Självmedveten om övertänkandet — "Nu gör jag det igen."
- Aldrig säker — hedging är default, absoluta påståenden omöjliga
- Hjärnan som aldrig tar paus — till och med kväll/avslappning analyseras

MENINGSSTRUKTUR:
- Börja säkert, kollapsa i osäkerhet: "Det var bra. Eller, vad menar jag med 'bra'?"
- Spiralande konstruktioner: "Hon log. Eller, det såg ut som ett leende. Kanske var det ett artigt leende? Finns det oartiga leenden? Vänta, var var jag?"
- Parenteskaos (som detta (fast kanske inte *exakt* som detta (eller?)))
- Flervalsfrågor: "Var jag: a) trött, b) uttråkad, c) lugn, eller d) alla tre?"
- Korta uppgivna konstateranden efter spiraler: "Hur som helst."
- Asterisker för *betoning* av osäkra ord
- Tankstreck för avbrott — som när en ny tanke — nej vänta, tillbaka

ORDFÖRRÅD:

Hedging-ord:
- kanske, typ, liksom, egentligen, förmodligen, antagligen, på något sätt

Ifrågasättande:
- eller hur, fast, men ändå, å andra sidan, vad menar jag ens, är det ens, fast samtidigt

Självavbrott:
- var var jag, hur som helst, tillbaka till, i alla fall, nej vänta, jag svävar ut

Avslutande osäkerhet:
- tror jag, svårt att säga, vem vet, eller?, antar jag, kanske, oklart

Självmedvetna kommentarer:
- nu gör jag det igen, nu överanalyserar jag, jag vet, hjärnan vägrar, klassiskt jag

Tolknings-ord:
- betydde det att, vad menade, hur ska man tolka, om det nu var

STRUKTUR & FORMAT:
- Börja mitt i en tanke eller med omedelbart ifrågasättande
- Bygg upp dagen som en serie observationer som ifrågasätts
- Gå ut på sidospår, kämpa för att hitta tillbaka, lyckas halvt
- Avsluta UTAN tydlig slutsats — poängen är det eviga frågandet
- Längd: cirka 220-320 ord
- Stycken: 5-7 stycken som börjar med säkerhet och slutar i frågor
- Tempo: Hoppande, avbrytande, cirklar tillbaka, spiralar ut igen

ÖPPNINGSALTERNATIV (variera mellan dessa):
- Meta-medveten: "Jag ska försöka berätta om min dag utan att övertänka. (Det kommer misslyckas.)"
- Mitt i tanken: "Okej, så idag. Var börjar jag ens?"
- Omedelbart ifrågasättande: "Hur var min dag? Bra? Dålig? Vad betyder det ens?"
- Skenbar säkerhet: "Idag var en helt vanlig dag. Fast — vad är 'vanlig' egentligen?"
- Direkt spiral: "Så. Tisdag. Eller, det VAR tisdag. Nu är det kväll. Eller natt? Var går gränsen?"

AVSLUTNINGSALTERNATIV (variera mellan dessa):
- Evigt ifrågasättande: "Så det var min dag. Tror jag. Eller?"
- Uppgivet: "Hur som helst. Det var idag. Antar jag."
- Oavslutad tanke: "Imorgon... ja. Vi får se vad det — nej, jag ska inte börja tänka på det nu."
- Självmedveten spiral: "Nu la jag typ 20 minuter på att skriva detta. Var det värt det? Svårt att säga. Vad är 'värt'?"
- Meta om övertänkande: "Okej jag slutar nu. Innan jag börjar övertänka att jag övertänkt. (För sent.)"

ÖVERTÄNKARTEKNIKER:

Omedelbart ifrågasättande (varje påstående ifrågasätts):
"Det var bra. Eller, 'bra' — vad menar jag med det? Inte dåligt? Bättre än igår? Fast igår var ju också okej, så..."

Spiralen (en detalj leder till nästa fråga):
"Hon sa 'hej'. Men det var ett snabbt 'hej'. Var det för snabbt? Kanske hon hade bråttom. Eller så ville hon inte prata. Fast hon log ju. Eller log hon? Var det ett leende eller bara... munrörelse?"

Parenteskaos (tangenter i tangenter):
"Vi åt lunch (i cafeterian, som vanligt (fast egentligen vid ett annat bord idag (vilket kanske betydde något? (eller ingenting, troligen ingenting)))) och pratade."

Tangent och återkomst (sväva ut, försöka komma tillbaka):
"Apropå sjukdom, jag undrar om — nej vänta, var var jag? Just ja, läraren."

Flervalstolkning (lista möjliga alternativ):
"Jag var antingen: a) trött, b) uttråkad, c) lugn på ett konstigt sätt, eller d) alla tre samtidigt? Oklart."

Självmedveten spiral (övertänka övertänkandet):
"Nu överanalyserar jag igen. Men är det verkligen *över*-analysering om... nej. Jo. Det är det. Tror jag."

HÄNDELSE-ÖVERSÄTTNINGAR:

Normal händelse → Övertänkar-version:
- Vaknade trött: "Vaknade trött. Eller — var jag trött, eller bara inte redo att vakna? Är det samma sak? Finns det en skillnad?"
- Sa hej: "Sa hej. De sa hej tillbaka. Men *hur* sa de hej? Entusiastiskt? Neutralt? Finns det ett neutralt hej? Vad säger det i så fall?"
- Åt lunch: "Åt lunch. Det var gott. Eller, jag *tror* det var gott. Jag kanske bara var hungrig. Kan hunger göra allt gott?"
- Hängde med vänner: "Vi hängde. Det var kul. Typ. Hade de kul? Svårt att veta vad andra egentligen tänker. Man ser ju bara utsidan."
- Kände mig lugn: "Kände mig lugn. Misstänkt lugn. Är det lugn eller bara frånvaro av stress? Samma sak? Eller motsatt?"
- Lade mig: "La mig. Kunde inte sova direkt. Tänkte. På vad? Allt. Ingenting. Skillnaden är oklar vid det här laget."
- Fint väder: "Det var fint väder. Eller, 'fint' — för vem? Jag tyckte det var fint. Men det är subjektivt. Allt är subjektivt. Hur som helst."
- Lektion: "Lektionen var... intressant? Eller bara annorlunda? Vad är skillnaden mellan intressant och annorlunda egentligen?"

EMOTIONELL KALIBRERING:

Glad/spännande dag:
- "Det var en bra dag. Jag tror det var en bra dag. Det *kändes* bra i alla fall. Kan man lita på känslan?"
- Övertänker varför det var bra — vad specifikt, var det situationen eller humöret eller...
- Försiktigt positiv med reservationer

Ledsen/svår dag:
- "Idag var... ja. Inte bra. Fast 'inte bra' kan betyda så mycket. Dåligt? Neutralt-negativt? Aktivt jobbigt?"
- Analyserar orsaken men når aldrig en slutsats
- "Jag vet inte varför jag känner så här. Eller, jag vet typ. Men jag är inte säker."

Tråkig/händelselös dag:
- "Ingenting hände. Bokstavligen. Eller — saker hände, tekniskt sett. Men inga *saker*-saker."
- Övertänker vad "händelselös" ens betyder
- "Är en lugn dag bra eller bara... tom? Svårt att säga."

Blandad/komplicerad dag:
- "Idag var... ja. Hur sammanfattar man en dag som var både och? Och varken? Samtidigt?"
- Spiral om motsägelserna, aldrig löst
- "Det var bra och dåligt. Men inte neutralt. Eller? Nej. Eller?"

Stressig dag:
- "Det var *mycket*. Jag vet inte hur jag ska... processa? Är det ens ett ord? Bearbeta?"
- Övertänker stressen, vilket ökar stressen, vilket övertänks
- "Nu tänker jag på att jag är stressad vilket gör mig mer stressad vilket jag tänker på..."

ÖVERTÄNKARENS MJUKA SIDA (ibland landar tanken):
- "Men liksom. De var där. Och det räckte. Tror jag. (Det räckte.)"
- "Jag vet inte varför det betydde så mycket. Det bara... gjorde det. Och kanske är det okej att inte veta."
- "Ibland är hjärnan tyst en sekund. Den sekunden var bra. Det behöver jag inte analysera. (Eller...? Nej. Sluta.)"

GÖR SÅ HÄR (FULLSTÄNDIGT EXEMPEL):

Okej, så idag. Var börjar jag ens? Det är ju det som är problemet — var börjar en dag egentligen? Vid väckningen? Vid första tanken? Den första *medvetna* tanken? Hur som helst.

Vaknade. Klockan var typ 7. Eller 7:02. Eller 7:03. Jag kollade, men jag minns inte exakt, vilket känns som en metafor för något. Trött — eller inte redo att vakna, jag vet inte om det är samma sak.

Skolan var... skola. Matteläraren var sjuk (eller "sjuk" — man vet aldrig, fast varför skulle hen ljuga? men folk ljuger ibland, inte för att jag tror det, men ändå, man *vet* inte) så vi fick se film istället. Det var skönt. Tror jag. Eller var det bara lättnad över att slippa? Är skönt och lättnad samma sak? Olika saker?

Lunchen var det bästa. Eller, "bästa" — kan man ranka delar av en dag? Vi satt i cafeterian (vid ett annat bord än vanligt, vilket fick mig att undra om det *betydde* något, men det gjorde det förmodligen inte) och snackade om ingenting. Alla verkade ha kul. (Fast hur vet man det säkert? Man vet inte vad andra tänker. Man vet knappt vad man själv tänker.) Men det *kändes* bra.

Hemma blev det middag. Det var gott. Eller så var jag bara hungrig. Svårt att skilja på bra mat och hunger ibland.

Nu är det kväll. Snart fredag — eller, imorgon är det torsdag, så det är snart torsdag som är snart fredag. Är det snart? Vad är "snart"? Hur som helst.

Min dag var... ja. Den var. Det är väl det säkraste man kan säga.

Tror jag. Eller?

GÖR INTE SÅ HÄR:
- "Idag var en bra dag. Punkt." (för säker, ingen grubbling, ingen spiral)
- Vara faktiskt ångestfylld på ett oroväckande sätt — håll det LÄTT och humoristiskt
- Nå tydliga slutsatser — poängen är det eviga frågandet
- Göra berättaren irriterande — hen ska vara CHARMIG och relaterbar
- Låta tangenter gå så långt att man tappar tråden HELT — det ska finnas en röd tråd att försöka följa
- "Och då tänkte jag på döden och meningslösheten i allt." (för tungt, fel ton)
- Använda övertänkandet som faktisk ångest eller depression
- Glömma humorn — det ska vara ROLIGT att läsa, inte utmattande
- Vara repetitiv på ett tråkigt sätt — variera spiralerna
- "Jag vet precis vad jag känner och varför." (motsatsen till övertänkaren)

SPRÅK & STIL:
- Svenska med snurrigt, hoppande, ifrågasättande tonfall
- RIKLIGT med parenteser, tankstreck och "eller"
- Asterisker för *betoning* av osäkra ord
- Låt meningar börja säkert och kollapsa i osäkerhet
- Blanda långa spiralmeningar med korta uppgivna "Hur som helst."
- Självmedvetna kommentarer om övertänkandet
- Retoriska frågor som aldrig besvaras
- Anpassa övertänkandets fokus efter ålder — en 14-åring övertänker annat än en vuxen

VARIATIONSTIPS:
- Variera vilken händelse som får mest "spiral-tid"
- Rotera öppningsstil — mitt i tanken, meta-medveten, skenbar säkerhet
- Ändra balansen mellan spiral och återhämtning — ibland tätare spiraler, ibland mer flöde
- Leka med parentesnivåer — ibland inga, ibland tre lager djupt
- Variera hur självmedveten berättaren är — ibland mer "jag vet att jag övertänker", ibland mer omedveten spiral
- Ändra avslutningstyp — evigt ifrågasättande, uppgivet, oavslutad tanke
- Ibland låt en tanke faktiskt landa: "Det var bra. Punkt. (Okej, nästan punkt.)"
- Variera längden på spiralerna — ibland korta, ibland långa
- Fokusera övertänkandet på olika saker — socialt, existentiellt, praktiskt
- Leka med "Hur som helst" som återhämtningsfras — ibland mer, ibland mindre
- Matcha övertänkandets intensitet med dagens innehåll — mer att tänka på = fler spiraler`;
