# Räv och rådjur: vänlagrets tillgångar

Relationssystemet och rådjurets visuella lager är aktiva. `CompanionFriend.svelte`
renderar ingenting alls så länge någon av dessa gäller: flaggan är `false`, steget
är under 2, följeslagaren saknar vänpar, eller bilden inte går att ladda.

## Flaggan

`assetsAvailable` i `FOX_DEER_RELATIONSHIP` (`src/lib/companionRelationship.ts`).
Står på `true` sedan bilderna lagts in och verifierats visuellt.

## Filerna

Katalog: `static/images/world/friends/`.

| Filnamn | Steg | Position | Pose och riktning | Canvas | Storlek |
| --- | --- | --- | --- | --- | --- |
| `deer-silhouette-far.webp` | 2 | `shore-far` | Stående i profil, vänd åt vänster mot sjön. Lågkontrast, läses som form snarare än som detaljerat djur. | 1024×1024 | 72 kB |
| `deer-standing-near.webp` | 3 | `shore-near` | Stående vid vattenbrynet, huvudet något lyft och vaksamt, vänd åt vänster. | 1254×1254 | 107 kB |
| `deer-resting-near.webp` | 4 | `shore-foreground` | Liggande, lugn, huvudet försiktigt lyft, vänd åt vänster. | 1254×1254 | 141 kB |

Okomprimerade källfiler ligger i `assets/world/friends/` (utanför `static/`). De är
gröna studiobilder, inte alfamasters - den frilagda alfakanalen finns bara i
WebP-filerna, så utgå från dem vid framtida redigering.

Steg 4 använder `shore-foreground` och inte följeslagarens `foreground-right`:
den senare är exakt där räven står, så de två skulle överlappa. Positionerna
trappas i stället nedåt och inåt i bild (`shore-far` → `shore-near` →
`shore-foreground`) så vännen läses som att den kommer närmare för varje steg,
men alltid till vänster om och något mindre än följeslagaren.

Steg 0 renderar ingenting. Steg 1 är enbart det diskreta naturtecknet som
`AmbientWorld.svelte` redan ritar i ren CSS - aldrig ett djur.

Steg 4 måste ha en egen fil. Utan den skulle rådjuret försvinna för den som
kommit längst, vilket vore precis den nedgradering systemet aldrig får göra.

## Krav som gäller alla filer

- Format: WebP med äkta alfakanal, kvalitet 86-90. Håll filen under ~150 kB - de
  äldre PNG-utklippen väger 750 kB till 2,4 MB och det ska inte upprepas.
- Kvadratisk canvas, djuret horisontellt centrerat.
- **Markkontakten ska ligga på 96 % av canvashöjden.** Vargbilden har transparent
  luft under tassarna, vilket tvingade fram en placeringshack som fortfarande står
  dokumenterad i `companionPoseManifest.ts`. Upprepa inte det. Den första
  versionen av `deer-resting-near.webp` hade markkontakten på 82,7 % och svävade
  10-24 px över strandlinjen innan den exporterades om.
- Djuret fyller cirka 85 % av canvashöjden (liggande poser blir naturligt lägre).
- Mjuk mattad kant. Ingen vit halo och inga hårda utklippskanter.
- Neutralt dagsljus, ingen inbränd färgton. Kväll och natt löses med CSS-filter i
  `CompanionFriend.svelte`, så inga separata dagpartsvarianter behövs.

## Skalning och gradering

`--friend-base-width` sätts per scen i `CompanionFriend.svelte` och är kalibrerad
mot hur stor **följeslagaren faktiskt renderas** i den scenen, inte mot scenens
bredd. Räven är stor i Mitt Hems hero men liten och tillbakadragen i Framstegs
banner, så samma procenttal ger helt olika maktförhållande mellan djuren. Med
Framstegs ursprungliga 22 % blev rådjuret 2,5-3 ggr rävens höjd och upp till
6,6 ggr dess yta. Kontrollera detta förhållande om en ny scen läggs till.

Skymnings- och nattgraderingen ärvs från scenens `data-time` och speglar
`--companion-grade` i `CompanionPose.svelte`, med ett snäpp lägre ljushet så
vännen förblir mindre framträdande. Mitt Hems hero sätter inget `data-time` och
håller därför både räv och rådjur i dagsläge.

## Vid byte eller tillägg av tillgångar

1. Kontrollera att sökvägarna matchar `stageAssets` i `companionRelationship.ts`.
2. Mät markkontakt, horisontell centrering och alfakanal innan integration.
3. Verifiera steg 2, 3 och 4 på 1280, 375 och 320 px, i dag, skymning och natt.
4. Kontrollera att rådjuret är lägre än räven i både höjd och yta, att det ligger
   under rävens z-index och att det inte skyms av räven.
5. Verifiera reduced motion, att ingen overflow uppstår och att inget överlappar
   text eller tidsbadge.
