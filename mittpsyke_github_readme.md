
# 🧠 MittPsyke

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![SvelteKit](https://img.shields.io/badge/SvelteKit-framework-orange)
![Supabase](https://img.shields.io/badge/Supabase-backend-green)
![Render](https://img.shields.io/badge/Render-deploy-46E3B7)

**MittPsyke** är en svensk digital plattform för psykiskt välmående där människor kan
skriva av sig, reflektera och prata anonymt.

Plattformen kombinerar:

- 🤖 AI-baserade samtal
- 📓 personlig dagbok
- 📈 framsteg & insikter
- ☎️ stödlinjer och resurser

Målet är att skapa en låg tröskel till stöd när tankarna känns tunga.

---

# 🌐 Demo

**Live:**  
https://www.mittpsyke.se

---

# 📸 Screenshots

## Startsida
![Start](docs/screenshots/home.png)

## AI-samtal
![Chat](docs/screenshots/chat.png)

## Dagbok
![Diary](docs/screenshots/diary.png)

## Framsteg
![Progress](docs/screenshots/progress.png)

*(lägg screenshots i `/docs/screenshots/`)*

---

# ✨ Funktioner

## 🤖 AI Samtal
Användare kan prata anonymt med ett AI‑baserat samtalsstöd.

Kategorier:

- 💙 Ångest
- 🌧️ Depression
- 🛡️ Trauma

AI:n är designad för att:

- vara lugn
- validera känslor
- hjälpa användaren reflektera

---

## 📓 Dagbok

Personlig journaling med:

- känsloval
- textinlägg
- historik

Funktioner:

- skriv av dig
- följ känslotrender
- reflektera över tid

---

## 📈 Framsteg

Visualisering av användarens resa:

- streak (dagar i rad)
- aktivitetskarta
- milstolpar
- känslotrend

---

## ☎️ Stödlinjer

Snabb tillgång till svenska hjälporganisationer.

Exempel:

- Mind
- Jourhavande medmänniska
- BRIS
- 1177

---

# 🎯 Vision

MittPsyke ska fungera som en digital första plats när någon mår dåligt.

Istället för att vara ensam kan man:

1. skriva
2. reflektera
3. prata

och känna sig mindre ensam i det.

---

# 🧩 Tech Stack

Frontend

- SvelteKit
- TailwindCSS
- Chart.js

Backend

- Supabase
- PostgreSQL
- API routes

AI

- OpenAI API

Deployment

- Render (Node web service via `@sveltejs/adapter-node`, `node build`)

---

# 📂 Projektstruktur

```
src/
routes/
chat/
dagbok/
framsteg/

lib/
supabase.ts

static/
assets/
```

---

# ⚙️ Installation

Clone repo:

```
git clone https://github.com/YouTubeRobski87/mittpsyke-main.git
```

Install dependencies:

```
npm install
```

Start dev server:

```
npm run dev
```

Öppna sedan i webbläsaren:

```
http://localhost:5173
```

---

# 🔐 Säkerhet

MittPsyke använder:

- Supabase authentication
- Row Level Security (RLS)
- krypterad HTTPS via Render

Användardata är skyddad och isolerad per konto.

---

# 📈 SEO

Projektet är designat för att hjälpa människor hitta stöd via Google.

Exempel på sökningar:

- ångest på kvällen
- någon att prata med anonymt
- panikattack vad göra

---

# ⚠️ Ansvarsinfo

MittPsyke är ett digitalt samtalsstöd.

Det ersätter inte:

- läkare
- psykolog
- professionell vård

Vid akut fara ring **112**.

---

# 🤝 Bidra

Förslag, idéer och förbättringar är välkomna.

1. Fork repo
2. Skapa branch
3. Gör ändringar
4. Skicka PR

---

# 📜 License

MIT License

---

# 💚 Tack

Projektet är skapat för att hjälpa människor känna sig mindre ensamma.

Om MittPsyke hjälper någon att ta ett första steg
har det redan gjort något viktigt.
