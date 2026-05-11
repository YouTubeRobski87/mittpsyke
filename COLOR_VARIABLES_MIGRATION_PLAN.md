# Plan för migrering till CSS-variabler för färger

## 1. Inventering

1. Sök igenom projektet efter hårdkodade färger med minsta möjliga diff som princip. Ändra inget i detta steg.
2. Sök efter `#`, `rgb(`, `rgba(`, `hsl(`, `hsla(` och namngivna färger som `white`, `black`, `transparent`, `red`, `green`, `blue` och liknande.
3. Inventera minst dessa områden:
   - `src/app.css`
   - `src/routes/+layout.svelte`
   - alla filer under `src/routes`
   - alla filer under `src/lib/components`
   - alla filer under `src/lib/styles` om mappen finns eller skapas senare
4. Dokumentera vilka filer och sidor som har hårdkodade UI-färger.
5. Skilj på UI-färger och legitima undantag, till exempel externa brandfärger, bilddata, grafer, SVG-illustrationer eller färger som är en del av användargenererat innehåll.

Exempel på sökningar:

```bash
rg -n "#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|\b(white|black|red|green|blue|yellow|orange|purple|gray|grey|transparent)\b" src
```

## 2. Definiera färgvariabler

1. Samla globala färgvariabler i den centrala globala CSS-fil som projektet redan använder, i första hand `src/app.css`.
2. Om projektet senare får en tydlig tokenstruktur kan variabler delas upp i `src/lib/styles/*`, men börja inte med en större strukturrefaktor.
3. Använd semantiska variabelnamn som beskriver syfte, inte bara färg.
4. Undvik att skapa en ny variabel för varje nyans om nyansen inte har en tydlig roll.
5. Behåll befintligt visuellt uttryck så nära som möjligt när värden flyttas till variabler.

Föreslagna globala variabler:

```css
:root {
	--color-bg: ...;
	--color-bg-soft: ...;
	--color-surface: ...;
	--color-surface-muted: ...;
	--color-border: ...;
	--color-text: ...;
	--color-text-muted: ...;
	--color-primary: ...;
	--color-primary-hover: ...;
	--color-accent: ...;
	--color-danger: ...;
	--color-success: ...;
	--color-warning: ...;
	--color-focus: ...;
	--shadow-color: ...;
}
```

## 3. Principer för migreringen

1. Gör en sida eller komponent i taget.
2. Varje ändring ska göras med minsta möjliga diff.
3. Ersätt hårdkodade färger med semantiska CSS-variabler.
4. Skapa en ny variabel endast när färgen har en tydlig semantisk roll.
5. Ändra inte layout, spacing, typografi, komponentstruktur, routes, auth-logik eller tracking samtidigt.
6. Undvik stora refaktorer och globala omskrivningar.
7. Kontrollera hover, focus, active och disabled states när en färg byts.
8. Kontrollera kontrast och läsbarhet efter varje relevant ändring.
9. Kör `npm run check` och `npm run build` efter varje större del.
10. Om en del bara rör en mycket liten och isolerad färgersättning kan check/build köras efter en samlad batch, men aldrig efter för många filer samtidigt.

## 4. Rekommenderad genomgångsordning

1. Global CSS, `src/app.css` och befintliga tokens.
2. Root layout, header, topbar, navigation och profilmeny i `src/routes/+layout.svelte`.
3. Startsidan i `src/routes/+page.svelte`.
4. Chatta-sidor, inklusive `/chat`, `/chat/[category]`, `/chatta-anonymt` och relaterade SEO-sidor.
5. Dagbok, checkin och dagboksflöden.
6. Dashboard och Min portal.
7. Guider och SEO-guide-sidor.
8. Övningar och verktyg.
9. Blogg och artikelsidor.
10. Forum eller gemenskapsytor om de finns i aktuell kodbas.
11. Inställningar, profil och avatar.
12. Auth-flöden: login, register och återställning om det finns.
13. Policy-, ansvar-, integritets- och informationssidor.
14. Delade komponenter i `src/lib/components`.
15. Formulär, knappar, kort, modaler, badges, alerts, dropdowns och paneler.
16. Mobilvyer och responsiva specialfall.
17. Dark/light theme och befintliga temavariabler om projektet har stöd för det.

## 5. Sida-för-sida-checklista

1. Öppna sidfilen.
2. Identifiera alla hårdkodade färger i markup och `<style>`.
3. Kontrollera om färgen redan motsvaras av en befintlig variabel.
4. Ersätt med befintlig variabel när rollen matchar.
5. Skapa ny variabel endast om färgen har en tydlig semantisk roll som återkommer eller bör styras centralt.
6. Kontrollera hover, focus, active och disabled states.
7. Kontrollera kontrast för text, länkar, knappar och viktiga statusytor.
8. Kontrollera mobilvy och desktopvy.
9. Kontrollera dark/light theme om sidan påverkas.
10. Kör `npm run check` och `npm run build` vid behov, och alltid efter varje större sidgrupp.

## 6. Komponent-checklista

1. Prioritera återanvändbara komponenter före små engångsdetaljer.
2. Börja med komponenter som används brett, till exempel layout, navigation, knappar, kort, inputs och paneler.
3. Normalisera färganvändning för:
   - knappar
   - kort
   - inputs
   - badges
   - alerts
   - dropdowns
   - modaler
   - tooltips
4. Säkerställ att samma typ av UI inte använder olika färgvariabler utan tydlig anledning.
5. Behåll komponenternas befintliga API och markup så långt som möjligt.
6. Gör ändringarna med minsta möjliga diff.
7. Kör `npm run check` och `npm run build` efter större komponentgrupper.

## 7. Risker

1. Färger kan ändras visuellt av misstag även om värdet ser likt ut.
2. För många variabler kan göra systemet svårare att förstå än hårdkodade färger.
3. Variabelnamn som beskriver färgen, till exempel `--green-500`, löser inte semantiken lika bra som `--color-success` eller `--color-primary`.
4. Färgmigrering får inte blandas med layoutändringar, spacingändringar eller komponentrefaktorer.
5. Hover, focus, active och disabled states kan lätt missas.
6. Kontrast och tillgänglighet kan försämras om text- och bakgrundsvariabler kombineras fel.
7. Dark/light theme kan brytas om variabler inte definieras konsekvent i båda lägen.
8. Gamla Tailwind-klasser eller inline-färger kan finnas kvar även efter att komponentens lokala CSS migrerats.

## 8. Definition of Done

1. Inga hårdkodade färger finns kvar för UI-färger, förutom dokumenterade undantag.
2. Alla centrala färger finns som CSS-variabler i projektets globala tokenyta.
3. Variablerna är semantiskt namngivna och används konsekvent.
4. `npm run check` passerar.
5. `npm run build` passerar.
6. Visuellt utseende är kontrollerat på centrala sidor:
   - startsida
   - chat
   - dagbok/checkin
   - dashboard
   - guider
   - blogg
   - login/register
7. Mobilvy är kontrollerad på centrala flöden.
8. Dark/light theme är kontrollerat om projektet har stöd för det.
9. Eventuella undantag är dokumenterade i planen eller i en separat notering.
