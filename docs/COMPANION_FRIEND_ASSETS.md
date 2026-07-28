# Räv och rådjur: tillgångar som saknas

Relationssystemet är aktivt, men rådjurens visuella lager är feature-flaggat tills
licensierade och frilagda bildtillgångar finns. Inga platshållarbilder eller
trasiga bildlänkar visas i produktion.

`CompanionFriend.svelte` är färdigbyggd och väntar på filerna. Den renderar
ingenting alls så länge någon av dessa gäller: flaggan är `false`, steget är
under 2, följeslagaren saknar vänpar, eller bilden inte går att ladda.

## Flaggan

`assetsAvailable` i `FOX_DEER_RELATIONSHIP` (`src/lib/companionRelationship.ts`).
Står på `false`. Sätts till `true` först efter godkänd visuell verifiering.

## Filer som behövs

Katalog: `static/images/world/friends/` (skapas när filerna läggs till).

| Filnamn | Steg | Position | Pose och riktning | Mått |
| --- | --- | --- | --- | --- |
| `deer-silhouette-far.webp` | 2 | `shore-far` | Stående i profil, vänd åt vänster mot sjön. Lågkontrast, läsbar som form snarare än som detaljerat djur. | 400×400 |
| `deer-standing-near.webp` | 3 | `shore-near` | Stående vid vattenbrynet, huvudet något lyft och vaksamt, vänd åt vänster. Full detalj. | 800×800 |
| `deer-resting-near.webp` | 4 | `shore-near` | Liggande eller betande, lugn och stilla, vänd åt vänster. Full detalj. | 800×800 |

Steg 0 renderar ingenting. Steg 1 är enbart det diskreta naturtecknet som
`AmbientWorld.svelte` redan ritar i ren CSS - aldrig ett djur.

Steg 4 måste ha en egen fil. Utan den skulle rådjuret försvinna för den som
kommit längst, vilket vore precis den nedgradering systemet aldrig får göra.

## Krav som gäller alla filer

- Format: WebP med äkta alfakanal. PNG går om pipelinen kräver det, men håll då
  filen under ~150 kB - de befintliga PNG-utklippen väger 750 kB till 2,4 MB och
  det ska inte upprepas.
- Kvadratisk canvas, djuret horisontellt centrerat.
- **Hovarna ska ligga på 96 % av canvashöjden.** Vargbilden har transparent luft
  under tassarna, vilket tvingade fram en placeringshack som fortfarande står
  dokumenterad i `companionPoseManifest.ts`. Upprepa inte det.
- Djuret fyller cirka 85 % av canvashöjden.
- Mjuk mattad kant. Ingen vit halo och inga hårda utklippskanter - det syns
  direkt mot fotot.
- Neutralt dagsljus, ingen inbränd färgton. Kväll och natt löses med CSS-filter
  precis som för följeslagaren, så inga separata dagpartsvarianter behövs.
- Dokumenterad produktionslicens.

## Efter att filerna lagts till

1. Kontrollera att sökvägarna matchar `stageAssets` i `companionRelationship.ts`.
2. Finjustera `FRIEND_SCENE_POSITIONS` visuellt. Nuvarande koordinater är satta
   utan bild och behöver kalibreras mot rådjurets faktiska tyngdpunkt.
3. Verifiera steg 2, 3 och 4 på desktop och mobil 375 px.
4. Verifiera reduced motion, att ingen overflow uppstår och att följeslagaren
   fortfarande är visuellt primär.
5. Sätt `assetsAvailable: true` först därefter.
