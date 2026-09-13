# NORTH STAR

> Vi bygger inte funktioner.
> Vi bygger en plats människor vill återvända till.

North Star är vår kompass för världen vi bygger.

MittPsyke är inte bara en app. Det är en lugn plats som alltid finns kvar. När användaren återvänder känns platsen bekant, följeslagaren känner igen dem och världen har förändrats lite - precis som de själva.

AI, dagbok, forum och Growth Garden är inte separata funktioner. De är olika sätt att vårda samma plats.

## Grundkänsla

Världen ska kännas trygg, levande, varm, stillsam, personlig och naturlig.

Användaren ska känna att platsen fortsätter existera även när ingenting aktivt händer.

Målet är inte en plats full av ständig aktivitet, utan en värld som känns levande genom små, lugna detaljer.

## Den viktigaste principen

Om två lösningar är lika bra tekniskt väljer vi alltid den lugnaste.

Det betyder oftast mindre animation, mindre brus, mer luft, färre färger, enklare copy, tydligare hierarki och mjukare övergångar.

Vi frågar inte bara: "Vad ska hända här?"

Vi frågar: "Vad får platsen att kännas levande och trygg?"

## Verktyget tjänar tillståndet

Verktyget ska tjäna användarens tillstånd, inte jaga användarens uppmärksamhet.

Det gäller hela MittPsyke, inte bara världen:

- AI:n ska hjälpa, inte imponera.
- Dagboken ska bjuda in, inte pressa användaren att skriva mer än hen vill.
- Statistik ska hjälpa användaren förstå, inte få hen att prestera.
- Världen ska påminna om att användaren varit där, inte kräva att hen kommer tillbaka.

Beslutstest inför varje ny idé:

> Passar detta MittPsyke för att det hjälper användaren – eller för att det fångar mer uppmärksamhet?

### Live-röstsamtal och minne

Live är flyktigt. Dagboken är minnet. Humöranalysen använder bara material som användaren aktivt valt att spara.

Framtida live-samtal ska vara röst till röst, utan automatisk texttråd eller långtidslagring. Efteråt väljer användaren att spara en granskad, kort sammanfattning i dagboken, spara ljud om stöd finns, eller spara inget. Ingenting sparas automatiskt.

Sammanfattningen ska återge det användaren faktiskt uttryckte. Röstläge och ljudegenskaper får inte användas för humörpoäng eller psykologiska slutsatser. Säkerhetsregler gäller även när ingenting sparas.

Arkitektur, datagränser och leveransordning finns i [Live-röstsamtal](LIVE_VOICE_ARCHITECTURE.md). Principen införs där som plan; dagens diktering i textchatten är inte ett separat live-läge.

## Platsen kommer först

Användaren återvänder alltid till samma plats.

Den förändras långsamt.

Den börjar aldrig om.

MittPsyke ska kännas som ett hem, inte som ett kontrollsystem, ett spelgränssnitt eller en klinisk portal.

## Följeslagaren är identiteten

Profilbilden är följeslagaren.

Inte en bokstav.

Inte en selfie.

Inte en generisk AI-avatar.

Följeslagaren ska inte alltid prata eller kräva uppmärksamhet. Ibland sitter den bara vid sjön och tittar ut över vattnet.

Närvaron ska kännas som sällskap utan krav.

## Balder

**Balder, björnen, är MittPsykes enda följeslagare.**

Det finns inget val av följeslagare. Alla som använder MittPsyke möter samma björn, i samma värld. Det gör platsen enkel att känna igen och lätt att återvända till.

Björnen är varm, trygg, jordnära och lite småfilosofisk. Den sitter länge, rör sig sparsamt och utstrålar trygghet. Den kan blinka långsamt, flytta vikten, titta upp mot himlen eller sova när natten kommer.

Den är ingen maskot som uppträder. Rörelsen ska alltid vara lågmäld.

### Besökare

**Räven förekommer bara som besökare.** Den kan ibland komma förbi och sitta en stund nära björnen, vaken eller sovande, och sedan gå igen. Den är aldrig en följeslagare, går inte att välja och får aldrig ta björnens plats.

Nya djur läggs inte till som följeslagare. Om fler djur någon gång ska synas i världen är de besökare på samma villkor som räven.

Teknisk riktning finns i `docs/COMPANION_SYSTEM.md`. Där produktbeslutet ovan och den tekniska dokumentationen skiljer sig åt gäller produktbeslutet.

## Kvällstugan

Platsen där dagen landar heter **Kvällstugan**. Man går in i den från stugan på Mitt Hem.

Funktionen där inne heter **Kvällsincheckning**: en kort, frivillig incheckning när dagen är slut.

Det finns inga andra namn för samma plats eller funktion. Namnet **Kvällslugn** ska inte användas.

## Världens lager

### Lager 1: Platsen

Grunden förändras nästan aldrig: samma glänta, samma träd, samma stig och samma berg i bakgrunden.

Det är hem.

### Lager 2: Följeslagaren

Följeslagaren gör platsen personlig.

Den kan flytta sig lite, vila, sitta vid stugan eller titta mot sjön.

### Lager 3: Årstider

Årstider sker automatiskt.

Vår, sommar, höst och vinter ska märkas utan att användaren behöver göra något.

### Lager 4: Tid på dygnet

Ljus och stämning följer dagen: soluppgång, dagsljus, gyllene kväll och stjärnhimmel.

Användaren behöver knappt märka varför platsen känns levande.

### Lager 5: Din resa

Growth Garden ska inte vara en separat funktion. Den ska vara motorn bakom hela världen.

När användaren skriver, återvänder eller tar hand om sig själv påverkar det platsen långsamt.

Inte XP.

Inte nivåer.

Inte prestation.

Bara små tecken: ett grässtrå, några blommor, en sten, ett träd som vuxit lite.

### Lager 6: Väder

Väder kan finnas ibland: regn, solsken, dimma eller lite vind.

Det behöver inte påverka något. Det gör bara världen levande.

### Lager 7: Små händelser

Små händelser ska vara sällsynta: en fågel långt bort, en fjäril som flyger förbi, ett löv som faller, små ringar på sjön.

Inga belöningar. Bara liv.

## En levande värld

Små rörelser ska ge världen liv:

- mjuka rörelser i vattnet
- gräs som rör sig i vinden
- löv som faller ibland
- små ringar på sjön
- fåglar långt bort
- skiftningar i ljuset
- dimma på morgonen
- varm glöd på kvällen

Ingenting får skrika efter uppmärksamhet.

Allt ska kännas som om naturen bara fortsätter medan användaren är borta.

## Ingen skuld

MittPsyke ska aldrig skapa skuld.

Undvik röda badges, brutna streaks, "du missade igår", stressiga notifieringar och krav på prestation.

Om någon varit borta länge säger MittPsyke:

> Vad fint att se dig igen.

Inte:

> Din streak är bruten.

## Inga belöningar

MittPsyke belönar inte.

MittPsyke uppmärksammar.

Inte:

> +50 XP

Utan:

> En ny blomma har slagit ut.

Framsteg ska upptäckas, inte annonseras.

Vi berättar inte för användaren att något vuxit. Vi låter användaren upptäcka det.

Inte:

> Ny blomma upplåst.

Utan känslan:

> Var det verkligen blommor här sist?

## Vad vi vill undvika

- överdrivna animationer
- stressiga rörelser
- för mycket text
- konstanta notifieringar
- figurer som alltid kräver svar
- en värld som känns som ett spelgränssnitt
- skuldskapande streaks
- röda badges och "du har missat"-signaler

## Visuell riktning

Gränssnittet ska kännas som en lugn fristad, inte som ett traditionellt verktyg eller en klinisk hälsoplattform.

Designen ska bygga på:

- varmvit och mjuk bakgrund
- mycket luft mellan elementen
- tydlig men lågmäld sidonavigering
- stora rundade kort
- mjuka pastelltoner
- varma naturtoner
- naturinspirerade detaljer
- låg visuell belastning
- lugn typografi
- följeslagaren som central trygg punkt
- korta, vänliga texter
- naturmotiv som känns levande och verkliga

Funktionerna ska vara tydliga, men sidan får aldrig kännas som ett kontrollsystem.

## Visual references

Before changing UI, inspect:

- `docs/references/README.md`
- every image inside `docs/references/`

Priority order:

1. `docs/references/00-design-system.png`
2. `docs/references/01-dashboard-current-target.png`
3. `docs/references/02-home-vision-bear.png`
4. `docs/references/03-companion-world-reference.png`
5. `docs/references/04-hero-bear-scene.png`

The first two references are the strongest source of truth for interface work.

Referenserna 3–5 visar björnen, som också är MittPsykes enda följeslagare. Läs dem som referens för världen, bildutsnittet och stämningen.
