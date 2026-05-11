# SEO-/IA-kartläggning av hubbar och stödjande sidor

Syfte: identifiera vilken sida som bör vara huvudhubb per tema, vilka sidor som bör vara stödjande long-tail/artiklar/guider och var det finns risk för överlapp eller kannibalisering. Detta är en kartläggning. Ingen route, canonical, metadata eller kod ändras i detta steg.

## 1. Principer för hubbstruktur

1. En huvudhubb ska svara på den bredaste sökintentionen för temat och fungera som internlänkad samlingspunkt.
2. Stödjande landningssidor ska behållas när de har tydlig long-tail-intention, till exempel "hjälp vid X online", "övningar mot X" eller "chatta anonymt".
3. Guide-pillars under `/guider/{tema}` bör vara fördjupande informationshubbar och länka tydligt till den publika översiktssidan när en sådan finns.
4. Guideartiklar under `/guider/{tema}/{artikel}` bör länka upp till både relevant huvudhubb och guide-pillar.
5. Övningar under `/ovningar/{tool}` bör vara åtgärdsnära stöd och länka till relevant hubb, inte konkurrera med hubben.
6. Bloggartiklar bör vara stödjande förklaringar och person-/produktnära fördjupning, inte primära hubbar.
7. Sidor som redan får Search Console-data bör inte slås ihop, noindexas eller få canonical-ändringar utan separat analys.

## 2. Huvudteman

### 2.1 Ångest

1. Rekommenderad huvudsida/hubb: `/angest`
2. Stödjande sidor:
   - `/hjalp-vid-angest-online`
   - `/ovningar-mot-angest-online`
   - `/andningsovningar-mot-angest`
   - `/exponering-ovningar-mot-angest`
   - `/4-7-8-andning-ovning`
   - `/chat/a`
3. Guidesidor:
   - `/guider/angest`
   - `/guider/angest/tecken`
   - `/guider/angest/panikangest-och-kroppen`
   - `/guider/angest/orostankar`
   - `/guider/angest/angest-och-somn`
   - `/guider/angest/angest-hjalp`
   - `/guider/angest/panikattack-hjalp`
   - `/guider/angest/angest-pa-kvallen`
   - `/guider/angest/hjalp-vid-oro-pa-kvallen`
   - `/guider/angest/vaknar-med-angest`
   - `/guider/angest/oro-i-kroppen`
   - `/guider/angest/lugna-en-panikattack`
   - `/guider/angest/angest-i-kroppen`
   - `/guider/angest/overtankande-hjalp`
   - `/guider/angest/nar-tankarna-inte-stannar`
4. Övningar:
   - `/ovningar/grounding-5-4-3-2-1`
   - `/ovningar/4-7-8-andning`
   - `/ovningar/cbt-katastroftankar`
   - `/ovningar/katastrofgranskning`
5. Bloggartiklar:
   - `/blogg/ai-hjalper-dig-bearbeta-kanslor` kan stödja AI/reflektion kopplat till ångest men är inte ångesthubb.
6. Överlapp/kannibaliseringsrisk:
   - Hög risk mellan `/angest`, `/hjalp-vid-angest-online`, `/guider/angest` och `/guider/angest/angest-hjalp`.
   - Flera artiklar täcker oro/kväll/tankar inom ångest och kan överlappa med `/oro` och `/guider/overtankande`.
   - `/panikattack` och panikrelaterade ångestguider bör ha tydlig rollfördelning.
7. Internlänkningsprincip:
   - Alla ångest-guider, ångestövningar och long-tail-sidor bör länka till `/angest` som bred översikt.
   - `/angest` bör länka till `/guider/angest` som fördjupningsindex, och till 3-5 prioriterade long-tail-sidor.
   - `/hjalp-vid-angest-online` bör vara "hjälp online/kom igång"-intention, inte allmän ångestdefinition.

### 2.2 Oro

1. Rekommenderad huvudsida/hubb: `/oro`
2. Stödjande sidor:
   - `/hjalp-mot-oro-online`
   - `/chat/e`
   - `/dagbok`
3. Guidesidor:
   - `/guider/overtankande`
   - `/guider/overtankande/varfor-hjarnan-fastnar-i-loopar`
   - `/guider/overtankande/sluta-overtanka-pa-kvallen`
   - `/guider/overtankande/skillnaden-mellan-oro-och-altande`
   - `/guider/overtankande/mindfulness-mot-overtankande`
   - `/guider/overtankande/nar-overtankande-blir-ett-problem`
   - `/guider/angest/orostankar`
   - `/guider/angest/hjalp-vid-oro-pa-kvallen`
4. Övningar:
   - `/ovningar/sju-fragor-vid-oro`
   - `/ovningar/tankefallor-kartlaggning`
   - `/ovningar/cbt-katastroftankar`
   - `/ovningar/body-scan`
5. Bloggartiklar:
   - Ingen tydlig lokal bloggpost med oro som primär intention identifierad.
6. Överlapp/kannibaliseringsrisk:
   - Medium-hög risk mellan `/oro`, `/hjalp-mot-oro-online`, `/guider/overtankande` och ångestsidor med "oro" i title/H1.
   - `/guider/angest/orostankar` bör vara ångestnära oro, medan `/guider/overtankande/...` bör äga ältande/grubbel.
7. Internlänkningsprincip:
   - `/oro` bör vara bred hubb för oro/ältande.
   - `/hjalp-mot-oro-online` bör vara stödjande long-tail för "hjälp mot oro online".
   - Övertänkande-guider bör länka upp till `/oro`, inte bara till `/guider/overtankande`.

### 2.3 Stress

1. Rekommenderad huvudsida/hubb: `/stress`
2. Stödjande sidor:
   - `/stod-vid-stress-online`
   - `/chat/e`
   - `/dagbok`
   - `/framsteg`
3. Guidesidor:
   - `/guider/stress`
   - `/guider/stress/stressymtom`
   - `/guider/stress/inre-stress`
   - `/guider/stress/stressad-hela-tiden`
   - `/guider/stress/utmattad-mentalt`
   - `/guider/stress/kan-inte-varva-ner`
   - `/guider/stress/tecken-pa-mental-overbelastning`
   - `/guider/stress/grounding-ovning-vid-stress`
   - `/guider/stress/varfor-orkar-jag-ingenting`
   - `/guider/stress/hur-aterhamtar-man-sig-mentalt`
4. Övningar:
   - `/ovningar/daglig-reflektionsmall`
   - `/ovningar/dagens-avslut-reflektion`
   - `/ovningar/tacksamhetsovning`
   - `/ovningar/body-scan`
5. Bloggartiklar:
   - `/blogg/kbt-dagbok-vs-fri-journalforing` kan stödja skrivande/struktur vid stress, men är inte stresshubb.
6. Överlapp/kannibaliseringsrisk:
   - Medium risk mellan `/stress`, `/stod-vid-stress-online` och `/guider/stress`.
   - Det finns historisk planering för `/guider/stress-utmattning`, men faktisk route redirectar till `/guider/stress`.
7. Internlänkningsprincip:
   - `/stress` bör vara bred tematisk hubb.
   - `/stod-vid-stress-online` bör länka till `/stress` och behålla "online stöd"-intention.
   - Stress/sömn-artiklar bör korslänka till `/sovproblem` när sömnen är primär.

### 2.4 Sömn/sovproblem

1. Rekommenderad huvudsida/hubb: `/sovproblem`
2. Stödjande sidor:
   - `/4-7-8-andning-ovning`
   - `/ovningar`
   - `/dagbok`
3. Guidesidor:
   - `/guider/sovproblem`
   - `/guider/sovproblem/orsaker`
   - `/guider/sovproblem/stress-och-somn`
   - `/guider/sovproblem/altande-pa-kvallen`
   - `/guider/sovproblem/trott-men-uppvarvad`
   - `/guider/sovproblem/somnbrist-och-maendet`
   - `/guider/sovproblem/kan-inte-sova-stress`
   - `/guider/sovproblem/svart-att-somna-angest`
   - `/guider/sovproblem/nattlig-oro`
4. Övningar:
   - `/ovningar/4-7-8-andning`
   - `/ovningar/body-scan`
   - `/ovningar/dagens-avslut-reflektion`
5. Bloggartiklar:
   - Ingen tydlig lokal bloggpost med sömn som primär intention identifierad.
6. Överlapp/kannibaliseringsrisk:
   - Medium risk med stress och oro, särskilt `/guider/sovproblem/stress-och-somn`, `/guider/sovproblem/svart-att-somna-angest` och ångest-/stresshubbar.
7. Internlänkningsprincip:
   - Sömnartiklar där sömn är primär bör länka till `/sovproblem`.
   - Artiklar där stress/ångest är primär men sömn är symptom bör länka sekundärt till `/sovproblem`.

### 2.5 Depression/nedstämdhet

1. Rekommenderad huvudsida/hubb: `/depression`
2. Stödjande sidor:
   - `/nedstamdhet`
   - `/hjalp-vid-depression-online`
   - `/chat/b`
   - `/dagbok`
   - `/framsteg`
3. Guidesidor:
   - `/guider/depression`
   - `/guider/depression/nedstamdhet`
   - `/guider/depression/trotthet-och-meningsloshet`
   - `/guider/depression/nedstamdhet-och-relationer`
   - `/guider/depression/sorg-och-depression`
   - `/guider/depression/sma-steg-vid-nedstamdhet`
4. Övningar:
   - `/ovningar/daglig-reflektionsmall`
   - `/ovningar/tacksamhetsovning`
   - `/ovningar/body-scan`
5. Bloggartiklar:
   - `/blogg/ai-hjalper-dig-bearbeta-kanslor` kan stödja bred känslosortering.
6. Överlapp/kannibaliseringsrisk:
   - Medium-hög risk mellan `/depression`, `/nedstamdhet`, `/hjalp-vid-depression-online` och `/guider/depression/nedstamdhet`.
   - Huvudhubb bör vara `/depression`; `/nedstamdhet` bör vara mildare/oklarare mående och long-tail "samtalsstöd vid nedstämdhet".
7. Internlänkningsprincip:
   - Nedstämdhets- och depressionsguider bör länka till `/depression`.
   - `/nedstamdhet` bör länka till `/depression` för bredare förklaring och till `/hjalp-vid-depression-online` för "hjälp online".

### 2.6 Trauma

1. Rekommenderad huvudsida/hubb: `/trauma`
2. Stödjande sidor:
   - `/stod-vid-ptsd-online`
   - `/samtalsstod-utan-vantetid/samtalsstod-vid-trauma`
   - `/chat/e`
   - `/dagbok`
3. Guidesidor:
   - `/guider/trauma`
   - `/guider/trauma/trygghet`
   - `/guider/trauma/nervsystemet-och-trauma`
   - `/guider/trauma/grounding-ovningar`
   - `/guider/trauma/undvikande-efter-trauma`
   - `/guider/trauma/tillit-efter-trauma`
4. Övningar:
   - `/ovningar/grounding-5-4-3-2-1`
   - `/ovningar/body-scan`
5. Bloggartiklar:
   - Ingen tydlig lokal bloggpost med trauma som primär intention identifierad.
6. Överlapp/kannibaliseringsrisk:
   - Medium risk mellan `/trauma`, `/stod-vid-ptsd-online` och `/samtalsstod-utan-vantetid/samtalsstod-vid-trauma`.
7. Internlänkningsprincip:
   - `/trauma` bör äga bred trauma-intention.
   - PTSD-sidan bör vara specifik och länka tillbaka till `/trauma`.
   - Samtalsstödsidan bör äga "samtalsstöd vid trauma"-intention.

### 2.7 Ensamhet

1. Rekommenderad huvudsida/hubb: `/ensamhet`
2. Stödjande sidor:
   - `/chat/b`
   - `/dagbok`
3. Guidesidor:
   - `/guider/ensamhet`
   - `/guider/ensamhet/kanner-mig-ensam`
   - `/guider/ensamhet/ensamhet-hjalp`
   - `/guider/ensamhet/orkar-ingenting`
   - `/guider/ensamhet/tomhetskansla`
4. Övningar:
   - Ingen ensamhetsspecifik övning identifierad i `tools`; använd breda reflektionsövningar vid internlänkning.
5. Bloggartiklar:
   - Ingen tydlig lokal bloggpost med ensamhet som primär intention identifierad.
6. Överlapp/kannibaliseringsrisk:
   - Låg-medium risk med depression/nedstämdhet, särskilt "orkar ingenting" och "tomhetskänsla".
7. Internlänkningsprincip:
   - Ensamhetsguider bör länka till `/ensamhet`.
   - Sidor om låg ork/tomhet bör sekundärt länka till `/depression` när nedstämdhet är tydlig.

### 2.8 Självkänsla

1. Rekommenderad huvudsida/hubb: `/sjalvkansla`
2. Stödjande sidor:
   - `/chat/a`
   - `/dagbok`
3. Guidesidor:
   - `/guider/sjalvkansla`
   - `/guider/sjalvkansla/lag-sjalvkansla`
   - `/guider/sjalvkansla/dalig-sjalvkansla`
   - `/guider/sjalvkansla/inre-kritikern`
   - `/guider/sjalvkansla/sjalvkritiska-tankar`
   - `/guider/sjalvkansla/perfektionism-och-sjalvkansla`
   - `/guider/sjalvkansla/gransen-och-sjalvkansla`
   - `/guider/sjalvkansla/jamforelse-och-sjalvbild`
   - `/guider/sjalvkansla/jamfor-mig-med-andra`
   - `/guider/sjalvkansla/kanner-mig-vardelos`
   - `/guider/sjalvkansla/hur-far-man-battre-sjalvkansla`
4. Övningar:
   - `/ovningar/skrivovningar-sjalvkansla`
   - `/ovningar/sjalvmedkansla-ovning`
   - `/ovningar/vardekartlaggning`
5. Bloggartiklar:
   - `/blogg/kbt-dagbok-vs-fri-journalforing` kan stödja skrivande/reflektion.
6. Överlapp/kannibaliseringsrisk:
   - Medium risk mellan `/guider/sjalvkansla/lag-sjalvkansla` och `/guider/sjalvkansla/dalig-sjalvkansla`.
   - Jämförelse-sidorna har också nära överlapp.
7. Internlänkningsprincip:
   - `/sjalvkansla` bör äga bred självkänsla.
   - "låg självkänsla" och "dålig självkänsla" bör skiljas med tydliga sökintentioner eller senare konsolideras.

### 2.9 Panikattack

1. Rekommenderad huvudsida/hubb: `/panikattack`
2. Stödjande sidor:
   - `/guider/angest/panikattack-hjalp`
   - `/guider/angest/lugna-en-panikattack`
   - `/chat/a`
3. Guidesidor:
   - `/guider/panikattack`
   - `/guider/panikattack/vad-hander-i-kroppen`
   - `/guider/panikattack/ta-dig-igenom-en-panikattack`
   - `/guider/panikattack/panikattack-eller-hjartinfarkt`
   - `/guider/panikattack/panikattacker-pa-natten`
   - `/guider/panikattack/sluta-vara-radd-for-panikattacker`
4. Övningar:
   - `/ovningar/grounding-5-4-3-2-1`
   - `/ovningar/4-7-8-andning`
5. Bloggartiklar:
   - Ingen tydlig lokal bloggpost med panikattack som primär intention identifierad.
6. Överlapp/kannibaliseringsrisk:
   - Hög risk mellan `/panikattack`, `/guider/panikattack`, `/guider/angest/panikattack-hjalp` och `/guider/angest/lugna-en-panikattack`.
7. Internlänkningsprincip:
   - Panikattackguides bör länka till `/panikattack`.
   - Ångestartiklar om panik bör länka till `/panikattack` när panikattack är huvudintention, och till `/angest` när ångest är bredare kontext.

### 2.10 Relationer

1. Rekommenderad huvudsida/hubb: `/guider/relationsproblem`
2. Stödjande sidor:
   - `/dagbok`
   - `/chat`
3. Guidesidor:
   - Det finns pillar-data för `relationsproblem` i `src/lib/data/seo-architecture.ts`.
   - Ingen faktisk `relationsproblem`-pillar hittades i `src/lib/seo-kit/content.ts`, vilket gör att `/guider/relationsproblem` sannolikt saknar aktiv contentkälla i nuvarande guide-route.
4. Övningar:
   - `/ovningar/icke-valdsam-kommunikation`
   - `/ovningar/vardekartlaggning`
   - `/ovningar/sju-fragor-vid-oro`
5. Bloggartiklar:
   - Ingen tydlig lokal bloggpost med relationer som primär intention identifierad.
6. Överlapp/kannibaliseringsrisk:
   - Låg risk just nu eftersom temat verkar underbyggt i äldre/planerad data men inte tydligt exponerat som faktisk guide-pillar.
7. Internlänkningsprincip:
   - Skapa inte ny hubb utan separat beslut. Om relationstemat aktiveras bör `/guider/relationsproblem` vara hubb och övningen `/ovningar/icke-valdsam-kommunikation` stödjande.

### 2.11 Skriva av sig/dagbok

1. Rekommenderad huvudsida/hubb: `/dagbok`
2. Stödjande sidor:
   - `/skriv`
   - `/anonym-dagbok-online`
   - `/digital-dagbok-for-maende`
   - `/guider/anonym-dagbok-online`
   - `/guider/dagbok-och-reflektion`
   - `/dagbok/checkin`
   - `/dagars-avtryck`
   - `/humorsparning`
   - `/journalforing`
3. Guidesidor:
   - `/guider/dagbok-och-reflektion`
   - `/guider/anonym-dagbok-online`
4. Övningar:
   - `/ovningar/daglig-reflektionsmall`
   - `/ovningar/dagens-avslut-reflektion`
   - `/ovningar/skrivovningar-sjalvkansla`
5. Bloggartiklar:
   - `/blogg/vad-ar-journalterapi`
   - `/blogg/kbt-dagbok-vs-fri-journalforing`
   - `/blogg/ai-hjalper-dig-bearbeta-kanslor`
6. Överlapp/kannibaliseringsrisk:
   - Hög risk mellan `/dagbok`, `/skriv`, `/anonym-dagbok-online`, `/digital-dagbok-for-maende`, `/guider/anonym-dagbok-online`, `/guider/dagbok-och-reflektion` och äldre `/journalforing`.
   - `/journalforing` bör granskas extra eftersom tonen tidigare har rört sig bort från vård-/journalord.
7. Internlänkningsprincip:
   - `/dagbok` bör vara produkt-/funktionshubb.
   - `/anonym-dagbok-online` bör äga "anonym dagbok online utan konto".
   - `/digital-dagbok-for-maende` bör äga "digital dagbok för mående".
   - Bloggartiklar bör länka till `/dagbok` och relevant long-tail, inte vara nav-hubbar.

### 2.12 Anonym chatt/stöd online

1. Rekommenderad huvudsida/hubb: `/chatta-anonymt`
2. Stödjande sidor:
   - `/chat`
   - `/anonym-chatt`
   - `/chatta-anonymt-med-nagon`
   - `/anonymt-samtalsstod-online`
   - `/prata-anonymt-online`
   - `/psykiskt-stod-online`
   - `/chattstod-psykisk-ohalsa`
   - `/samtalsstod-utan-vantetid`
   - `/ai-samtalsstod-online`
   - `/anonymt-samtalsstod-online`
3. Guidesidor:
   - Ämnesguider länkar ofta till `/chat/a`, `/chat/b` eller `/chat/e`.
4. Övningar:
   - Inte primär för temat, men `/ovningar` kan vara sekundär "nästa steg".
5. Bloggartiklar:
   - `/blogg/ai-hjalper-dig-bearbeta-kanslor`
6. Överlapp/kannibaliseringsrisk:
   - Hög risk mellan flera anonyma chatt-/samtalsstödssidor. `/chatta-anonymt` har redan tydlig Search Console-intention enligt tidigare arbete och bör inte röras brett utan ny data.
   - `/anonym-chatt` verkar finnas men filtreras bort från sitemapens SEO-supportentries, vilket bör kontrolleras innan IA-beslut.
7. Internlänkningsprincip:
   - `/chatta-anonymt` bör äga "chatta anonymt utan konto".
   - `/chat` bör vara funktionssida för att välja ingång.
   - Support-/long-tail-sidor bör länka tillbaka till `/chatta-anonymt` om anonymitet/utan konto är huvudvärdet.

## 3. Särskild kontroll: ångest/oro

1. `/angest` bör vara huvudhubb för bred ångestintention. Sidan har egen route, canonical och fallback metadata: "Hjälp vid ångest – prata anonymt".
2. `/hjalp-vid-angest-online` bör behållas som long-tail för "hjälp vid ångest online", med tydligare internlänk upp till `/angest`.
3. `/guider/angest` bör vara fördjupande guide-pillar, inte ersätta `/angest`. Den bör fortsätta samla artiklar men länka tydligt till `/angest`.
4. Ångestrelaterade bloggartiklar är få lokalt. Bloggen bör i första hand stötta med AI/reflektion och inte bära huvudtemat ångest.
5. Övningssidorna `/ovningar-mot-angest-online`, `/andningsovningar-mot-angest`, `/exponering-ovningar-mot-angest` och `/4-7-8-andning-ovning` bör vara åtgärdsnära long-tail och länka till både `/angest` och relevant övning.
6. Oro-intentionen bör separeras tydligare:
   - `/oro` = bred oro/ältande-hubb.
   - `/hjalp-mot-oro-online` = hjälp online/tekniker.
   - `/guider/overtankande` = guide-pillar för ältande/övertänkande.
   - `/guider/angest/orostankar` = ångestnära orostankar.

## 4. Metadata- och intentionsrisker

1. Ångest:
   - `/angest`: bred "hjälp vid ångest".
   - `/hjalp-vid-angest-online`: mycket nära samma intention, men med online-/hjälpformulering.
   - `/guider/angest`: bred guide-pillar med nära H1/SEO-intention.
   - `/guider/angest/angest-hjalp`: long-tail men mycket nära `/hjalp-vid-angest-online`.
2. Oro:
   - `/oro`, `/hjalp-mot-oro-online`, `/guider/overtankande` och `/guider/angest/orostankar` behöver tydlig rollfördelning.
3. Depression/nedstämdhet:
   - `/depression`, `/nedstamdhet`, `/hjalp-vid-depression-online` och `/guider/depression/nedstamdhet` ligger nära varandra.
4. Dagbok/skriva:
   - `/dagbok`, `/skriv`, `/anonym-dagbok-online`, `/digital-dagbok-for-maende`, `/guider/anonym-dagbok-online`, `/guider/dagbok-och-reflektion` och `/journalforing` har flera närliggande sökintentioner.
5. Anonym chatt:
   - `/chatta-anonymt`, `/chatta-anonymt-med-nagon`, `/anonym-chatt`, `/anonymt-samtalsstod-online`, `/prata-anonymt-online`, `/chattstod-psykisk-ohalsa`, `/samtalsstod-utan-vantetid` och `/ai-samtalsstod-online` behöver hållas isär med tydliga primärkeywords.
6. Självkänsla:
   - `/guider/sjalvkansla/lag-sjalvkansla` och `/guider/sjalvkansla/dalig-sjalvkansla` har hög semantisk likhet.
7. Panikattack:
   - `/panikattack`, `/guider/panikattack` och panikartiklar under `/guider/angest` behöver tydligt hubbval.

## 5. Rekommendationer utan kodändring

1. Prioritera hubbval före metadataändringar. För varje tema ska bara en sida bära bredast intention.
2. Behåll `/chatta-anonymt` orörd som huvudhubb för "chatta anonymt utan konto" eftersom den redan har Search Console-data.
3. Behåll `/angest` som bred ångesthubb tills Search Console visar annat. Gör inga canonical/noindex-ändringar på ångestsidor utan separat trafik- och impressionsanalys.
4. Gör senare en snäv internlänkningsrunda där stödjande sidor får en tydlig länk upp till vald hubb.
5. Gör senare metadatajusteringar för long-tail-sidor så de inte låter som breda hubbar.
6. Undvik noindex/canonical som första åtgärd. Använd det bara om en sida tydligt saknar egen sökintention eller om GSC visar långvarig kannibalisering.
7. Kontrollera `/guider-seo/*`: de redirectar eller noindexas i nuvarande kod och bör inte räknas som primära indexbara hubbar utan separat teknisk granskning.
8. Granska `/journalforing` separat utifrån tonalitet och IA. Om den behålls bör den troligen bli historisk/utbildande long-tail, inte huvudhubb för dagbok.
9. Aktivera inte relationstemat utan att först säkerställa att aktuell guide-content finns i `src/lib/seo-kit/content.ts`.

## 6. Sidor som inte bör röras utan Search Console-data

1. `/chatta-anonymt` eftersom den redan är optimerad mot "chatta anonymt utan konto".
2. `/angest` eftersom den är bred ångesthubb och kopplad till dynamiskt/adminstyrt landningsinnehåll.
3. `/dagbok` eftersom den är central produkt- och funktionshubb.
4. `/chat` eftersom den är primär funktionsingång.
5. Ämnessidor med befintliga interna kluster: `/stress`, `/depression`, `/sovproblem`, `/sjalvkansla`, `/panikattack`, `/trauma`, `/ensamhet`, `/oro`.

## 7. Nästa rimliga steg

1. Kör en separat metadata-inventering som exporterar title, meta description, H1 och canonical för alla indexbara publika routes.
2. Jämför hubb och stödjande sidor per tema mot faktisk GSC-data innan canonical/noindex eller omskrivning.
3. Gör en liten internlänkningsdiff per tema, inte globalt.
4. Börja med ångest/oro eftersom risken för överlapp är störst och sidorna är centrala.
5. Fortsätt därefter med dagbok/anonym chatt eftersom de är affärs- och produktnära.

## 8. Källor i kodbasen

1. Routes under `src/routes`.
2. Guide-pillars och guideartiklar i `src/lib/seo-kit/content.ts`.
3. Övningar och äldre SEO-arkitektur i `src/lib/data/seo-architecture.ts`.
4. SEO-supportsidor i `src/lib/data/seo-support-pages.ts`.
5. Bloggkort i `src/lib/data/blogg.ts`.
6. Sitemapprioritering och indexbara grupper i `src/routes/sitemap.xml/+server.ts`.
7. Layout/navigation i `src/routes/+layout.svelte`.
