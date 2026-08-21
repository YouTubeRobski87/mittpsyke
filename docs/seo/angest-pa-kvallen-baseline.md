# SEO-baseline: `/guider/angest/angest-pa-kvallen`

**Snapshotdatum:** 2026-08-21  
**Gren:** `main`  
**HEAD:** `beffb0d0c6ab496139f57a7bf8857febb79241a3`  
**Live-URL:** `https://www.mittpsyke.se/guider/angest/angest-pa-kvallen`

## Syfte och avgränsning

Detta dokument fryser det nuvarande, kända SEO-läget för sidan före framtida SEO- eller innehållsarbete. Sidan visar stark organisk tillväxt enligt de manuellt noterade Search Console-värdena nedan. Snapshoten är en jämförelsepunkt, inte en teknisk spärr eller en optimeringsplan.

Underlaget består av källinventering i repositoryt och kontroll av den live-renderade produktionssidan, `robots.txt` och sitemap den 2026-08-21. Live-sidan är referensen för det som kan crawlas. Vid inventeringen stämde repositoryts förväntade innehåll, metadata och schema med live-renderingen; ingen skillnad behövde dokumenteras.

Endast denna dokumentationsfil har skapats. Ingen produktionskod, SEO-metadata, copy, internlänk, schema eller redirect har ändrats.

## Implementation

| Del | Nuvarande källa/ansvar |
| --- | --- |
| Dynamisk route | `src/routes/guider/[pillar]/[guide]/+page.svelte` |
| Route-load och 404-/redirecthantering | `src/routes/guider/[pillar]/[guide]/+page.ts` |
| Guidekonfiguration, copy, metadata, FAQ, källor och relaterade guider | `src/lib/seo-kit/content.ts`, guide med `pillarSlug: 'angest'` och `slug: 'angest-pa-kvallen'` |
| Canonical | `src/lib/components/SEO.svelte` |
| Title, description, robots och sidunika OG-/Twitter-taggar | `src/lib/components/SeoHead.svelte` |
| Brödsmuleschema | `src/lib/components/BreadcrumbSchema.svelte` |
| Nästa-steg-kort | `src/lib/components/GuideActionCta.svelte` |
| Käll-/kvalitetsblock | `src/lib/components/ContentTrustBlock.svelte` |
| Gemensam head, Organization/WebApplication-schema och global navigation/footer | `src/routes/+layout.svelte` |
| `robots.txt` | `src/routes/robots.txt/+server.ts` |
| Sitemap | `src/routes/sitemap.xml/+server.ts`, dynamiskt från `guides` |
| Host- och äldre guide-redirects | `src/hooks.server.ts` |

Routen hämtar guide och ämnespelare med `getGuideBySlugs`. För den här URL:en är `nextStepTool` `4-7-8-andning`; `publishedAt` saknas i guideobjektet och mallen använder då fallbackdatumet `2026-03-21`. `updatedAt` är `2026-03-31`.

## Live- och indexeringssnapshot

| Kontroll | Observerat läge |
| --- | --- |
| HTTP-svar för canonical URL | `200 OK` |
| Final destination | `https://www.mittpsyke.se/guider/angest/angest-pa-kvallen` |
| Canonical i live-HTML | `https://www.mittpsyke.se/guider/angest/angest-pa-kvallen` |
| Canonical-taggar | 1 |
| Title-taggar | 1 |
| Description-taggar efter serverns dubblettstädning | 1 |
| Robots-meta | `index, follow` |
| `X-Robots-Tag` | Saknas i live-svaret |
| `robots.txt` | `User-agent: *`, `Allow: /`; sitemap pekar på `https://www.mittpsyke.se/sitemap.xml` |
| Sitemap | URL:en finns med: `lastmod` `2026-03-31`, `changefreq` `monthly`, `priority` `0.7` |
| Apex-variant | `https://mittpsyke.se/guider/angest/angest-pa-kvallen` → `301` till canonical host |
| Variant med avslutande snedstreck | `/guider/angest/angest-pa-kvallen/` → `308` till URL utan snedstreck |
| Äldre guider-URL | `/guider-seo/angest/angest-pa-kvallen` → `301` till nuvarande URL |

## Metadata

| Fält | Exakt värde |
| --- | --- |
| Title | `Kvällsångest: varför får jag ångest på kvällen? | MittPsyke` |
| Meta description | `Kvällsångest och ångest på kvällen är vanligt. Förstå varför det ofta blir värre när det blir tyst, hur nattlig oro påverkar sömnen och vad som kan hjälpa i stunden.` |
| Canonical | `https://www.mittpsyke.se/guider/angest/angest-pa-kvallen` |
| `hreflang` | `sv` till `https://www.mittpsyke.se/guider/angest/angest-pa-kvallen` |
| Robots | `index, follow` |
| Publiceringsinformation i innehållet | `Publicerad: 2026-03-21`; `Senast uppdaterad: 2026-03-31`; `Författare: MittPsyke` |

## Rubrikstruktur i DOM-ordning

Avser sidans innehåll inklusive delade komponenter för nästa steg och källor. Global navigation/footer ingår inte.

1. `h1`: `Kvällsångest – varför får jag ångest på kvällen?`
2. `h2`: `När det blir tyst hörs tankarna mer`
3. `h2`: `Kroppen kan vara trött men ändå uppe i varv`
4. `h2`: `Grubblande får mer plats på kvällen`
5. `h2`: `Ensamhet och känslor kan kännas starkare på kvällen`
6. `h2`: `Oro inför sömn, natten eller nästa dag kan trigga ångest`
7. `h2`: `Vad kan hjälpa när kvällsångesten kommer?`
8. `h2`: `När kan det vara bra att söka mer stöd?`
9. `h2`: `Du behöver inte bära kvällen helt själv`
10. `h2`: `Vanliga frågor`
11. `h2`: `Relaterade guider`
12. `h2`: `Nästa steg vid ångest`
13. `h3`: `Chatta anonymt nu`
14. `h3`: `Skriv i dagboken`
15. `h3`: `Gör en enkel övning`
16. `h3`: `Hitta rätt stödlinje`
17. `h2`: `Börja på huvudsidan för ämnet`
18. `h2`: `Källor och kvalitet`
19. `h3`: `Referenser`

FAQ-frågorna renderas som fet text i listobjekt, inte som `h3`.

## Huvudsakligt synligt innehåll

**Ingress**

> Många upplever kvällsångest och oro på kvällen. Här går vi igenom vanliga orsaker, lugn hjälp i stunden och kopplingen till sömn och nattlig oro.

**Öppning av brödtexten**

> Många märker att ångest, oro eller inre stress blir starkare just på kvällen. När dagen saktar ner blir det ofta mindre som distraherar, och då kan tankar, känslor och kroppslig spänning komma ikapp. Det betyder inte att något är fel på dig. För många är kvällsångest en reaktion på stress, trötthet, grubblande eller att kroppen först då får utrymme att känna efter.

Den inledande punktlistan har rubriken `Därför kan ångest kännas värre på kvällen:` och punkterna:

- `det blir tystare omkring dig`
- `kroppen är trött efter dagen`
- `stress och spänning hinner ikapp`
- `grubblande får mer plats`
- `ensamhet eller oro inför nästa dag blir tydligare`

Huvudtexten följer rubrikordningen ovan och täcker: färre distraktioner när kvällen blir tyst, att kroppen kan vara trött men uppvarvad, ältande och kontrolltänkande, ensamhet/tomhet, sömn- och morgonoro, samt när mer stöd kan vara lämpligt.

I avsnittet `Vad kan hjälpa när kvällsångesten kommer?` finns följande konkreta punkter:

- `Sänk kraven på kvällen.`
- `Skriv av dig i några minuter.`
- `Minska input en stund.`
- `Prova en enkel andningsövning.` med 4-7-8-andning: in 4 sekunder, håll 7, ut 8.
- `Kort guidad nedvarvning eller meditation.`
- `Påminn dig om att känslan kan vara tillfällig.`

Avslutande synlig copy före FAQ:

> Kvällsångest är vanligt. Det betyder inte att du är svag eller att något är trasigt. Det är en reaktion som många delar, och det finns sätt att möta den som inte kräver stora insatser. Börja med det som känns möjligt, i din egen takt.

> När det snurrar mycket på kvällen kan det hjälpa att skriva av sig. Börja lugnt och anonymt, i din egen takt.

## Strukturerad data

Fem JSON-LD-block observerades live:

| Typ | Källa | Viktiga egenskaper |
| --- | --- | --- |
| `Organization` | Gemensam layout | MittPsyke, webbplats, e-post, logo, grundare, Sverige och organisationsidentifierare |
| `WebApplication` | Gemensam layout | MittPsyke, svenskspråkig `HealthApplication`, kostnadsfritt erbjudande |
| `WebPage` | Guide-routen | `headline`, description, canonical URL, publisher `Organization` och `inLanguage: sv-SE` |
| `FAQPage` | Guide-routen | Sex FAQ-frågor och svar från guidekonfigurationen |
| `BreadcrumbList` | `BreadcrumbSchema.svelte` | Hem → Guider → Ångest → aktuell guide, med positionerna 1–4 |

### FAQPage: exakta frågor och svar

| Fråga | Svar |
| --- | --- |
| `Är det vanligt att få ångest på kvällen?` | `Ja, mycket vanligt. När dagens intryck avtar får tankar och känslor mer utrymme, vilket gör att ångest ofta blir tydligare på kvällen.` |
| `Varför känns ångest värre när jag ska sova?` | `Kroppen och hjärnan har färre distraktioner att hålla sig sysselsatta med. Dessutom kan oron för att inte somna i sig skapa mer anspänning.` |
| `Kan trötthet göra ångest värre?` | `Ja. När kroppen är trött blir nervsystemet ofta mer känsligt, och det kan bli svårare att hantera oro och stress.` |
| `Hjälper meditation mot kvällsångest?` | `För många kan kort meditation eller guidad nedvarvning hjälpa kroppen att varva ner. Det behöver inte vara långt – redan fem minuter kan göra skillnad.` |
| `Varför kan dödsångest kännas starkare på kvällen?` | `När det blir tyst och du är trött får existentiella tankar ofta mer utrymme. Det betyder inte att du är i fara, men det kan kännas väldigt starkt i stunden.` |
| `När bör jag söka hjälp för kvällsångest?` | `Om ångesten kommer ofta, påverkar sömn eller vardag mycket eller känns svår att hantera på egen hand, kan det vara klokt att kontakta din vårdcentral eller en psykolog.` |

## Sociala metadata

Live-HTML innehåller både ärvda metadata från layouten och sidans metadata från `SeoHead`. Dubbletter observerades för `og:title`, `og:description`, `og:url`, `og:type`, `twitter:card`, `twitter:title` och `twitter:description`.

| Fält | Ärvt värde | Sidans specifika värde |
| --- | --- | --- |
| `og:title` / `twitter:title` | `MittPsyke – Psykiskt stöd online` | `Kvällsångest: varför får jag ångest på kvällen? | MittPsyke` |
| `og:description` / `twitter:description` | Samma text som sidans meta description | Samma text som sidans meta description |
| `og:url` | `https://www.mittpsyke.se/guider/angest/angest-pa-kvallen` | Samma värde |
| `og:type` | `website` | `website` |
| `twitter:card` | `summary_large_image` | `summary_large_image` |

Gemensam layout sätter också `og:site_name` = `MittPsyke`, `og:image` = `https://www.mittpsyke.se/og-image.png` och `twitter:image` = `https://www.mittpsyke.se/og-image.png`.

## Viktiga utgående interna länkar

| Mål | Ankartext / placering |
| --- | --- |
| `/guider` | `Guider` i brödsmulan |
| `/guider/angest` | `Ångest` i brödsmulan och `Se alla guider inom ångest` |
| `/guider/angest/angest-och-somn` | `Ångest och sömn – varför natten kan bli svårare` |
| `/guider/angest/hjalp-vid-oro-pa-kvallen` | `Hjälp vid oro på kvällen – vad du kan göra just nu` |
| `/guider/angest/orostankar` | `Orostankar som snurrar – när hjärnan inte kan stänga av` |
| `/guider/angest/vaknar-med-angest` | `Vaknar med ångest – när morgonen börjar tungt` |
| `/guider/sovproblem/stress-och-somn` | `Stress och sömn – när kroppen inte kan varva ner` |
| `/chat/angest` | Kortet `Chatta anonymt nu` |
| `/dagbok` | Kortet `Skriv i dagboken` |
| `/ovningar/4-7-8-andning` | Kortet `Gör en enkel övning` / `Prova: 4-7-8 andning` |
| `/angest` | `Gå till översiktssidan om ångest` |
| `/ansvar` | `ansvarsinfo` i käll-/kvalitetsblocket |
| `/integritet` | `integritetspolicyn` i käll-/kvalitetsblocket |
| `/sa-arbetar-vi-med-innehall` | `Läs mer om hur vi arbetar med innehåll` |

Gemensam navigation och footer tillför dessutom de generella interna målen för exempelvis start, guider, chat, dagbok, övningar, artiklar, berättelser, om-sidor, policyer och sök.

## Viktiga repository-kontrollerade inkommande länkar

| Källa | Nuvarande koppling |
| --- | --- |
| `/guider/angest` | Den dynamiska ämnessidan renderar hela listan från `getGuidesForPillar('angest')`; denna guide finns i listan med sin titel och URL. |
| `/guider/angest/angest-och-somn` | Relaterad guide med titeln `Kvällsångest – varför får jag ångest på kvällen?` till denna URL. |
| `/guider/angest/hjalp-vid-oro-pa-kvallen` | Relaterad guide med ankartexten `Ångest på kvällen – varför det ökar när dagen tar slut`. |
| `/guider/angest/nar-tankarna-inte-stannar` | Relaterad guide med samma ankartext. |
| `/guider/stress/tecken-pa-mental-overbelastning` | Relaterad guide med samma ankartext. |
| `/guider/sovproblem/nattlig-oro` | Relaterad guide med samma ankartext. |
| `/blogg/kvallasangest` | Direktlänk med texten `fördjupade guide om ångest på kvällen`. |
| `/guider-seo/angest/angest-pa-kvallen` | Äldre URL redirectar `301` till denna URL. |

De data-drivna guideinterna länkarna kommer från `src/lib/seo-kit/content.ts`; den direkta blogglänken finns i `src/routes/blogg/kvallasangest/+page.svelte`.

## Google Search Console baseline

Följande siffror är manuellt observerade i Google Search Console och finns inte att härleda från repositoryt. De är en historisk jämförelsepunkt; ingen kausalitet mellan enskilda SEO-element och utvecklingen ska utläsas ur dem.

### Periodjämförelse

| Period | Klick | Visningar | CTR | Genomsnittlig position |
| --- | ---: | ---: | ---: | ---: |
| Senaste 3 månader | 57 | 2,89 k | 2,0 % | 11,1 |
| Föregående 3 månader | 5 | 397 | 1,3 % | 15,9 |

### Observerade viktiga sökfrågor

| Sökfråga | Klick | Visningar | CTR | Genomsnittlig position |
| --- | ---: | ---: | ---: | ---: |
| `ångest på kvällen` | 9 | 182 | 4,9 % | 6,6 |
| `varför kommer ångest på kvällen` | 5 | 74 | 6,8 % | 7,6 |
| `kvällsångest` | 4 | 137 | 2,9 % | 6,0 |
| `dödsångest på kvällen` | 4 | 50 | 8,0 % | 10,5 |
| `varför får jag ångest på kvällen` | 1 | 40 | 2,5 % | 6,3 |

Sekundära sökfrågor med aktuella visningar omfattar: `ångest på natten`, `varför får man ångest`, `ångest på morgonen`, `ångest vid insomning` och `vaknar med ångest`.

## Change guard

Den här sidan är en känd SEO-baseline. Framtida arbete får ändra sidan, men varje ändring av viktiga SEO-signaler ska först jämföras med denna snapshot och följas upp efter publicering.

Behandla särskilt ändringar av följande som potentiellt högpåverkande:

- URL och redirects;
- title, meta description och canonical;
- indexerbarhet och sitemap;
- H1 och copy som svarar på sidans primära sökintention;
- FAQ-innehåll och FAQPage-/övrig strukturerad data;
- större interna länkar, både från och till sidan.

Regeln är: **BASELINE FIRST → CHANGE SECOND → MEASURE AFTERWARD.**

Det betyder inte att dessa delar aldrig får ändras. Syftet är kontrollerad iteration, inte permanent bevarande.
