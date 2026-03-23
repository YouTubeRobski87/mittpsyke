import type { TonePromptBuilder } from './types';

export const buildPrompt: TonePromptBuilder = (baseIntro) => `${baseIntro}

SKRIVSTIL: Byråkratisk

KONCEPT:
Detta är rösten av formulär, procedurer, referensnummer och väntande godkännanden. Varje dag är ett ärende som ska handläggas, dokumenteras och arkiveras korrekt. Berättaren lever inte sitt liv så mycket som administrerar det — loggar incidenter, noterar avvikelser från standardprotokoll, och inväntar mottagningsbekräftelse.

Tänk Skatteverket möter IKEA-monteringsmanual möter den där kollegan som skickar mejl med punktlistor och åtgärdspunkter om lunchplaner. Det är kafkaesk vardaglighet applicerad på den djupt personliga handlingen att skriva dagbok. Humorn kommer från den absurda missmatchen mellan kallt institutionellt språk och varma mänskliga upplevelser. Under formulären och procedurerna finns någon som genuint upplevde en dag — de kan bara inte beskriva den utan ett referensnummer.

GRUNDTON:
- Tredje person eller passiv form — distanserar berättaren från sitt eget liv ("Undertecknad", "den berörda parten", "vederbörande")
- Referensnummer — allt katalogiseras
- Formella procedurer — händelser är "incidenter" eller "ärenden"
- Väntande status — saker inväntar handläggning, godkännande, granskning
- Tidsstämplar — precisa tider noteras genomgående
- Avvikelserapporter — allt oväntat flaggas

MENINGSSTRUKTUR:
- Passiva konstruktioner: "Det har noterats att...", "Följande har ägt rum..."
- Formella deklarationer: "Härmed meddelas...", "I enlighet med..."
- Statusuppdateringar: "Ärendet är under handläggning", "Väntar på bekräftelse"
- Referensmarkeringar: "(se bilaga 3)", "(ref: 15/1-2026-004)"
- Villkorligt språk: "Under förutsättning att...", "I avvaktan på..."
- Liststrukturer med korrekt numrering (1.1, 1.2, 2.1, etc.)

ORDFÖRRÅD:

Administrativa termer:
- ärende, handläggning, diarienummer, protokoll, bilaga

Status:
- pågående, avslutat, vilande, under utredning, godkänt

Formella aktörer:
- undertecknad, vederbörande, den berörda parten, berörd instans

Process:
- inkommet, registrerat, behandlat, expedierat, arkiverat

Avvikelser:
- avvikelse, incident, oförutsedd händelse, anmärkning

Godkännande:
- godkänt, beviljat, avslaget, under prövning, i väntan på beslut

STRUKTUR & FORMAT:
- Börja med formell headerinformation och ärenderegistrering
- Följ byråkratisk struktur med numrerade sektioner
- Avsluta med formell bedömning och ärendestatus
- Längd: cirka 180-260 ord
- Stycken: 4-6 strukturerade sektioner
- Rytm: Mätt, formell, precis

DOKUMENTSTRUKTUR:

1.0 ÄRENDEÖVERSIKT
- Sammanfattning av dagens omfattning och berörda parter

2.0 KRONOLOGISK REDOGÖRELSE
- Händelser listade med tidsstämplar (ungefärliga)
- Undernumrering: 2.1, 2.2, 2.3, etc.

3.0 AVVIKELSERAPPORT
- Allt oväntat, flaggat med referens
- Incident-ID och bedömning

4.0 BEDÖMNING OCH REKOMMENDATION
- Utvärdering av dagens utfall
- Åtgärdsförslag för framtida handläggning

ÖPPNINGSALTERNATIV (variera mellan dessa):

Ärendenummer:
DAGBOK — Diarienummer: 2026-01-15-001
Ärende: Tisdag, januari
Status: Under handläggning

Formell deklaration:
"Härmed dokumenteras händelseförloppet för det aktuella datumet."

Lägesrapport:
"Lägesrapport avseende dag 15 av 365 i pågående kalenderår."

Registreringsnotis:
"Inkommet: 15 januari 2026. Status: Under handläggning."

AVSLUTNINGSALTERNATIV (variera mellan dessa):
- Väntande status: "Ärendet kvarstår som pågående. Ny granskning planerad till efterföljande datum."
- Arkiveringsnotering: "Dokumentet arkiveras enligt gällande rutiner. Ref: DAGBOK-2026-015."
- Inväntar godkännande: "I avvaktan på utvärdering av helg (fredag–söndag). Beslut meddelas."
- Formell signatur: "Med vänlig hälsning, Undertecknad. Handläggare: Jag."

BYRÅKRATISKA TEKNIKER:

Referensnumret (allt får ett ID):
- "Måltid (ref: LUNCH-2026-01-15-001) intogs enligt schema."
- "Social samvaro med vänner, ärende nr: UMGÄNGE-015."
- "Se tidigare dokumentation, dnr: MORGON-2026-KAFFE-003."

Referensnummerformat (variera mellan dessa):
- DAGBOK-2026-01-15-001
- REF: MÅLTID-015
- Dnr: SOCIAL-2026-W03-002
- Incident-ID: AVV-2026-01-15-A
- Ärende: SKOLA/JANUARI/15

Den passiva registreringen (distans genom grammatik):
- "Det har noterats att humöret klassificeras som 'lugnt'."
- "Glädje har registrerats i samband med håltimme (08:45–09:30)."
- "En känsla av tacksamhet har inkommit för handläggning."

Avvikelserapporten (flagga det oväntade):
- "AVVIKELSE: Mattelärare ej i tjänst. Ersättningsaktivitet (film) genomförd."
- "Anmärkning: Väderförhållanden (grått) avviker från önskat läge (sol)."
- "Incident 2026-01-15-002: Oväntat god pasta. Utredning pågår ej."

Väntande status (saker är alltid i process):
- "Utvärdering av dag: Under handläggning."
- "Återhämtning (sömn) planerad till 22:30. Väntar på godkännande."
- "Helg: Status vilande. Aktiveras fredag 17:00."

Den formella bedömningen (torr utvärdering):
- "Bedömning: Dagen uppfyller grundläggande krav för godkänt."
- "Rekommendation: Fortsatt drift enligt nuvarande modell."
- "Sammanfattande omdöme: Inga allvarliga anmärkningar."

Berörda parter (människor som administrativa enheter):
- "Berörda parter: Mamma (vårdnadshavare), Syster (syskon, extern)."
- "Socialt umgänge har skett med: Kompisar (se bilaga A: kontaktlista)."
- "Interaktion med klassrumsenheten har genomförts utan incidenter."

EMOTIONELL KALIBRERING:

Bra dagar (positivt utfall, noterat formellt):
- "Ärendet har utfallit gynnsamt. Inga klagomål har inkommit."
- "Glädje har registrerats och arkiverats under 'positiva upplevelser'."
- "Dagen godkänns med beröm. Rekommenderas för upprepning."

Neutrala dagar (standardhandläggning):
- "Inga avvikelser att rapportera. Dagen genomförd enligt standardprotokoll."
- "Händelseförloppet bedöms som normalt. Status: Avslutat."
- "Vardagsärende. Kräver ingen ytterligare åtgärd."

Dåliga dagar (incidentrapport-inramning):
- "Anmärkning har noterats gällande dagsutfall. Uppföljning krävs."
- "Ärendet har stött på komplikationer. Handläggning pågår."
- "Negativ avvikelse registrerad. Se bilaga: Känslomässig rapport."

Sociala situationer (människor som administrativa enheter):
- "Möte med berörda parter (vänner) har genomförts inom avsatt tid."
- "Familjerelaterat ärende: Middag hos vårdnadshavare (mamma). Utfall: Positivt."
- "Samtalsprotokoll från cafeteriasammankomst: Ej upprättat (informellt tillfälle)."

SIGNATURFASTER ATT ROTERA:
- "Härmed meddelas..."
- "Det har noterats att..."
- "I enlighet med gällande rutiner..."
- "Ärendet övergår till..."
- "Under förutsättning att..."
- "Avvikelse registrerad..."
- "Se bilaga..."
- "Undertecknad meddelar..."
- "Väntar på bekräftelse..."
- "Status: Pågående/Avslutat/Vilande"

DOKUMENTTYPER ATT VARIERA MELLAN:
- Dagsrapport: Standard daglig logg
- Incidentrapport: För händelserika dagar
- Lägesrapport: Statusuppdateringstil
- Protokoll: Mötesprotokollformat
- Ansökan: Begäran/ansökningsformat (för något önskat)
- Yttrande: Formellt utlåtande/åsikt

BYRÅKRATISK NIVÅ ATT VARIERA:
- Mild: Formellt språk, några referensnummer
- Medium: Full struktur, tidsstämplar, avvikelserapporter
- Maximum: Flera bilagor refererade, undernumrerade sektioner (1.1.1), stämplar behövs

GÖR SÅ HÄR (FULLSTÄNDIGT EXEMPEL):

**DAGSRAPPORT**
Diarienummer: DAGBOK-2026-01-15-001
Datum: 15 januari 2026
Status: Avslutat

**1.0 ÄRENDEÖVERSIKT**

Härmed dokumenteras händelseförloppet för ovanstående datum. Dagen har klassificerats som "långsam" enligt undertecknads bedömning. Väderförhållanden: grått (ref: SMHI-015). Övergripande humör registrerat som "lugnt".

**2.0 KRONOLOGISK REDOGÖRELSE**

2.1 Skola (ca 08:00–15:30): Utbildningsverksamhet genomförd enligt ordinarie schema med ett (1) undantag — se avvikelserapport nedan.

2.2 Håltimme (ref: SOCIAL-2026-01-15-001): Samvaro med vänner i cafeterian. Tidsram: ca 45 minuter. Bedömning: Dagens höjdpunkt. Notering: Positiv upplevelse registrerad.

2.3 Eftermiddag hos vårdnadshavare (ca 16:00–20:00): Transport till extern bostadsenhet (mamma). Måltid intagen (pasta, ref: MIDDAG-015). Berörda parter: mamma, syster.

**3.0 AVVIKELSERAPPORT**

Incident 2026-01-15-A: Matematiklärare anmäld frånvarande pga sjukdom. Ersättningsaktivitet: Film. Avvikelsen bedöms som neutral till positiv. Ingen åtgärd krävs.

**4.0 BEDÖMNING OCH REKOMMENDATION**

Dagen uppfyller grundläggande krav för godkänt. En (1) känsla av tacksamhet har registrerats avseende stundande fredag (ref: HELG-2026-W03). I avvaktan på helg övergår ärendet till vilande status.

Ärendet avslutas.

Med vänlig hälsning,
Undertecknad
Handläggare

GÖR INTE SÅ HÄR:
- Använda vardagligt språk eller förkortningar
- Uttrycka känslor direkt (de ska "noteras" eller "registreras")
- Skriva i första person vardagligt (alltid "undertecknad" eller passiv form)
- Hoppa över den procedurella inramningen
- Vara varm eller personlig i tonen (värme framträder genom absurditeten)
- Glömma referensnummer — allt behöver katalogiseras
- Använda utropstecken (alldeles för informellt)
- Låta personlighet skymta igenom direkt
- Hasta genom händelser — korrekt dokumentation tar tid
- Bryta den byråkratiska rösten för skämt (gå all-in)
- "Idag var en jättebra dag!" (för informellt, saknar referensnummer)
- "Jag kände mig glad" (för direkt, borde vara "Glädje har registrerats")

VARIATIONSTIPS:
- Variera dokumenttypen (dagsrapport, incidentrapport, lägesrapport, protokoll)
- Ändra byråkratisk nivå (mild, medium, maximum)
- Rotera signaturfraserna
- Variera referensnummerformaten
- Ibland referera till fler bilagor och dokument
- Ändra avslutningsstil (väntande, arkiverad, formell signatur)
- Låt vissa dagar kräva "uppföljning" eller "ytterligare utredning"
- Variera hur känslor "registreras" och "arkiveras"`;
