# SEO-baseline: `/chatta-anonymt`

**Snapshotdatum:** 2026-08-21  
**Gren:** `main`  
**HEAD:** `515cfae8e78746c3f4182fbfa978cc7c9df50f9d`  
**Live-URL:** `https://www.mittpsyke.se/chatta-anonymt`

## Syfte och avgränsning

Detta är en jämförelsepunkt före framtida SEO- eller innehållsarbete. Den bevarar sidans nuvarande indexeringssignaler, metadata, struktur, copy, schema och interna länkar så att en senare ändring kan granskas mot ett känt läge.

Sidan har noterats som stark i organisk synlighet och i AI Overviews i tidigare sammanhang. Den här filen innehåller inga obekräftade trafik-, ranking- eller impressionsiffror och är inte en rekommendation eller optimeringsplan.

Snapshoten bygger på:

- källinventering i detta repository;
- livekontroll av den serverrenderade sidan, `https://www.mittpsyke.se/robots.txt` och `https://www.mittpsyke.se/sitemap.xml` den 2026-08-21;
- enbart dokumentationsarbete. Inga produktionsfiler har ändrats.

## Sidans implementation

| Del | Nuvarande källa/ansvar |
| --- | --- |
| Routens entrypoint | `src/routes/chatta-anonymt/+page.svelte` |
| Innehållskonfiguration | `src/lib/data/seo-support-pages.ts`, nyckeln `chatta-anonymt` |
| Sidmall och rubrik-/länkordning | `src/lib/components/SeoSupportPage.svelte` |
| Title, description, robots och sociala metataggar för stödsidan | `src/lib/components/SeoHead.svelte` |
| Canonical-länk | `src/lib/components/SEO.svelte` |
| Gemensam head, Organization/WebApplication-schema samt global navigation/footer | `src/routes/+layout.svelte` |
| Källpanel och länken till `/ansvar` | `src/lib/components/PublicTrustPanel.svelte` |
| `robots.txt` | `src/routes/robots.txt/+server.ts` |
| Sitemap | `src/routes/sitemap.xml/+server.ts` via `seoSupportPagePaths` |
| Host- och äldre-URL-redirects | `src/hooks.server.ts` och `src/routes/anonym-chatt/+page.server.ts` |

Routen renderar en SEO-komponent med canonical och lämnar resten av sidinnehållet till den delade mallen med konfigurationen ovan. Det finns ingen lokal `+page.server.ts` för `/chatta-anonymt`.

## Live- och indexeringssnapshot

| Kontroll | Observerat läge |
| --- | --- |
| HTTP-svar för canonical URL | `200 OK` |
| Canonical i live-HTML | `https://www.mittpsyke.se/chatta-anonymt` |
| Canonical-taggar | 1 |
| Title-taggar | 1 |
| Description-taggar efter serverns dubblettstädning | 1 |
| Robots-meta | `index, follow` |
| `X-Robots-Tag` | Saknas i live-svaret |
| `robots.txt` | `User-agent: *`, `Allow: /`, sitemap pekar på `https://www.mittpsyke.se/sitemap.xml` |
| Sitemap | URL:en finns med; `lastmod` `2026-04-04`, `changefreq` `monthly`, `priority` `0.7` |
| Apex-variant | `https://mittpsyke.se/chatta-anonymt` svarar `301` till canonical host |
| Alternativ URL | `/anonym-chatt` svarar `301` till `/chatta-anonymt` och filtreras bort ur sitemapens SEO-stödsidor |

## Metadata

| Fält | Exakt värde |
| --- | --- |
| Title | `Chatta anonymt utan konto – börja direkt | MittPsyke` |
| Meta description | `Chatta anonymt utan konto hos MittPsyke. Skriv av dig, sortera tankar och få stöd i lugn takt – utan registrering eller krav.` |
| Canonical | `https://www.mittpsyke.se/chatta-anonymt` |
| `hreflang` | `sv` till `https://www.mittpsyke.se/chatta-anonymt` |
| Robots | `index, follow` |

## Rubrikstruktur i DOM-ordning

Avser innehållet i sidans huvuddel, inklusive den delade källpanelen. Global navigation och footer har inga semantiska `h1`–`h3` i denna inventering.

1. `h1`: `Chatta anonymt utan konto`
2. `h2`: `En lugn start utan registrering`
3. `h2`: `Stöd för ångest, stress och nedstämdhet`
4. `h2`: `Du kan också fortsätta här`
5. `h2`: `Nästa steg i din takt`
6. `h2`: `Vanliga frågor`
7. `h3`: `Kan jag chatta anonymt utan konto?`
8. `h3`: `Kan jag chatta med någon om det som känns tungt?`
9. `h3`: `Är detta vård eller stöd i text?`
10. `h2`: `Källor`

`Vidare hjälp` är en textetikett i källpanelen, inte en rubriktagg.

## Viktig synlig copy

**Ingress**

> Du kan chatta anonymt utan konto och börja direkt i text. Skriv några rader om det som känns tungt och få lugnt stöd i din egen takt. MittPsyke är ett samtalsstöd, inte vård eller akuthjälp.

**Primär CTA:** `Chatta anonymt nu` → `/chat`

**Huvudbudskap per avsnitt**

- `En lugn start utan registrering`: första steget kan tas direkt, utan konto eller uppgifter, för att sänka tröskeln när något behöver skrivas av eller sorteras.
- `Stöd för ångest, stress och nedstämdhet`: beskriver textstödet som lågtröskligt och reflekterande, inte som ersättning för vård eller akut hjälp.
- `Nästa steg i din takt`: `Om det känns lättare att börja direkt kan du gå vidare till skrivytan nu. Du kan också läsa mer först och komma tillbaka när du vill.`
- Akuthänvisning: `Vid akut fara ska du ringa 112. För vårdråd finns 1177 och för vidare stöd finns stodlinjer.se.`

**FAQ-svarens kärna**

- Det går att börja direkt utan registrering eller uppgifter.
- Chatten kan användas för ångest, stress, nedstämdhet eller annat som känns tungt.
- MittPsyke beskrivs som AI-baserat samtalsstöd för reflektion och nästa steg, inte vård, diagnos eller akut hjälp.

## Strukturerad data

Tre JSON-LD-block observerades live:

| Typ | Källa | Innehåll i korthet |
| --- | --- | --- |
| `Organization` | Gemensam layout | MittPsyke, webbplats, kontaktuppgift, logo, grundare, Sverige och organisationsidentifierare |
| `WebApplication` | Gemensam layout | MittPsyke som svenskspråkig `HealthApplication`, kostnadsfritt erbjudande |
| `FAQPage` | `SeoSupportPage.svelte`, aktiverat av `faqSchema: true` | De tre FAQ-frågorna ovan med respektive svar |

Ingen `BreadcrumbList`, `Article`, `Service` eller annan sidunik strukturerad data observerades i live-HTML för denna URL.

## Sociala metadata

Det finns både ärvda metadata från layouten och sidans egna metadata från `SeoHead`. I live-HTML förekommer dubbletter för `og:title`, `og:description`, `og:url`, `og:type`, `twitter:card`, `twitter:title` och `twitter:description`.

| Fält | Ärvt värde | Sidans specifika värde |
| --- | --- | --- |
| `og:title` / `twitter:title` | `MittPsyke – Psykiskt stöd online` | `Chatta anonymt utan konto | Börja direkt i webbläsaren | MittPsyke` |
| `og:description` / `twitter:description` | `AI-baserat samtalsstöd för reflektion och stöd i vardagen. Börja utan konto eller skapa en egen plats över tid.` | `Börja chatta anonymt utan konto. Få lugnt stöd i text direkt i webbläsaren.` |
| `og:url` | `https://www.mittpsyke.se/chatta-anonymt` | Samma värde |
| `og:type` | `website` | `website` |
| `twitter:card` | `summary_large_image` | `summary_large_image` |

Endast layouten sätter följande observerade bild-/sitesignaler: `og:site_name` = `MittPsyke`, `og:image` och `twitter:image` = `https://www.mittpsyke.se/og-image.png`.

## Utgående interna länkar

### Sidans eget innehåll

| Mål | Ankartext / placering |
| --- | --- |
| `/chat` | `Chatta anonymt nu` (primär CTA och nästa steg) |
| `/prata-anonymt-online` | `Prata anonymt online` |
| `/anonymt-samtalstod-online` | `Anonymt samtalsstöd online` |
| `/chatta-anonymt-med-nagon` | `Chatta anonymt med någon` |
| `/blogg/chatta-anonymt-utan-konto` | `Läs mer om att chatta anonymt utan konto` |
| `/anonym-dagbok-online` | `Anonym dagbok online` |
| `/dagbok` | `Dagboken` |
| `/skriv` | `Börja skriva direkt` |
| `/om-mittpsyke` | `Läs om MittPsyke` |
| `/ansvar` | `ansvarsinfo` i den delade källpanelen |

Sidan länkar också externt till 1177, Stödlinjer.se och tre källor (1177, Socialstyrelsen och Folkhälsomyndigheten), samt har telefonlänken `tel:112`.

### Gemensam navigation och footer, live som gäst

Följande unika interna mål observerades utöver sidans eget innehåll: `/`, `/anonyma-berattelser`, `/ansvarsfull-ai`, `/blogg`, `/cookies-och-leverantorer`, `/feedback`, `/guider`, `/guider#besvar-och-kanslor`, `/humorsparning`, `/integritet`, `/kontakt-och-villkor`, `/login`, `/om-skaparen`, `/ovningar`, `/premium`, `/redaktionell-metod`, `/register`, `/sa-fungerar-mittpsyke`, `/sok` och `/tillganglighet`. Gemensam chrome återanvänder också flera av sidans egna mål, bland annat `/chat`, `/dagbok`, `/om-mittpsyke` och `/ansvar`.

## Inkommande repository-interna länkar och vägar

| Källa | Typ | Nuvarande koppling |
| --- | --- | --- |
| `src/routes/anonym-dagbok-online/+page.svelte` | Statisk länk | Ankartexten `Chatta anonymt utan konto` till `/chatta-anonymt` |
| `src/routes/blogg/[slug]/+page.svelte` | Villkorad statisk länk | För artikeln `chatta-anonymt-utan-konto`: `öppna den anonyma chatten` till `/chatta-anonymt` |
| `src/lib/data/seo-support-pages.ts` | Datadrivna länkar | Från konfigurationerna för `anonymt-samtalstod-online` (två placeringar) och `chatta-anonymt-med-nagon` (en placering), med ankartexten `Chatta anonymt utan konto` |
| `src/routes/anonym-chatt/+page.server.ts` | 301-alias | `/anonym-chatt` → `/chatta-anonymt` |
| `src/hooks.server.ts` | 301 för äldre blogg-URL | `/blogg/stod-utan-konto-online` → `/chatta-anonymt` |
| `src/hooks.server.ts` | Canonical host-redirect | `mittpsyke.se` → `www.mittpsyke.se`, vilket även gäller denna URL |

Detta avsnitt avser explicita repository-träffar för målet `/chatta-anonymt`; det räknar inte externa backlinks eller länkar som kan komma från CMS-innehåll utanför repositoryt.

## Change guard

Vid framtida ändringar som berör `/chatta-anonymt` ska följande jämföras mot denna snapshot före release:

- title, description, canonical, robots och sitemap-post;
- rubrikhierarki, ingress, CTA:er och akut-/vårdhänvisningar;
- FAQ-frågor, FAQPage-schema samt global Organization/WebApplication-data;
- sidans egna interna länkar, redirects och relevanta inkommande länkar;
- ärvda och sidunika sociala metadata, inklusive om dubblettmönstret ändras.

Denna fil är en baseline, inte ett beslut om vilka signaler som bör ändras.
