# Om src/app.html

Kommentarerna som tidigare stod i `src/app.html` skickades med i varje sidas
HTML. De står här i stället, så att besökare inte ser utvecklaranteckningar
när de visar sidans källkod. Testet i `src/lib/app-html-comments.test.ts`
ser till att inga HTML-kommentarer kommer tillbaka i `app.html`.

## Mörkt tema från första målningen

MittPsyke har bara mörkt tema. Klassen `dark`, `color-scheme` och
bakgrundsfärgen står statiskt på `<html>` och i ett litet `<style>`-block, så
att sidan är mörk redan innan CSS och JS har laddats, även på sidor som ännu
inte hydrerats. Färgen är densamma som `--background` i `app.css`.

## Viewport: `interactive-widget=resizes-content`

Utan den krymper Android Chrome bara den visuella viewporten när tangentbordet
öppnas. Layoutviewporten, och därmed `dvh`/`vh`, behåller hela skärmhöjden.
Chatten trodde då att den hade 800 px att fördela när bara cirka 475 px syntes,
och webbläsaren scrollade fram textfältet, vilket skar av innehållet ovanför.
Med `resizes-content` krymper layouten på riktigt och flexkolumnen fördelar den
yta som faktiskt syns.

## Förladdat typsnitt

Brödtextens typsnitt (`RecursiveT-Regular.woff2`) hämtas direkt i stället för
först när `fonts.css` har lästs. Annars byts reservtypsnittet ut efter första
målningen och texten bryts om, vilket flyttade chattens samtyckesruta (CLS).
Bara den vikt som används överallt förladdas.

## Accentfärg före första målningen

Det inbäddade skriptet läser användarens accentfärg (Personalisera portalen)
från `localStorage` och sätter CSS-variablerna innan sidan målas. Ljust eller
mörkt väljs inte där, eftersom MittPsyke alltid är mörkt.

## Tillfälligt: GA-blocket för Similarweb (oktober 2026)

Similarwebs koppling till Google Analytics letar efter GA-taggen i sidans HTML.
Riktiga gtag laddas först efter samtycke (`src/lib/analytics.ts`), så den hittas
inte där. Blocket `<script type="text/plain" id="ga-verification">` körs aldrig
och gör inget anrop till Google. Det står bara som text. Ta bort det när
Similarweb har godkänt kopplingen.
