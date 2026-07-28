# Räv och rådjur: tillgångar som saknas

Relationssystemet är aktivt, men rådjurens visuella lager är feature-flaggat tills
licensierade och frilagda bildtillgångar finns. Inga platshållarbilder eller
trasiga bildlänkar visas i produktion.

Följande tillgångar behövs innan `assetsAvailable` kan sättas till `true` i
`src/lib/companionRelationship.ts`:

- Rådjur i lågkontrast-siluett för `shore-far` (steg 2).
- Rådjur vid vattenbrynet för `shore-near` (steg 3).
- Rådjur i stilla vila eller drickande pose för `shore-near` eller
  `foreground-right` (steg 4).

Alla bilder ska ha transparent bakgrund, vara anpassade till den befintliga
sjöscenen och ha dokumenterad produktionslicens.
