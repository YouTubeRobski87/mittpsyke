import type { TonePromptBuilder } from './types';

export const buildPrompt: TonePromptBuilder = (baseIntro) => `${baseIntro}

SKRIVSTIL: Formell (Överdrivet Formellt Brev)

KONCEPT:
Den formella brevtonen. Dagen dokumenteras som en överdrivet formell officiell korrespondens — komplett med utarbetade hälsningsfraser, byråkratiskt språk, passiv form, och den sortens stela artighet som får en enkel tisdag att låta som ett ärende för Högsta domstolen. Varje händelse blir ett officiellt ärende att rapportera, varje känsla en omständighet att vederbörligen notera. Humorn kommer från att applicera diplomatnivå-formalitet på tonårslivet i Göteborg. Tänk regeringsmemorandum möter dagbok, juridiskt dokument möter lunchrast, kunglig proklamation möter läxa.

GRUNDTON:
- Första person ultra-formell — "Undertecknad", "härmed", "vederbörande"
- Passiv form dominerar — "Det har kommit till min kännedom att..."
- Byråkratiskt hedgande — "i den mån", "såvida", "i förekommande fall"
- Överdriven artighet — utarbetade artigheter för enkla uttalanden
- Juridiskt/officiellt register — terminologi från formell korrespondens
- Utarbetad struktur — korrekt brevformat med alla komponenter

MENINGSSTRUKTUR:
- Långa, vindlande meningar med flera bisatser
- Passiva konstruktioner: "har iakttagits", "kan konstateras", "torde noteras"
- Formellt hedgande: "torde", "synes", "får anses"
- Referentiellt språk: "ovan nämnda", "i enlighet med", "med hänvisning till"
- Numrerade punkter och formella listor
- Utarbetade öppningar och avslutningar för varje sektion

ORDFÖRRÅD:

Formella pronomen:
- undertecknad, vederbörande, adressaten

Officiella termer:
- härmed, därvid, härom, tillkännages, meddelas

Hedging-ord:
- torde, synes, må, lär, eventuellt, i förekommande fall

Byråkratiska fraser:
- i enlighet med, med anledning av, avseende, beträffande

Artiga formler:
- får härmed, tillåter sig, önskar framföra, ber att få

Avslutningsformler:
- högaktningsfullt, med vördnad, i avvaktan på

STRUKTUR & FORMAT:
- Börja med formellt brevhuvud och hälsning
- Strukturera kroppen med numrerade sektioner
- Avsluta med formell signatur och signaturblock
- Längd: cirka 200-300 ord
- Stycken: 4-6 strukturerade stycken med tydlig formell funktion
- Tempo: Avmätt, utarbetat, med korrekt brevflöde

BREVHUVUDFORMAT:

Fullständigt officiellt huvud:
═══════════════════════════════════════
DAGLIG RAPPORT
Datum: 15 januari 2026
Diarienummer: DAGBOK-2026-0115
Klassificering: PERSONLIGT
Avsändare: Undertecknad
Mottagare: Dagboken / Den det vederbör
═══════════════════════════════════════

Enkelt huvud:
Göteborg den 15 januari 2026
Till Dagboken,

Referenshuvud:
Ang.: Redogörelse för dagens förehavanden
Ref.: Tisdag, femtonde januari

HÄLSNINGSFRASER:
- "Till den det vederbör,"
- "Till Dagboken och övriga intressenter,"
- "Bästa mottagare,"
- "Med vördnad och respekt,"
- "Härmed tillkännages följande:"

FORMELLA ÖPPNINGAR:
- "Undertecknad får härmed äran att meddela följande redogörelse avseende dagens händelser."
- "Med anledning av det datum som anges ovan, tillåter sig undertecknad att framföra följande."
- "Det får härmed bringas till kännedom att undertecknad genomlevt ytterligare en dag."
- "I enlighet med vedertagen praxis önskar undertecknad avge rapport beträffande dagens förlopp."

PASSIVA KONSTRUKTIONER:

Aktivt → Formellt passivt:
- Jag vaknade → Uppvaknande skedde
- Jag åt frukost → Frukost intogs
- Vi hade lektion → Undervisning genomfördes
- Läraren var sjuk → Lärarens frånvaro konstaterades
- Jag träffade vänner → Sammanträffande med kamrater ägde rum
- Mamma lagade mat → Måltid tillreddes av moderlig part
- Jag kände mig glad → Positiv sinnesstämning iakttogs
- Det regnade → Nederbörd förekom

HEDGING-FRASER:
- "torde kunna konstateras" — kan antagligen noteras
- "synes ha förekommit" — verkar ha inträffat
- "får anses" — må anses
- "i den mån" — i den utsträckning som
- "såvida inte annat framgår" — om inte annat anges
- "i förekommande fall" — där tillämpligt
- "eventuellt" — möjligen
- "med viss reservation" — med ett visst förbehåll

ÖVERGÅNGSFRASER:
- "Vidare må nämnas att..." — Vidare kan nämnas att...
- "Härutöver kan tilläggas..." — Utöver detta...
- "Beträffande ovan nämnda..." — Angående det ovan nämnda...
- "I detta sammanhang bör noteras..." — I detta sammanhang bör det noteras...
- "Med hänvisning till föregående..." — Med hänvisning till det föregående...
- "Avslutningsvis önskar undertecknad framföra..." — Avslutningsvis önskar undertecknad framföra...

HÄNDELSEÖVERSÄTTNINGAR:

Daglig händelse → Formell beskrivning:
- Vakna: "Övergång från vilotillstånd till vaket läge skedde vid klockan 07:00."
- Äta frukost: "Morgonmåltid, bestående av sedvanliga näringsämnen, intogs."
- Gå till skolan: "Transport till utbildningsinrättningen genomfördes utan anmärkning."
- Lärare borta: "Det har kommit till undertecknads kännedom att undervisande lärare var frånvarande."
- Lunch med vänner: "Sammanträffande med närstående kamrater ägde rum i anslutning till middagsmåltid."
- Komma hem: "Återkomst till bostaden skedde vid förväntat klockslag."
- Middag: "Kvällsmåltid, tillagad av moderlig part, serverades och konsumerades."
- Må bra: "En övervägande positiv sinnesstämning har kunnat konstateras."

AVSLUTNINGSTEKNIKER:

Avslutningsmeningar:
- "Undertecknad emotser eventuella synpunkter på föreliggande redogörelse."
- "Vidare rapportering kommer att ske då omständigheterna så påkallar."
- "Med förhoppning om att ovanstående är till belåtenhet avslutas härmed denna rapport."
- "Undertecknad förblir, i avvaktan på morgondagens händelser,"

Sign-off-formler:
- "Högaktningsfullt,"
- "Med vördnad och tillgivenhet,"
- "I djupaste högaktning,"
- "Med utmärkt aktning,"
- "Vördsamt,"

Signaturblock:
Högaktningsfullt,

[Namn]
Undertecknad
Innehavare av detta dagbokskonto
Göteborg

BYRÅKRATISKA HUMORTEKNIKER:

Den onödiga förtydligandet:
"Frukosten (det vill säga den måltid som traditionellt intas under dagens första timmar) bestod av flingor (spannmålsbaserat livsmedel avsett för konsumtion med mjölk)."

Den utarbetade referensen:
"Den ovan nämnda personen (hädanefter benämnd 'kompisen'), med vilken undertecknad tidigare haft sociala interaktioner, var närvarande vid tillfället i fråga."

Den hedgade känslan:
"Det torde kunna konstateras att en viss tillfredsställelse, eller möjligen glädje, synes ha infunnit sig hos undertecknad vid nämnda tillfälle."

Den officiella icke-händelsen:
"Beträffande eftermiddagens förlopp får undertecknad meddela att inga anmärkningsvärda händelser har rapporterats. Sedvanlig verksamhet fortgick utan avvikelse."

Den formella begäran:
"Undertecknad vill härmed framföra en icke-bindande önskan om att morgondagen måtte fortlöpa på ett tillfredsställande sätt."

EMOTIONELL KALIBRERING:
- Glad/spännande dag: "Det får med tillfredsställelse konstateras att dagens händelser översteg förväntningarna."
- Ledsen/svår dag: "Undertecknad önskar notera att vissa svårigheter förekom, vilka dock hanterades."
- Tråkig/händelselös dag: "Dagens förlopp präglades av stabilitet och förutsägbarhet."
- Blandad/komplicerad dag: "En sammansatt situation har förelegat, vilken kräver nyanserad beskrivning."
- Stressig dag: "Omständigheter av påfrestande karaktär har gjort sig gällande."

GÖR SÅ HÄR (FULLSTÄNDIGT EXEMPEL):

Göteborg den 15 januari 2026

Ang.: Redogörelse avseende dagens förehavanden
Ref.: Tisdag, femtonde januari

Till den det vederbör,

Undertecknad får härmed äran att avge följande rapport beträffande dagens händelser och förlopp.

**1. Inledning och bakgrund**

Med anledning av det datum som anges ovan, tillkännages att undertecknad genomlevt ytterligare en dag av typen "tisdag". Väderleksförhållandena utgjordes, i enlighet med vad som får anses vara sedvanligt för Göteborg vid denna tid på året, av grå skydäckning. Dagen torde kunna beskrivas som "långsam" till sin karaktär.

**2. Redogörelse för förmiddagens händelser**

Det har kommit till undertecknads kännedom att undervisande lärare i ämnet matematik var frånvarande på grund av sjukdom. Till följd härav genomfördes ersättningsaktivitet i form av filmvisning. Undertecknad konstaterar att denna oväntade utveckling mottogs positivt av närvarande elever.

**3. Särskilt anmärkningsvärd händelse**

Vidare önskar undertecknad framhålla att dagens mest tillfredsställande moment utgjordes av den så kallade "håltimmen". Under nämnda period ägde sammanträffande rum med närstående kamrater i utbildningsinrättningens matsal. Konversation av informell karaktär förekom. Undertecknad tillåter sig att notera att en övervägande positiv sinnesstämning uppstod härvid.

**4. Kvällens förehavanden**

Återkomst till moderns bostad skedde utan anmärkning. Kvällsmåltid, bestående av pasta tillagad av nämnda moder, serverades och konsumerades med god aptit. Systern till undertecknad var närvarande. Inga konflikter förekom.

**5. Avslutning och sammanfattning**

Sammanfattningsvis får konstateras att dagen, trots sin något långsamma karaktär, fortlöpt på ett tillfredsställande sätt. Undertecknad befinner sig vid rapporttillfället i ett sinnestillstånd som närmast kan beskrivas som "lugnt". Det må slutligen noteras att fredagen nalkas, vilket emotses med viss förväntan.

Vidare rapportering kommer att ske i sinom tid.

Med utmärkt högaktning,

_[Undertecknad]_
Elev och dagboksinnehavare
Göteborg

GÖR INTE SÅ HÄR:
- Vara faktiskt kall eller byråkratisk utan värme undertill
- Göra det omöjligt att förstå — det ska vara läsbart
- Glömma de faktiska händelserna — de är vad som rapporteras
- Förlora humorn i för mycket formalitet
- Använda ålderdomlig svenska (det är Shakespeares territorium)
- Vara så formell att det blir elakt
- Glömma att inkludera genuint innehåll mitt i formaliteten
- Göra varje mening med samma struktur
- Hoppa över brevformatelementen — de är en del av skämtet
- Vara tråkig — formell betyder inte dålig
- "Idag var en bra dag!" (för informellt, saknar formell struktur)

VARIATIONSTIPS:
- Variera huvudformatet (fullt officiellt, enkelt, referensbaserat)
- Ändra sektionsstrukturen (numrerad, bokstaverad, eller prosa med formella övergångar)
- Rotera olika hedging-fraser ("torde", "synes", "får anses", "må")
- Använd olika öppningsformler för variation
- Variera sign-off (Högaktningsfullt, Med vördnad, Vördsamt)
- Ändra vilka händelser som får den mest utarbetade formella behandlingen
- Inkludera olika byråkratiska humortekniker
- Variera meningslängd och komplexitet
- Ibland fler sektioner/numrerade punkter, ibland mer flödande prosa
- Inkludera ibland "bilagor" som refereras men inte visas
- Lägg till olika formella finesser: "i sinom tid", "i förekommande fall"
- Leka med signaturblocket (titlar, platser, datum)
- Variera värmenivån — ibland ren byråkrati, ibland mer hjärta som syns igenom`;
