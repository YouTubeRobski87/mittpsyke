# Companion World

Följeslagaren och platsen är hjärtat i MittPsyke. Det här dokumentet samlar
visionen för den levande världen. Den långa filosofin finns i
[`NORTH_STAR.md`](./NORTH_STAR.md); här är den praktiska sammanfattningen.

Konst- och känsloreferenser: [`references/`](./references/)
(`03-home-vision-bear.png`, `04-companion-world-reference.png`,
`05-hero-bear-scene.png`).

---

## Grundidé

MittPsyke är inte en app – det är en lugn plats som alltid finns kvar. När
användaren återvänder känns platsen bekant, följeslagaren känner igen dem, och
världen har förändrats lite – precis som de själva.

Följeslagaren ska kännas som **sällskap utan krav**. Den behöver inte alltid
prata. Ibland sitter den bara vid sjön och tittar ut över vattnet.

## Regler som aldrig bryts

- **Platsen kommer först.** Samma glänta, samma träd, samma stig. Den förändras
  långsamt och börjar aldrig om.
- **Följeslagaren är identiteten.** Profilbilden är följeslagaren – inte en
  bokstav, inte en selfie, inte en AI-avatar.
- **Inga belöningar.** MittPsyke belönar inte, det uppmärksammar. Inte "+50 XP"
  utan "🌼 En ny blomma har slagit ut."
- **Ingenting får stressa.** Ingen röd badge, ingen "du missade igår", ingen
  streak som skapar skuld. Efter 8 månaders frånvaro: "Vad fint att se dig igen."
- **Framsteg upptäcks, annonseras inte.** "Hmm... var det verkligen blommor här
  sist?" – inte "🎉 Ny blomma upplåst!".
- Om två lösningar är lika bra tekniskt: välj den lugnaste.

## Lager i världen

1. **Platsen** – förändras nästan aldrig. Glänta, träd, stig, berg. Det är "hem".
2. **Följeslagaren** – användarens djur (björn, räv, uggla m.fl.). Rör sig lite,
   gör platsen personlig.
3. **Årstider** – vår / sommar / höst / vinter, automatiskt.
4. **Tid på dygnet** – soluppgång (06), dagsljus (12), gyllene kväll (18),
   stjärnhimmel (22).
5. **Din resa** – små, tysta spår av tid: grässtrå efter en vecka, blommor efter
   en månad, en sten vid en milstolpe, ett större träd efter ett år. Ingen text,
   ingen "Level Up".
6. **Väder** – regn, solsken, dimma, vind. Behöver inte påverka något; gör bara
   världen levande.
7. **Små händelser** – mycket sällsynta: en fågel landar, en fjäril, ett löv
   faller, en igelkott. Inga belöningar. Bara liv.

## Growth Garden som motor

Growth Garden är inte en separat funktion – den är motorn bakom hela världen. När
användaren mår bättre, skriver dagbok eller återvänder regelbundet påverkar det
hela platsen. AI, dagbok, forum och Garden blir olika sätt att vårda samma plats.

## Var det lever i koden (referens, inte spec)

- `src/lib/components/dashboard/SilentCompanion.svelte` – "den tysta följeslagaren",
  tid-på-dygnet-tillstånd, länk till `/framsteg#growth-garden`.
- `src/lib/components/CompanionScene.svelte` – scenens ljus/atmosfär per tid.
- `src/lib/components/CompanionAvatar.svelte` – följeslagaren som identitet/avatar.
- `src/lib/progressCompanion.ts` – val av djur, dygns-tillstånd, konst-id:n.
- `src/routes/framsteg/+page.svelte` – "Din resa" / milstolpar (host för Garden).

> Känd avvikelse: nuvarande scen är mörk/natt-tonad medan referenserna
> (`04`/`05`) är varma och ljusa. Bör föras in i det ljusa systemet – se
> [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
