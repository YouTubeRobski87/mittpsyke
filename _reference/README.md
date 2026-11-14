# 📔 Storify

> _For all the diaries you bought but never wrote in_ ✨

**Storify** is an AI-powered journaling app that transforms your daily experiences into personalized diary entries. Answer a few guided questions about your day, pick a writing style, and let Claude AI craft a unique journal entry just for you.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-mystorify.se-blue)](https://mystorify.se)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-FF3E00?logo=svelte)](https://kit.svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Anthropic](https://img.shields.io/badge/Powered_by-Claude_AI-D4A574)](https://anthropic.com)

---

## 🎯 Overview

Journaling is powerful, but starting is hard. Storify removes the friction by:

1. 📝 **Guiding you** through a simple wizard with questions about your day
2. 🎭 **Letting you choose** from 24 unique writing styles
3. 🤖 **Generating** a personalized diary entry using Claude AI
4. 📤 **Exporting or emailing** your entry as text, image, or share link

No more staring at a blank page – just answer a few questions and get a beautifully written diary entry in seconds!

---

## ✨ Features

### 🧙‍♂️ 10-Step Guided Wizard

| Step | Name                    | Description                                               |
| :--: | ----------------------- | --------------------------------------------------------- |
|  0   | 👤 Profile              | Name, age, pronouns, hometown, family, pets, interests    |
|  1   | 😊 Mood, Date & Weather | Pick up to 4 emojis + optional auto-weather from location |
|  2   | ⚡ Energy               | Rate your sleep, energy, and overall mood (1-10)          |
|  3   | 🏃 Activities           | Where you went, what you did, who you met                 |
|  4   | 🏆 Wins & Frustrations  | Celebrate victories and vent frustrations                 |
|  5   | 💭 Reflections          | What almost happened, regrets, redo moments               |
|  6   | 🍕 Food & Music         | Meals and soundtracks of your day                         |
|  7   | ⏳ Time Capsule         | A memory to preserve + a message to future you            |
|  8   | 🎭 Voice                | Choose your writing style                                 |
|  9   | 📋 Summary              | Review and generate your entry                            |

### 🎭 24 Unique Writing Tones

| Tone                                    | Description                              |
| --------------------------------------- | ---------------------------------------- |
| 📒 **Klassisk Dagbok** (Classic)        | Traditional "Dear Diary" format          |
| 📖 **Berättelse** (Storytelling)        | Your day as a narrative adventure        |
| 🤔 **Filosofisk** (Philosophical)       | Deep reflections and existential musings |
| 🎙️ **Sportkommentator** (Sportscaster)  | ENERGETIC play-by-play commentary        |
| 🐈 **Kattperspektiv** (Cat Perspective) | A judgmental cat observing its human     |
| 👑 **Drama Queen**                      | Everything is DRAMATIC                   |
| 💩 **Meme**                             | Gen Z internet speak, very relatable     |
| 😬 **Cringe**                           | Awkwardly endearing self-awareness       |
| 🇬🇧 **Brittisk** (British)               | Understated elegance and dry humor       |
| 🎮 **Quest Log**                        | Your day as an RPG adventure             |
| 🥱 **Uttråkad** (Bored)                 | Minimal enthusiasm, maximum vibes        |
| 🌎 **Naturdokumentär**                  | Attenborough-style observations          |
| 🧠 **Psykolog** (Therapist)             | Therapist notes with warm insight        |
| 🤖 **AI-Robot**                         | System log with tiny hints of feelings   |
| 🎭 **Shakespeare**                      | Dramatic monologue with archaic flair    |
| 📰 **Kvällstidning** (Tabloid)          | Sensational tabloid headlines            |
| 🏛️ **Formell** (Formal)                 | Overly formal official letter            |
| 🎶 **Trubadur** (Troubadour)            | Song lyrics/ballad format                |
| 🤓 **Nördig** (Nerdy)                   | Over-explains everything with facts      |
| 🎩 **Foliehatt** (Tinfoil Hat)          | Conspiracy theories everywhere           |
| ✨ **Livscoach** (Life Coach)           | Uplifting advice and encouragement       |
| 🕵️ **Deckare** (Detective)              | Your day as a mystery to solve           |
| 🌀 **Grubblande** (Overthinker)         | Analyzing every detail, over and over    |
| 😒 **Cynisk** (Cynical)                 | Skeptical and wryly honest               |

### 📱 Multi-Platform Support

- 🌐 **Web App** – Works in any modern browser
- 📱 **Android App** – Native app via Capacitor
- 🌙 **Dark Mode** – Easy on the eyes, day or night
- 📬 **Email Delivery** – Send entries to your inbox

### 🔒 Privacy-First

- Profile data stored **locally on your device**
- Only daily entries sent to AI for generation
- No server-side storage of your diary entries
- Location data is used **only** to fetch weather (optional) and isn't stored

---

## 🛠️ Tech Stack

| Category     | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| ⚡ Framework | [SvelteKit 2.x](https://kit.svelte.dev) + [Svelte 5](https://svelte.dev) |
| 📘 Language  | [TypeScript 5.9](https://www.typescriptlang.org)                         |
| 🤖 AI        | [Anthropic Claude API](https://anthropic.com) (Claude Opus 4.5)          |
| 📬 Email     | [Resend API](https://resend.com)                                         |
| 🌤️ Weather   | [SMHI Open Data](https://opendata.smhi.se)                               |
| 📦 Build     | [Vite 7.x](https://vitejs.dev)                                           |
| 📱 Mobile    | [Capacitor 8.x](https://capacitorjs.com)                                 |
| 🚀 Hosting   | Render Blueprint (Node), see `render.yaml`; deployment status unverified |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/johannaefageras/storify.git
cd storify

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### Production Build

```bash
# Build for web
npm run build

# Preview production build
npm run preview
```

### Android Build

```bash
# Build static site for Capacitor
npm run build

# Sync with Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Required: Email delivery (Resend)
RESEND_API_KEY=re-xxxxxxxxxxxxx

# Optional: API base URL for Capacitor native app
VITE_API_BASE_URL=https://mystorify.se
```

---

## 📁 Project Structure

```
storify/
├── 📂 src/
│   ├── 📂 routes/                    # SvelteKit pages & API
│   │   ├── 📄 +page.svelte           # Landing page
│   │   ├── 📂 wizard/                # Main wizard flow
│   │   │   ├── 📄 +page.svelte       # Wizard container
│   │   │   └── 📂 steps/             # Individual wizard steps
│   │   ├── 📂 api/generate/          # AI generation endpoint
│   │   ├── 📂 about/                 # About page
│   │   ├── 📂 contact/               # Contact page
│   │   ├── 📂 privacy/               # Privacy policy
│   │   └── 📂 terms/                 # Terms of service
│   └── 📂 lib/
│       ├── 📂 stores/                # Svelte state management
│       │   ├── 📄 wizard.svelte.ts   # Wizard data store
│       │   └── 📄 theme.svelte.ts    # Theme preferences
│       ├── 📂 data/                  # Static data
│       │   ├── 📄 tones.ts           # Tone definitions
│       │   └── 📄 emojis.ts          # Emoji categories
│       └── 📂 components/            # Reusable components
│           └── 📂 emojis/            # Custom emoji SVGs
├── 📂 tones/                         # Detailed tone instructions                  # Tone overview
├── 📂 android/                       # Capacitor Android project
├── 📂 static/                        # Static assets & fonts
├── 📄 capacitor.config.ts            # Capacitor configuration
├── 📄 svelte.config.js               # SvelteKit configuration
├── 📄 vite.config.ts                 # Vite configuration
└── 📄 package.json
```

---

## 🎨 Customization

### Adding a New Tone

1. Create a new markdown file in `tones/` with detailed instructions
2. Add the tone definition to `src/lib/data/tones.ts`
3. Add a sample text in `src/lib/data/voiceSamples.ts`
4. Update the tone instructions in `src/routes/api/generate/+server.ts`

### Theming

The app uses CSS custom properties for theming. Modify colors in `src/app.css`:

```css
:root {
  --color-primary: #your-color;
  --color-background: #your-background;
  /* ... */
}
```

---

## 🌍 Language

The app is primarily in **Swedish** 🇸🇪 (UI text, tone instructions, generated content). The British tone is the exception, generating entries in English.

---

## 📊 Current Status

| Component         | Status        |
| ----------------- | ------------- |
| 🌐 Web App        | ✅ Production |
| 📱 Android App    | ✅ Production |
| 🍎 iOS App        | 🔜 Planned    |
| 🌍 Multi-language | 🔜 Planned    |
| 💾 Entry History  | 🔜 Planned    |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. 🐛 Report bugs
2. 💡 Suggest new features or tones
3. 🔧 Submit pull requests

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- 🤖 Powered by [Anthropic's Claude](https://anthropic.com)
- ⚡ Built with [SvelteKit](https://kit.svelte.dev)
- 📱 Mobile support via [Capacitor](https://capacitorjs.com)

---

<div align="center">

**Made with ❤️ for journaling enthusiasts**

[🌐 Try Storify](https://mystorify.se) · [🐛 Report Bug](https://github.com/johannaefageras/storify/issues) · [💡 Request Feature](https://github.com/johannaefageras/storify/issues)

</div>
