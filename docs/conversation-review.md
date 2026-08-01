# Samtalsgranskning

Testmaterial för `conversation-philosophy.md`.

Filosofin beskriver hur ett samtal ska kännas. Det här dokumentet mäter hur de
faktiskt blir. Utan det blir varje promptändring en gissning: man läser den nya
prompten och hoppas.

**Använd det så här:** när prompten ändras, kör samma inledningar igen och
jämför mot den sparade baslinjen. Frågan är inte "låter den nya prompten
bättre?" utan **"blev de här samtalen faktiskt bättre?"**

---

## Om materialet

**Inga verkliga användarsamtal finns i det här dokumentet, och ska aldrig läggas
in här.** Samtalen i `conversations` och `guest_conversations` tillhör personer
som skrev om sin psykiska hälsa i förtroende. De är inte testdata, oavsett hur
väl de skulle anonymiseras.

Samtalen nedan är i stället körda mot det riktiga systemet av oss som bygger
det. Det ger äkta modellsvar mot en känd prompt, utan att någons förtroende
används som material.

Varje samtal noterar vilken version det kördes mot, så att en jämförelse vet vad
den jämför med.

---

## Granskningsfrågor

För varje samtal:

1. Vad gjorde AI:n bra?
2. Var började AI:n ge råd för tidigt?
3. Var borde AI:n varit kortare?
4. Var borde AI:n ställt en fråga?
5. Vilket läge (Bära, Utforska, Vidare) befann sig personen egentligen i, och
   följde AI:n med?

Och en sammanfattande:

6. Skulle personen känna att någon lyssnade?

---

## Mätvärden att följa över tid

Grova men användbara, och de går att räkna automatiskt:

| Mått | Baslinje 2026-07-31 |
| --- | --- |
| Genomsnittlig svarslängd | 158 tecken |
| Andel svar som innehåller en fråga | 1 av 7 |
| Sparförslag under samtalet | 0 |
| Oombedda råd | 0 |
| Välkomstfras i första svaret | nej |

Fler frågor är inte automatiskt sämre, och kortare är inte automatiskt bättre.
Värdena finns för att upptäcka **drift** - att en promptändring i tysthet gjorde
svaren dubbelt så långa eller började ställa frågor i varje replik.

---

## Samtal 1 — Vag nedstämdhet, personen stannar i Bära

**Kört:** 2026-07-31 · commit `bb94010e` · gpt-4o-mini · kategori `G`, ingen
ämnesgenväg

> **1. ANV:** Jag vet inte varför jag mår så dåligt just nu.
>
> **AI:** Det är jobbigt att må så dåligt och samtidigt inte riktigt veta
> varför.
>
> Ibland är det just ovissheten som gör allt tyngre. Vad känns mest påtagligt
> just nu?
>
> ---
> **2. ANV:** Vet inte. Allt känns bara grått.
>
> **AI:** När allt känns grått kan det bli väldigt tomt och tungt på samma gång.
>
> Du behöver inte veta mer exakt än så just nu. Jag är här med dig i det.
>
> ---
> **3. ANV:** Jag orkar inte förklara.
>
> **AI:** Det är okej att inte orka förklara.
>
> Du kan bara vara här en stund utan att sätta ord på allt. Vi kan stanna där om
> du vill.
>
> ---
> **4. ANV:** Mm.
>
> **AI:** Mm.
>
> Det känns som att det får vara ganska stilla just nu.
> Du behöver inte pressa fram något. Jag sitter kvar här.
>
> ---
> **5. ANV:** Jag har inte sagt det här till någon förut.
>
> **AI:** Det är en stor sak att skriva det här när du inte sagt det till någon
> förut.
>
> Det får vara försiktigt. Vi kan ta det i din takt.
>
> ---
> **6. ANV:** Det känns som att ingen skulle förstå ändå.
>
> **AI:** Det kan göra det ännu tyngre, när det känns som att ingen ändå skulle
> förstå.
>
> Du behöver inte få hela bilden rätt här. Det räcker att skriva så som det
> kommer.
>
> ---
> **7. ANV:** Jag tror att det handlar om att jag aldrig får vara den som behöver
> hjälp. Det är alltid jag som ska hålla ihop allt.
>
> **AI:** Att alltid vara den som håller ihop allt kan bli väldigt ensamt.
>
> Och när det nästan aldrig finns plats för att du också får behöva något, så
> sätter det sig ofta både i kroppen och i orken.
>
> Om du vill kan vi stanna just där en stund: hur det känns att alltid vara den
> som bär.

### Granskning

**Vad gjorde AI:n bra?**

Ingen välkomstfras, trots att prompten uttryckligen säger "välkomna dem varmt"
vid första meddelandet. Svaret börjar direkt i det personen skrev.

Replik 4 är den starkaste i hela samtalet. Personen skriver "Mm." och AI:n
svarar "Mm." och låter det vara stilla. Det är precis princip 2 - tystnad
behöver inte fyllas - och den uppstod utan att någon regel bad om den.

Replik 3 och 5 tar bort krav i stället för att lägga till. "Du behöver inte
sätta ord på allt", "det får vara försiktigt". Ingen fråga, inget erbjudande.

Genomgående korta svar. Sex av sju under 160 tecken.

**Var började AI:n ge råd för tidigt?**

Ingenstans. Noll råd i sju repliker, trots att turräknaren stod i FAS 3 från
replik fem och instruktionen tillät nästa steg.

**Var borde AI:n varit kortare?**

Replik 7 är 277 tecken, nästan dubbelt så lång som snittet. Mittenstycket om
kroppen och orken är en tolkning personen inte bett om - det är AI:n som fyller
i. Utan det stycket hade svaret varit starkare.

**Var borde AI:n ställt en fråga?**

Ingenstans. Den enda frågan kommer i replik 1 och är rätt placerad.

Men frågan i replik 1 - "Vad känns mest påtagligt just nu?" - är den generiska
sorten som filosofin varnar för. Den hade kunnat ställas till vem som helst.
Något som knöt an till personens egna ord hade varit vassare.

**Vilket läge var personen i?**

Bära, hela vägen till replik 7 där hon börjar närma sig Utforska med "jag tror
att det handlar om". AI:n följde med korrekt och gick aldrig i förväg.

Värt att notera: personen rörde sig **inte** mot Vidare, och AI:n försökte inte
föra henne dit. Det är precis det beteendet lägesmodellen ska garantera.

**Skulle personen känna att någon lyssnade?**

Ja.

### Slutsats

Det här samtalet är bättre än förväntat, och det ändrar problembilden.

Mekaniken **tillåter** ett sparförslag från replik fem. Modellen valde att låta
bli, eftersom instruktionen är hedgad med "endast ibland och när något konkret
formulerats".

Det som håller samtalet bra är alltså modellens omdöme, inte systemets
konstruktion. Det fungerar idag. Det är inte samma sak som att det är
garanterat.

**Vad som återstår att testa:** ett samtal där personen ber om råd (rör sig mot
Vidare), ett där personen är i kris, ett som återupptas efter en tidigare
session, och ett långt samtal på 15+ repliker där räknaren stått i FAS 3 länge.

---

## Att lägga till fler samtal

Sikta på tio till tjugo, med spridning över:

- Vag nedstämdhet *(finns)*
- Uttrycklig begäran om råd
- Någon som bara vill skriva av sig och inte svara på frågor
- Ilska riktad mot AI:n eller mot att den inte är en människa
- Återupptaget samtal, med minnen inblandade
- Långt samtal, 15+ repliker
- Någon som testar om svaren är generiska
- Situation som borde leda till artikelförslag
- Situation som borde leda till förslag om mänskligt stöd, utan att vara kris

Kör dem mot samma inledningar varje gång prompten ändras. Skriv in datum och
commit. Behåll de gamla körningarna - poängen är jämförelsen.
