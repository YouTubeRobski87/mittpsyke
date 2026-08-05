# Arbetslista: konsistensproblem i emotional-intelligence.md

**Tillfälligt dokument.** Tas bort när granskningen är klar och det slutliga
konsistenspasset är gjort.

Listan finns för att problem som upptäcks i ett block inte ska glömmas bort när
granskningen gått vidare till nästa. Inget här är åtgärdat ännu - varje punkt
hanteras när respektive block granskas.

Filen är namngiven med inledande understreck för att skilja den från de
dokument som är avsedda att leva vidare.

---

## Öppna punkter

### 1. Sektion 8 — energi och intensitet

**Problem:** Sektion 8 säger *"AI:n ska aldrig vara mer entusiastisk än
personen"* och har rubriken *"AI:n ska aldrig"* över fem punkter, däribland
"låta glad i en tung situation".

Sektion 2 säger sedan omskrivningen att ett lågmält svar är fel i tre lägen,
bland annat **när personen söker mer energi**.

De två motsäger varandra direkt.

**Uppstod:** när sektion 2 skrevs om utan att sektion 8 söktes igenom.

**Hanteras:** vid granskning av block med sektion 8.

---

### 2. Sektion 4 — modell ombyggd, följdändringar återstår i sektion 12 och 14

Femnivåmodellen är ersatt av tre innehållszoner (A/B/C) med semantiska kriterier
i stället för den ordstyrda regeln. Modellen är godkänd i sak.

**Följdändringar som återstår:**

**Sektion 14, krav 3** är formulerat som en nyckelordsregel - *"när personens
meddelande innehåller ett absolut ord (ingen, alla, alltid, aldrig, bara)"*. Den
formuleringen är uttryckligen avfärdad i sektion 4 och behöver skrivas om mot de
tre semantiska kriterierna.

**Sektion 12** behöver kontrolleras mot zonmodellen. Exemplen skrevs innan den
fanns och kan förutsätta den gamla logiken.

**Hanteras:** vid granskning av block med sektion 12 och 14.

---

### 3. Sektion 11 — språk om att återkomma

**Problem:** *"Du kan alltid komma tillbaka hit"* listas som
beroendeframkallande språk.

Att säga att någon får återkomma är inte i sig skadligt. Det är
*alltid*-inramningen och exklusiviteten - att AI:n positionerar sig som platsen
personen ska återvända till - som är problemet.

Regeln är skriven som absolut men är situationsberoende.

**Hanteras:** vid granskning av block med sektion 11.

---

### 4. Sektion 10 — "felet är alltid detsamma"

**Problem:** *"Steg 3 är där det oftast går fel, och felet är alltid detsamma:
förslaget är för stort."*

Ett överdrivet påstående presenterat som konstaterande. "Oftast" och "alltid" i
samma mening motsäger dessutom varandra.

**Hanteras:** vid granskning av block med sektion 10.

---

### 5. Sektion 12 — andningsrådets tidpunkt

**Problem:** exempel 5 (ångest) kallar ett andningsråd "svagt". Vid en
panikattack kan en jordande teknik vara precis rätt.

Det som faktiskt är fel i exemplet är två andra saker: att rådet sätter en
etikett ("det låter som en panikattack") och att det kommer före kontrollen av
om personen är trygg. Inte att andningsråd i sig vore fel.

Exemplets motivering behöver skrivas om så den pekar på rätt fel.

**Hanteras:** vid granskning av block med sektion 12.

---

### 6. Exempelbiblioteket ska prövas mot pedagogisk funktion

**Beslut:** exempel tas bort endast om två gör exakt samma pedagogiska arbete -
inte för att de liknar varandra i form.

Sektion 4:s fyra genomarbetade exempel är prövade och behålls. Två delar form
(spegling utan fråga) men lär ut olika beslut, se tabellen i granskningen av
block 3.

**Kvarstår:** samma prövning för sektion 12:s femton exempel när det blocket
granskas. Där är risken för dubblering större eftersom listan är längre och
byggdes utifrån en kategorilista snarare än utifrån beslut.

---

### 7. Sektion 3 — när personen själv använder klyschor

Kontrollera i sektion 3 hur inlärda standardfraser, självhjälpsspråk och
förminskande klyschor från personen ska läsas utan att automatiskt tolkas som
deras egentliga upplevelse.

Exempel: *"jag vet ju att jag inte är ensam om det här"*, *"det är väl helt
normalt antar jag"*, *"andra har det värre"*.

Ligger nära förminskningsspråket under **Skam** i signalkatalogen, men är inte
samma sak - skam förminskar, medan en inlärd fras kan dölja vad som helst.

Uppkom under granskningen av sektion 5. Byggdes medvetet inte ut där, eftersom
det hör till avläsning och inte till formulering.

**Hanteras:** vid nästa granskning av sektion 3.

---

### 8. Prompten rekommenderar en fråga som filosofin avråder från

Systemprompten anger *"Vad känns tyngst just nu?"* som mönsterexempel på en bra
öppen fråga.

`conversation-philosophy.md` anger samma fras som exempel på en generisk fråga
att undvika - en som hade kunnat ställas till vem som helst.

Baslinjemätningen i `conversation-review.md` visar att modellen faktiskt använde
den i replik 1. Motsägelsen är alltså inte teoretisk.

**Hanteras:** vid migrering av prompten. Flyttad hit från sektion 6.

---

### 9. Prompten förbjuder färdiga alternativ som två dokument rekommenderar

Systemprompten säger: *"Undvik att kategorisera åt användaren med färdiga
alternativ (t.ex. 'är det X, Y eller Z?')."*

Både `emotional-intelligence.md` sektion 6 och `conversation-philosophy.md`
rekommenderar formen. Filosofins egen "bättre" fråga - *"Är det saknaden i sig
som är tyngst, eller det som gjorde att det blev så här?"* - är en X-eller-Y-fråga
om känslor.

**Distinktionen som behöver in i prompten:** att kategorisera *känslan* åt någon
("är det oro, ilska eller sorg?") är fel. Att erbjuda två *samtalsriktningar*
("vill du reda ut det, eller mest bara skriva av dig?") är hjälp.

**Hanteras:** vid migrering av prompten. Flyttad hit från sektion 6.

---

## Genomgående mönster att bevaka

**Överabsoluta formuleringar.** Genomgången av hela dokumentet visade att det
skrivs regler med "aldrig", "alltid" och tvingande imperativ även där saken är
situationsberoende. Klassificeringen gjordes i tre grupper - absolut, normal
utgångspunkt, situationsberoende - och de punkter som behövde ändras står som
egna poster ovan.

**Ändringar i ett block skapar motsägelser i ett annat.** Punkt 1 uppstod
precis så. Ett slutligt konsistenspass över hela dokumentet krävs när alla block
granskats, och räcker inte att göra block för block.

**Statusmarkörer.** Ingressen säger att status anges samlat i tabeller, inte i
löptexten. Sektion 5 till 16 innehåller fortfarande emoji-markörer i brödtext.
Rättas per block.
