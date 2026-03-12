# Encoding Fix Log – content.ts

## Bakgrund

Filen `src/lib/seo-kit/content.ts` innehöll systematisk enkodningskorruption som påverkade alla guidesidor på mittpsyke.se. Felet härstammar sannolikt från en felaktig teckenkodning vid ett tidigt skede av filens skapande eller kopiering.

Korruptionen påverkade:
- Läsbarhet för användare
- Trovärdighet och helhetsintryck
- SEO-kvalitet på guidesidorna

---

## Utförd rättning – 6 pass

### Pass 1–2 – `?`-korruption (automatisk med ordlistevalidering)
- Metod: Svenska ordlistan (153 000 ord) testade alla tre vokaler (å/ä/ö) för varje `?`
- 76 unika ord identifierade och säkert fixade
- **344 ersättningar**
- Exempel: `självkänsla`, `känslor`, `sömn`, `nedstämdhet`, `trötthet`, `mående`, `varför`, `nästa`, `förstå`

### Pass 3 – Dubbel-korruption (manuell)
- Ord med dubbel skada, t.ex. `f?rbattringssteg` → `förbättringssteg`
- **98 ersättningar**
- Exempel: `försöka`, `förändring`, `Jämförelsetrasket`, `förbättringssteg`

### Pass 4 – Ordstart/ordslut-fall
- `?` i början eller slutet av ord
- **~60 ersättningar**
- Exempel: `ångest`, `övningar`, `överväldigande`, `återfå`, `förstå`, `första`

### Slutfix – sista manuella restfallet
- `sv?rta sömnperioder` → `svåra sömnperioder`
- **1 ersättning**

### Pass 5 – ASCII-strippade svenska tecken
- Hela ä/å/ö borttagna utan `?`-markering
- **224 ersättningar**
- Exempel: `är`, `för`, `göra`, `gör`, `känna`, `något`, `många`, `även`, `länge`

### Pass 6 – Missade restfall
- Ord som passade igenom pass 5 på grund av saknade mönster
- **31 ersättningar**
- Exempel: `ältande`, `kvällsoro`, `svårare`, `sängen`, `använda`, `kvällen`

---

## Totalt

| Pass | Ersättningar |
|---|---|
| Pass 1–2 | 344 |
| Pass 3 | 98 |
| Pass 4 | ~60 |
| Slutfix | 1 |
| Pass 5 | 224 |
| Pass 6 | 31 |
| **Totalt** | **~760** |

---

## Vad som INTE ändrades

- Slugs och URL-paths (t.ex. `angst`, `somnproblem`)
- `href`-attribut och routinglogik
- TypeScript-kod och nyckelnamn
- Riktiga frågetecken i FAQ-sektioner (101 st bevarade)

---

## Slutstatus

Encodingrundan är klar. `content.ts` har städats i sex pass och cirka 760 felaktiga tecken/ord har korrigerats, inklusive mojibake, frågeteckenskorruption och ASCII-strippade svenska tecken. Textinnehållet är nu återställt till korrekt svenska utan att slugs, hrefs eller kodlogik ändrats.

**Datum:** Mars 2026
