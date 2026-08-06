# AI-principer för MittPsyke

AI ska vara ett varsamt stöd före, mellan och efter kontakt med mänsklig vård. Det ersätter inte vård, terapi eller akuthjälp.

Prioriterade användarnyttor är att förbereda ett vårdbesök, sammanfatta dagbok i användarens egen takt, reflektera över veckan, formulera frågor till vården och välja teman som användaren vill dela. AI får inte låtsas känna till oskickad historik eller annan data som inte uttryckligen ligger i underlaget.

AI-genererat innehåll ska märkas tydligt där det visas. En dagboksreflektion är inte samma sak som samtalsstöd, och inget av dem är en klinisk bedömning.

## Dataåtgärder

När AI föreslår en dataåtgärd ska flödet alltid vara: **föreslå → validera → användaren godkänner → utför**. Förslaget får aldrig skriva, radera, publicera eller dela data. Varje verklig utförare ska kontrollera behörighet, validera payload och kräva ett separat, uttryckligt godkännande. Radering, publicering och delning får aldrig auto-godkännas.

## Teknisk riktning

Produktfunktioner ska använda `src/lib/server/ai/text-generation.ts` för textgenerering. Det lagret väljer syfte, modell, timeout och provideradapter centralt och normaliserar säkra fel. Byt av modell eller provider ska testas med mockad adapter, utan produktionsanrop.

Node 24 LTS används i CI. Produktionsmiljöns Node-version är inte deklarerad i repositoryt och ska verifieras hos driftleverantören innan den låses i en versionsfil eller deploy-konfiguration.
