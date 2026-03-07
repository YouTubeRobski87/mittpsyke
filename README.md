# MittPsyke

> En svensk plattform för psykisk hälsa, stöd och återhämtning.

MittPsyke är byggd för att göra stöd kring psykisk hälsa mer tillgängligt, lugnt och lätt att använda.  
Fokus ligger på att hjälpa användaren att förstå sitt mående, få stöd direkt och följa sin utveckling över tid.

---

## Innehåll

- [Om projektet](#om-projektet)
- [Huvudfunktioner](#huvudfunktioner)
- [Min resa](#min-resa)
- [Teknisk stack](#teknisk-stack)
- [Projektstruktur](#projektstruktur)
- [API-endpoints](#api-endpoints)
- [Installation](#installation)
- [Miljövariabler](#miljövariabler)
- [Vision](#vision)
- [Status](#status)

---

## Om projektet

MittPsyke är en svensk webbplattform med fokus på psykisk hälsa.  
Målet är att skapa en trygg digital plats där användaren kan:

- få stöd utifrån hur hen mår just nu
- skriva dagbok och följa sitt mående
- se mönster och framsteg över tid
- få AI-baserade sammanfattningar och insikter
- hitta rätt väg vidare till stöd, samtal eller akut hjälp

Plattformen är tänkt att kännas **varm**, **tydlig**, **enkel** och **icke-stressande** även när användaren är trött, överväldigad eller mår dåligt.

---

## Huvudfunktioner

### Stöd och innehåll
- guider och övningar
- stöd utifrån olika fokusområden, till exempel:
  - ångest
  - depression
  - trauma
- akut hjälp och stödlinjer

### Personliga funktioner
- dagbok
- personlig portal
- framstegsvy
- känslotrender och aktivitetsmönster

### AI-stöd
- AI-chatt
- AI-samtal / telefonstöd
- AI-genererade veckosammanfattningar
- återkommande mönster och insikter

---

## Min resa

En central del av MittPsyke är sidan **"Min resa"**, där användaren kan följa sin utveckling över tid.

### Det som finns just nu

#### 🔥 Streak-räknare
- visar antal dagar i rad användaren skrivit i dagboken
- visar längsta streak
- visar hur länge sedan senaste inlägget skrevs

#### 🏆 Milstolpar
- uppnådda mål baserat på antal inlägg
- nästa mål visas med progress bar
- uppmuntrande texter och visuella markörer

#### 📈 Aktivitetsheatmap
- GitHub-liknande aktivitetskarta
- visar aktiva dagar över tid
- responsiv layout
- färgkodad aktivitet per dag

#### 💡 Insikter
- vilken veckodag användaren verkar må bäst
- vilken veckodag som verkar svårare
- återkommande mönster, till exempel oro vissa dagar
- genomsnittligt humör per veckodag

#### 📊 Veckosammanfattningar
- AI-genererad sammanfattning av veckan
- överblick av känslotrend
- hjälper användaren att se förändring utan att läsa allt igen

---

## Teknisk stack

Projektet använder en modern webbstack med fokus på enkel utveckling och skalbarhet.

- **Frontend:** Svelte 5
- **Framework:** SvelteKit 2
- **Styling:** Tailwind CSS
- **Ikoner:** lucide-svelte
- **Backend / datalager:** Supabase
- **Databas:** PostgreSQL
- **AI:** OpenAI API

---

## Projektstruktur

```bash
src/
├── routes/
│   ├── api/
│   │   └── diary/
│   │       ├── streak/
│   │       │   └── +server.ts
│   │       ├── heatmap/
│   │       │   └── +server.ts
│   │       ├── milestones/
│   │       │   └── +server.ts
│   │       ├── weekly-summary/
│   │       │   └── +server.ts
│   │       └── insights/
│   │           └── +server.ts
│   └── journey/
│       ├── +page.svelte
│       └── +page.server.ts
└── lib/
    └── components/
        └── Heatmap.svelte
