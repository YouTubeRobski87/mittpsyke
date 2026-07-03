# Teknisk mätning av mittpsyke.se

Mätt: 2026-07-03 07:56 CEST  
Rådata: `docs/mittpsyke-public-technical-measurement-2026-07-03.json`  
Mät-script: `scripts/measure-public-site.mjs`

## Omfattning och metod

Mätta publika sidor:

- `/`
- `/chatta-anonymt`
- `/dagbok`
- `/integritet`
- `/feedback`

Alla input-URL:er på `https://mittpsyke.se/...` redirectade till `https://www.mittpsyke.se/...`. Tabellen nedan mäter final-URL:erna.

Metod:

- Browser: Google Chrome via Playwright/Chromium CDP.
- Viewport: mobil, `390 x 844`, device scale factor `3`, iPhone-lik user agent.
- Nätverk: ingen artificiell throttling.
- Cold cache: ny browser context per sida.
- Warm cache: andra navigeringen till samma sida i samma browser context.
- Tider: Navigation Timing API.
- Requests och överförd storlek: Chrome DevTools `Network.loadingFinished.encodedDataLength`.

## Sammanfattning

Bra:

- Alla final-sidor svarade `200 OK`.
- Inga misslyckade requests i mätningen.
- Warm cache fungerar tydligt: nästan alla resurser hämtas från browser-cache och total överföring går ner till ungefär `0.2-0.5 KiB`.
- Säkerhetsheaders finns på final-sidorna.
- Ingen service worker är aktiv eller registrerad.
- Startsidan hanterar bilder rimligt i mobilvy: hero-bild över fold är inte lazy-loadad och har `fetchpriority="high"`, medan bilden långt under fold är lazy-loadad.

Viktigast att åtgärda:

- Apex-redirecten `https://mittpsyke.se/` till `https://www.mittpsyke.se/` saknar säkerhetsheaders, inklusive HSTS. Final-sidorna har HSTS, men HSTS på `www` skyddar inte automatiskt apex-domänen.
- HTML-dokument, fonter, bilder och favicons saknar explicit `Cache-Control` och `Expires`. Det fungerar ändå bra i warm cache via ETag/heuristik, men policyn är otydlig.
- Fontpayloaden dominerar cold load. De åtta största resurserna är fontfiler, totalt cirka `563 KiB` över de mätta sidornas största varianter.
- Antalet JS-requests är högt, cirka `39-42` script per sida. Byte-storleken är inte stor, men request-grafen är splittrad.
- CSP är på plats, men tillåter `unsafe-inline` för både script och style. Det är inte akut, men är en framtida hårdning.

## Mätvärden per sida

| Sida | Cache | TTFB | DOM Interactive | DOMContentLoaded | Load | Requests | Överfört | Cacheträffar | Fel |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | cold | 230 ms | 481 ms | 481 ms | 637 ms | 56 | 674.2 KiB | 0 | 0 |
| `/` | warm | 11 ms | 163 ms | 163 ms | 234 ms | 56 | 0.4 KiB | 55 | 0 |
| `/chatta-anonymt` | cold | 130 ms | 507 ms | 507 ms | 591 ms | 56 | 555.6 KiB | 0 | 0 |
| `/chatta-anonymt` | warm | 33 ms | 124 ms | 124 ms | 184 ms | 56 | 0.2 KiB | 55 | 0 |
| `/dagbok` | cold | 177 ms | 337 ms | 337 ms | 419 ms | 58 | 545.4 KiB | 0 | 0 |
| `/dagbok` | warm | 11 ms | 128 ms | 128 ms | 177 ms | 58 | 0.5 KiB | 57 | 0 |
| `/integritet` | cold | 184 ms | 438 ms | 438 ms | 528 ms | 54 | 613.8 KiB | 0 | 0 |
| `/integritet` | warm | 40 ms | 141 ms | 141 ms | 205 ms | 54 | 0.2 KiB | 53 | 0 |
| `/feedback` | cold | 271 ms | 412 ms | 412 ms | 494 ms | 51 | 393.7 KiB | 0 | 0 |
| `/feedback` | warm | 37 ms | 113 ms | 113 ms | 165 ms | 51 | 0.2 KiB | 50 | 0 |

## Dokumentheaders

| Sida | Final URL | Cache-Control | ETag | Expires | Content-Encoding |
|---|---|---|---|---|---|
| `/` | `https://www.mittpsyke.se/` | - | `"nmoe47"` | - | `br` |
| `/chatta-anonymt` | `https://www.mittpsyke.se/chatta-anonymt` | - | `"1y653hw"` | - | `br` |
| `/dagbok` | `https://www.mittpsyke.se/dagbok` | - | `"wr17cq"` | - | `br` |
| `/integritet` | `https://www.mittpsyke.se/integritet` | - | `"14vencw"` | - | `br` |
| `/feedback` | `https://www.mittpsyke.se/feedback` | - | `"1y9dnmm"` | - | `br` |

## Säkerhetsheaders

Final-sidorna har samma säkerhetsheaders:

| Header | Status | Värde / notering |
|---|---|---|
| `Strict-Transport-Security` | Finns | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | Finns | `default-src 'self'`; tillåter utpekade analytics/Supabase/Soro-källor; `frame-src 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`; tillåter även `unsafe-inline` för script och style. Fullt värde finns i rådatafilen. |
| `X-Frame-Options` | Finns | `DENY` |
| `Permissions-Policy` | Finns | `camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()` |
| `Referrer-Policy` | Finns | `strict-origin-when-cross-origin` |
| `X-Content-Type-Options` | Finns | `nosniff` |

Separat kontroll av `https://mittpsyke.se/` utan redirect-follow visade `301 Moved Permanently` till `https://www.mittpsyke.se/`, men redirect-svaret saknade säkerhetsheaders. Rekommendation: sätt åtminstone HSTS på apex-redirecten också.

## Service worker

| Sida | Service worker-stöd | Controller | Registreringar |
|---|---:|---:|---:|
| `/` | Ja | Nej | 0 |
| `/chatta-anonymt` | Ja | Nej | 0 |
| `/dagbok` | Ja | Nej | 0 |
| `/integritet` | Ja | Nej | 0 |
| `/feedback` | Ja | Nej | 0 |

Ingen service worker används i den publika mätningen.

## Bildkontroll över/under fold

| Sida | `<img>` totalt | Över fold | Under fold | Lazy över fold | Ej lazy under fold | CSS-bakgrundsbilder |
|---|---:|---:|---:|---:|---:|---:|
| `/` | 2 | 1 | 1 | 0 | 0 | 0 |
| `/chatta-anonymt` | 0 | 0 | 0 | 0 | 0 | 0 |
| `/dagbok` | 0 | 0 | 0 | 0 | 0 | 0 |
| `/integritet` | 0 | 0 | 0 | 0 | 0 | 0 |
| `/feedback` | 0 | 0 | 0 | 0 | 0 | 0 |

Startsidan:

- Över fold: `/assets/home/MittpsykeTree-1200.avif`, `390 x 213`, `fetchpriority="high"`, inte lazy-loadad.
- Under fold: `/assets/home/Tryggplats.webp`, top cirka `5526 px`, `loading="lazy"`.

## Topp 20 största resurser

Storlek avser största cold-cache överföring för resursen i mätningen.

| # | Resurs | Typ | Sidor | Storlek | Cache-Control | ETag | Expires | Content-Encoding |
|---:|---|---|---|---:|---|---|---|---|
| 1 | `/assets/recursive/fonts/recursive-t/RecursiveT-RegularItalic.woff2` | Font | `/` | 73.4 KiB | - | `W/"74856-1783045154000"` | - | - |
| 2 | `/assets/recursive/fonts/recursive-h/RecursiveH-SemiBold.woff2` | Font | `/`, `/chatta-anonymt`, `/dagbok`, `/integritet` | 73.3 KiB | - | `W/"74684-1783045154000"` | - | - |
| 3 | `/assets/recursive/fonts/recursive-h/RecursiveH-Bold.woff2` | Font | `/`, `/chatta-anonymt`, `/dagbok`, `/integritet`, `/feedback` | 73.1 KiB | - | `W/"74544-1783045154000"` | - | - |
| 4 | `/assets/recursive/fonts/recursive-h/RecursiveH-Heavy.woff2` | Font | `/`, `/chatta-anonymt`, `/dagbok`, `/integritet` | 72.9 KiB | - | `W/"74316-1783045154000"` | - | - |
| 5 | `/assets/recursive/fonts/recursive-t/RecursiveT-SemiBold.woff2` | Font | `/chatta-anonymt`, `/integritet`, `/feedback` | 67.9 KiB | - | `W/"69204-1783045154000"` | - | - |
| 6 | `/assets/recursive/fonts/recursive-h/RecursiveH-ExtraBold.woff2` | Font | `/`, `/chatta-anonymt`, `/dagbok`, `/integritet`, `/feedback` | 67.7 KiB | - | `W/"69032-1783045154000"` | - | - |
| 7 | `/assets/recursive/fonts/recursive-t/RecursiveT-Bold.woff2` | Font | `/`, `/dagbok`, `/integritet` | 67.6 KiB | - | `W/"68876-1783045154000"` | - | - |
| 8 | `/assets/recursive/fonts/recursive-t/RecursiveT-Regular.woff2` | Font | `/`, `/chatta-anonymt`, `/dagbok`, `/integritet`, `/feedback` | 67.3 KiB | - | `W/"68588-1783045154000"` | - | - |
| 9 | `/assets/home/MittpsykeTree-1200.avif` | Image | `/` | 51.5 KiB | - | `W/"52544-1783045154000"` | - | - |
| 10 | `/_app/immutable/chunks/hLyb0bBI.js` | Script | `/chatta-anonymt` | 15.5 KiB | `public,max-age=31536000,immutable` | `W/"15699-1783045157000"` | - | `br` |
| 11 | `/favicon.ico` | Other | alla mätta sidor | 13.5 KiB | - | `W/"13613-1783045154000"` | - | - |
| 12 | `/_app/immutable/chunks/DDPM_Ro9.js` | Script | alla mätta sidor | 12.6 KiB | `public,max-age=31536000,immutable` | `W/"12704-1783045156000"` | - | `br` |
| 13 | `/integritet` | Document | `/integritet` | 12.3 KiB | - | `"14vencw"` | - | `br` |
| 14 | `/_app/immutable/assets/0.BiBta8Wg.css` | Stylesheet | alla mätta sidor | 12.2 KiB | `public,max-age=31536000,immutable` | `W/"12249-1783045157000"` | - | `br` |
| 15 | `/_app/immutable/chunks/DpgXi-ju.js` | Script | alla mätta sidor | 11.3 KiB | `public,max-age=31536000,immutable` | `W/"11493-1783045156000"` | - | `br` |
| 16 | `/` | Document | `/` | 11.2 KiB | - | `"nmoe47"` | - | `br` |
| 17 | `/chatta-anonymt` | Document | `/chatta-anonymt` | 9.7 KiB | - | `"1y653hw"` | - | `br` |
| 18 | `/_app/immutable/nodes/0.BTLOb3xx.js` | Script | alla mätta sidor | 9.2 KiB | `public,max-age=31536000,immutable` | `W/"9236-1783045156000"` | - | `br` |
| 19 | `/dagbok` | Document | `/dagbok` | 8.6 KiB | - | `"wr17cq"` | - | `br` |
| 20 | `/favicon.png` | Other | alla mätta sidor | 8.4 KiB | - | `W/"8366-1783045154000"` | - | - |

## Övriga observationer

- En extern tredjepartsresurs laddas på varje sida: `https://analytics.ahrefs.com/analytics.js`, cirka `3.0 KiB`, `Cache-Control: max-age=14400`, `Content-Encoding: gzip`.
- `/_app/immutable/...` har bra lång cachepolicy: `public,max-age=31536000,immutable`.
- Statiska assets utanför `/_app/immutable`, särskilt `/assets/recursive/fonts/...`, `/assets/home/...` och favicons, saknar `Cache-Control`.
- Cloudflare syns som edge/server i svaren, men final-sidornas HTML har `cf-cache-status: DYNAMIC`.

## Rekommenderade åtgärder

1. Lägg säkerhetsheaders på apex-redirecten.
   - Prioritet: hög.
   - Sätt åtminstone `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` även på `https://mittpsyke.se/*` 301-svar.
   - Om Cloudflare används för redirecten, gör detta i edge-regel/transform rule så redirect-svaret får headern innan browsern landar på `www`.

2. Sätt tydlig cachepolicy för statiska assets.
   - Prioritet: hög.
   - För content-hashade eller versionssatta fonter/bilder/favicons: `Cache-Control: public, max-age=31536000, immutable`.
   - Om filnamn kan återanvändas vid innehållsändring: börja hellre med `Cache-Control: public, max-age=604800, must-revalidate` eller byt till versionssatta filnamn innan ett års immutable-cache sätts.

3. Sätt avsiktlig cachepolicy för HTML-dokument.
   - Prioritet: medel.
   - För publika, icke användarspecifika sidor kan en edge-policy övervägas, exempelvis `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`.
   - Kontrollera först att sidorna inte varierar på användarspecifik data, cookies eller integritetskänslig state.

4. Minska fontpayloaden.
   - Prioritet: medel.
   - Gå igenom använda typsnittsvikter och stilar. De åtta största resurserna är fontfiler.
   - Överväg subsetting, färre vikter, eller en mer begränsad variabel-fontstrategi.
   - Säkerställ `font-display: swap` eller motsvarande i fontdefinitionerna.

5. Granska JS-requestgrafen.
   - Prioritet: låg till medel.
   - Varje sida laddar cirka `39-42` script. Byte-storleken är liten, men många modulpreloads kan öka overhead på mobilnät.
   - Kör en bundle-analys och kontrollera om gemensamma komponenter eller route-importer drar in onödiga chunks på publika sidor.

6. Härda CSP stegvis.
   - Prioritet: låg till medel.
   - Nuvarande CSP är bra strukturerad, men `unsafe-inline` bör på sikt ersättas med nonce eller hash där det är praktiskt möjligt.
   - Börja med `Content-Security-Policy-Report-Only` vid förändringar för att undvika att bryta produktionsflöden.

7. Kontrollera tredjepartsanalys mot integritetscopy och samtyckesflöde.
   - Prioritet: medel.
   - `analytics.ahrefs.com/analytics.js` laddas på alla mätta sidor.
   - Tekniskt liten påverkan, men integritets- och samtyckesmässigt bör det stämmas av mot faktisk implementation och publika policytexter.

## Slutsats

Prestandan är i grunden god i den här mätningen, särskilt warm cache. Den största praktiska vinsten ligger inte i akuta renderingstider utan i tydligare cacheheaders, apex-HSTS och minskad fontvikt. Säkerhetsnivån på final-sidorna är bra, men redirect-svaret på apex-domänen bör få samma omsorg.
