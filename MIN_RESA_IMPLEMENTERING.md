# "Min resa" – Implementeringsplan

## 🎯 Överblick
Skapa en ny sida `/journey` (eller liknande) som visar användarens utveckling över tid med:
- Streak-räknare
- AI-veckosammanfattningar
- Milstolpar
- Aktivitetsheatmap
- Mönsterinsikter

---

## 1. STREAK-RÄKNARE

### Backend (API)
**Endpoint:** `GET /api/diary/streak`

```typescript
// Logik:
1. Hämta alla dagboksinlägg för användaren (sorterad efter datum)
2. Jämför med dagens datum – räkna bakåt tills det finns ett gap
3. Returnera: { current_streak: number, longest_streak: number }
```

**Datatyp:**
```typescript
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string; // ISO 8601
}
```

### Frontend
Visa i "Min resa" som ett kort:
```
🔥 Din nuvarande streak
12 dagar i rad

Din längsta streak
27 dagar
```

---

## 2. VECKOSAMMANFATTNING MED AI

### Backend (API)
**Endpoint:** `POST /api/diary/weekly-summary`

```typescript
Input:
{
  startDate: string; // ISO 8601
  endDate: string;
}

Output:
{
  summary: string; // AI-genererad text
  mood_trend: "improving" | "declining" | "stable";
  dominant_emotions: string[];
  week: number; // Vilken vecka detta är
}
```

**Logik:**
1. Hämta alla inlägg mellan start- och slutdatum
2. Extrahera moodvärden och texter
3. Skicka till OpenAI med prompt:
   ```
   "Analysera följande dagboksinlägg från vecka X. 
    Ge en kort, känslig sammanfattning (2-3 meningar) 
    om användarens mentala tillstånd denna vecka. 
    Fokusera på känslotrenden, inte fakta."
   ```

### Frontend
Visa som ett arkiv av veckosammanfattningar:
```
📅 Vecka 6 (6-12 feb)
"Den här veckan verkar du ha känt dig mer hoppfull, 
särskilt mot slutet. Du skrev ofta om framtidsplaner."

Trend: ↗️ Förbättring | Vanligaste känslor: Hopp, Ro
```

---

## 3. MILSTOLPAR

### Backend
Hårdkodade milstolpar baserade på antalet inlägg:

```typescript
const milestones = [
  { inlägg: 1, text: "Din första dagboksanteckning 📝" },
  { inlägg: 5, text: "5 inlägg – Du är på vägen!" },
  { inlägg: 10, text: "10 inlägg – Stark början 💪" },
  { inlägg: 25, text: "25 inlägg – En vanlig journalist!" },
  { inlägg: 50, text: "50 inlägg – Hälften till 100!" },
  { inlägg: 100, text: "100 inlägg – Miljon tankar sparade 🌟" },
  { inlägg: 365, text: "Ett helt år – Du är otrolig! 🎉" }
];
```

**API:** `GET /api/diary/milestones`
- Returnera alla milestones som uppnåtts + nästa kommande

### Frontend
```
🏆 Dina milstolpar

✅ 1 inlägg – Din första dagbooksanteckning
✅ 10 inlägg – Stark början
⏳ Nästa: 25 inlägg (du är på 12)
```

---

## 4. HEATMAP (AKTIVITETSKARTA)

### Backend (API)
**Endpoint:** `GET /api/diary/heatmap`

```typescript
Output:
{
  [date: string]: number; // ISO 8601 → antalet inlägg denna dag
}

Exempel:
{
  "2025-02-06": 1,
  "2025-02-07": 0,
  "2025-02-08": 2,
  ...
}
```

**Logik:**
- Hämta alla inlägg för senaste 52 veckor
- Gruppera per dag
- Returnera ett objekt med datum → antalet inlägg

### Frontend
Använd ett bibliotek som [cal-heatmap](https://cal-heatmap.com/) eller skapa själv med SVG:

```
Februari 2025
M  T  O  T  F  L  S
           1  2  3
4  5  6  7  8  9  10
11 12 13 14 15 16 17
...

Färgkod:
🟫 0 inlägg
🟩 1 inlägg
🟩 2-3 inlägg
🟩 4+ inlägg
```

---

## 5. MÖNSTERINSIKTER

### Backend (API)
**Endpoint:** `GET /api/diary/insights`

```typescript
Output:
{
  best_day_of_week: string; // "Fredag"
  worst_day_of_week: string; // "Söndag"
  mood_by_weekday: {
    Monday: number;
    Tuesday: number;
    ...
  };
  recurring_patterns: {
    pattern: string;
    frequency: number;
  }[];
}
```

**Logik:**

1. **Bäst/sämst dag:**
   - Beräkna genomsnittligt moodvärde per veckodag
   - Returnera dag med högsta/lägsta medelvärde

2. **Återkommande mönster (enklare version):**
   - Leta efter ord som ofta dyker upp tillsammans
   - Exempel: "söndag" + "oro" → räkna förekomster
   - Returnera top 3 mönster med frekvens

### Frontend
```
💡 Dina mönster

📊 Mår bäst på fredagar
(Genomsnittligt humör: 7.2/10)

📊 Svårare på söndagar
(Genomsnittligt humör: 5.1/10)

🔄 Återkommande:
- Du skriver ofta om "okunskap" på måndagar
- "Glädje" dyker ofta upp efter träning
- Helger → mer reflektiv ton
```

---

## 📋 Implementeringsordning

### Phase 1: Grundläggande (denna vecka)
1. Streak API + Frontend
2. Heatmap API + Frontend
3. Milstolpar API + Frontend

### Phase 2: AI-insikter (nästa vecka)
1. Veckosammanfattning API
2. Mönsteranalys API
3. Integrera på sidan

### Phase 3: Polish (senare)
1. Animationer
2. Responsiv design
3. Mobile-optimering

---

## 🛠️ Tekniska detaljer

### Nya endpoints
```
GET  /api/diary/streak           → StreakData
POST /api/diary/weekly-summary   → WeeklySummary
GET  /api/diary/milestones       → Milestone[]
GET  /api/diary/heatmap          → HeatmapData
GET  /api/diary/insights         → InsightData
```

### Databaskällor
Allt kommer från `diary`-tabellen:
- `id`
- `user_id`
- `date` (ISO 8601)
- `mood` (1-10)
- `content` (text)

### Ny Svelte-sida
```
src/routes/journey/+page.svelte
src/routes/journey/+page.server.ts
```

---

## 🎨 UI/UX-notes

- **Ton:** Uppmuntrande, inte för mycket statistik-språk
- **Färger:** Passande till ditt befintliga design
- **Animationer:** Subtle, inte distrakterande
- **Mobilfokus:** Alla kort ska vara responsiva
- **Åtkomst:** Från menyn eller startsida-länk

---

## 📝 Exempel på färdig sida

```
🏠 Min resa

┌─────────────────────────────────────────┐
│         🔥 Din nuvarande streak          │
│              12 dagar i rad              │
│          (senaste: igår kväll)           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            📅 Denna vecka                │
│ "Du har skrivit mer reflektivt denna     │
│ vecka. Känslan av vila känns starkare."  │
│ Trend: ↗️ Förbättring                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         🏆 Dina milstolpar               │
│ ✅ 1 inlägg, ✅ 10 inlägg, ✅ 25 inlägg  │
│ ⏳ Nästa: 50 inlägg (27 kvar)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      📈 Din aktivitetskarta              │
│  [Heatmap här – 52 veckor]               │
│  Mest aktiv: Vecka 6 (15 inlägg)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         💡 Dina mönster                  │
│ 📊 Mår bäst på fredagar                  │
│ 📊 Svårare på söndagar                   │
│ 🔄 Återkommande: Oro på söndagar         │
└─────────────────────────────────────────┘
```

---

## ✅ Nästa steg

1. Vilken feature vill du börja med?
2. Vill du att jag skriver API-koden först?
3. Eller frontend-komponenten?
4. Behöver du database-schema justerat?

Berätta så hjälper jag dig implementera! 🚀
