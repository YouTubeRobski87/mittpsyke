<script lang="ts">
  import { onMount } from 'svelte';
  import SEO from '$lib/components/SEO.svelte';
  import AccountTeaser from '$lib/components/AccountTeaser.svelte';
  import CompanionAvatar from '$lib/components/CompanionAvatar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import {
    ArrowRight,
    BarChart3,
    ChevronDown,
    Heart,
    Leaf,
    PenLine,
    Smile,
    Sparkles,
    SunMedium,
    TrendingUp,
    Wind
  } from 'lucide-svelte';
  import {
    getProgressCompanionAnimal,
    getProgressCompanionArtId,
    getProgressCompanionHeroFocus,
    type ProgressCompanionArtId,
    type ProgressCompanionSelection
  } from '$lib/progressCompanion';

  const ANONYMOUS_PREVIEW_COMPANION: ProgressCompanionSelection = { id: 'fox' };

  const GENERIC_COMPANION_HERO_IMAGE =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 640%22%3E%3Cdefs%3E%3ClinearGradient id=%22sky%22 x1=%220%22 x2=%220%22 y1=%220%22 y2=%221%22%3E%3Cstop offset=%220%25%22 stop-color=%22%23f5edcf%22/%3E%3Cstop offset=%2258%25%22 stop-color=%22%23cfe2d2%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23a8c69a%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22water%22 x1=%220%22 x2=%221%22 y1=%220%22 y2=%220%22%3E%3Cstop offset=%220%25%22 stop-color=%22%238fb6b2%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23d7e9d6%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%221200%22 height=%22640%22 fill=%22url(%23sky)%22/%3E%3Cpath d=%22M0 310 C150 230 280 250 410 300 C560 360 690 260 830 285 C980 315 1060 245 1200 280 L1200 640 L0 640 Z%22 fill=%22%237fa071%22 opacity=%220.48%22/%3E%3Cpath d=%22M0 390 C190 335 350 360 520 395 C710 435 905 370 1200 400 L1200 640 L0 640 Z%22 fill=%22url(%23water)%22 opacity=%220.82%22/%3E%3Cpath d=%22M0 500 C190 450 360 470 520 510 C710 555 920 485 1200 515 L1200 640 L0 640 Z%22 fill=%22%238aaa76%22/%3E%3Ccircle cx=%22910%22 cy=%22132%22 r=%2276%22 fill=%22%23fff5cf%22 opacity=%220.82%22/%3E%3Cpath d=%22M160 0 C120 140 126 300 92 640 H250 C218 400 225 180 296 0 Z%22 fill=%22%235c4d37%22 opacity=%220.82%22/%3E%3Cpath d=%22M178 0 C152 152 158 300 134 640%22 fill=%22none%22 stroke=%22%23443627%22 stroke-width=%2210%22 opacity=%220.38%22/%3E%3Cg fill=%22%23799b62%22 opacity=%220.62%22%3E%3Ccircle cx=%22202%22 cy=%2280%22 r=%2274%22/%3E%3Ccircle cx=%22290%22 cy=%2254%22 r=%2265%22/%3E%3Ccircle cx=%22110%22 cy=%2252%22 r=%2260%22/%3E%3Ccircle cx=%22366%22 cy=%2290%22 r=%2254%22/%3E%3C/g%3E%3C/svg%3E';

  type DashboardData = {
    diaryPreview: {
      id: string | null;
      snippet: string;
      dateLabel: string;
      hasEntry: boolean;
    };
    progressPreview: {
      currentStreak: number;
      weeklyEntries: number;
      totalEntries: number;
      summary: string;
    };
    settingsPreview: {
      displayName: string | null;
      themeLabel: string;
      weeklyGoalLabel: string;
      dashboardFocusLabel: string;
    };
    progressCompanion: ProgressCompanionSelection | string | null;
    isAnonymous?: boolean;
  };

  type CompanionBadgeMessage = {
    label: string;
    note: string;
  };

  function getLocalGreeting(hour: number): CompanionBadgeMessage {
    if (hour >= 5 && hour <= 10) return { label: 'God morgon', note: 'En ny dag börjar.' };
    if (hour >= 11 && hour <= 16) return { label: 'God dag', note: 'En sak i taget.' };
    if (hour >= 17 && hour <= 21) return { label: 'God kväll', note: 'Du får landa här.' };
    return { label: 'God natt', note: 'Det får vara stilla nu.' };
  }

  function getCompanionBadgeMessage(hour: number | null): CompanionBadgeMessage {
    return getLocalGreeting(hour ?? new Date().getHours());
  }

  let { data } = $props<{ data: DashboardData }>();

  let progressExpanded = $state(false);
  let localHour = $state<number | null>(null);

  const diaryPreview = $derived(data.diaryPreview);
  const progressPreview = $derived(data.progressPreview);
  const settingsPreview = $derived(data.settingsPreview);
  const isAnonymous = $derived(Boolean(data.isAnonymous));
  const displayName = $derived(settingsPreview.displayName);
  const greeting = $derived(
    isAnonymous ? 'Välkommen hit' : `Välkommen tillbaka${displayName ? `, ${displayName}` : ''}`
  );
  const displayedCompanionSelection = $derived(
    isAnonymous ? ANONYMOUS_PREVIEW_COMPANION : data.progressCompanion
  );
  const selectedCompanion = $derived(getProgressCompanionAnimal(displayedCompanionSelection));
  const hasSelectedCompanion = $derived(Boolean(selectedCompanion));
  const companionArtId = $derived(getProgressCompanionArtId(selectedCompanion?.id ?? 'fox'));
  const companionName = $derived(selectedCompanion?.name ?? 'Din följeslagare');
  const companionHeroImage = $derived('/images/home-companion-fox-awake.webp');
  // Följeslagaren som hero-scenen visar. Räven är vaken och aktiv — fokus hämtas ur
  // konfigurationen så CSS aldrig behöver ändras när bilden byts.
  const heroCompanionId: ProgressCompanionArtId = 'fox';
  const heroFocus = $derived(getProgressCompanionHeroFocus(heroCompanionId));
  const companionHeroAlt =
  'En vaken, nyfiken räv sitter vid ett träd i en varm och stillsam naturmiljö vid en sjö';
  const companionBadgeMessage = $derived(getCompanionBadgeMessage(localHour));
  const moodLabel = $derived(progressPreview.weeklyEntries > 0 ? 'Bra' : 'Redo');
  const latestActivity = $derived(
    isAnonymous
      ? [
          {
            icon: PenLine,
            tone: 'green',
            title: 'Din dagbok kan följa med dig',
            time: 'När du vill spara'
          },
          {
            icon: Wind,
            tone: 'purple',
            title: 'Dina små steg kan samlas här',
            time: 'I din takt'
          },
          {
            icon: Smile,
            tone: 'mint',
            title: 'Historiken väntar stilla',
            time: 'Om du skapar konto'
          }
        ]
      : [
          {
            icon: PenLine,
            tone: 'green',
            title: diaryPreview.hasEntry ? 'Du skrev i din dagbok' : 'Din dagbok väntar på dig',
            time: diaryPreview.hasEntry ? diaryPreview.dateLabel || 'Senast' : 'När du vill'
          },
          {
            icon: Wind,
            tone: 'purple',
            title: 'Du gjorde en andningsövning',
            time: progressPreview.weeklyEntries > 0 ? 'Igår kl. 20:15' : 'Ett lugnt första steg'
          },
          {
            icon: Smile,
            tone: 'mint',
            title: 'Du uppdaterade ditt mående',
            time: progressPreview.currentStreak > 0 ? `${progressPreview.currentStreak} dag nära i tid` : 'Idag'
          }
        ]
  );

  onMount(() => {
    const updateLocalTime = () => {
      localHour = new Date().getHours();
    };

    updateLocalTime();
    const interval = window.setInterval(updateLocalTime, 60 * 1000);
    return () => window.clearInterval(interval);
  });
</script>

<SEO canonical="https://www.mittpsyke.se/dashboard" />

<div class="mp-dashboard">
  <div class="dashboard-shell">
    <Sidebar active="hem" showLogout={!isAnonymous} />

    <main class="dashboard-main" aria-labelledby="dashboard-title">
      <header class="topbar">
        <div>
          {#if isAnonymous}
            <a class="home-return-link" href="/">&larr; Till startsidan</a>
          {/if}
          <h1 id="dashboard-title">{greeting}</h1>
          <p>Hur mår du idag?</p>
        </div>

        <div class="topbar-actions" aria-label="Kontroller">
          {#if isAnonymous}
            <a class="soft-account-link" href="/register">Spara platsen</a>
          {:else}
            <a class="avatar-button" href="/dashboard/installningar" aria-label="Öppna inställningar">
              <CompanionAvatar selection={data.progressCompanion} size="lg" decorative />
            </a>
          {/if}
        </div>
      </header>

      <section
        class="companion-hero"
        class:personal-preview={isAnonymous}
        data-companion={heroCompanionId}
        aria-labelledby="companion-title"
        style={`--hero-image: url('${companionHeroImage}'); --hero-focus: ${heroFocus};`}
      >
        <img
          src={companionHeroImage}
          alt={companionHeroAlt}
          decoding="async"
        />
        <div class="hero-copy">
          <h2 id="companion-title">Din följeslagare</h2>
          <p>Den finns kvar här när du återvänder.</p>
          <span class="soft-heart">
            <Heart size={23} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </span>
        </div>
        <div class="time-badge" aria-label={companionBadgeMessage.label}>
          <SunMedium size={24} aria-hidden="true" />
          <span>
            <strong>{companionBadgeMessage.label}</strong>
            <small>{companionBadgeMessage.note}</small>
          </span>
        </div>
        {#if isAnonymous}
          <div class="preview-note hero-preview-note">
            <AccountTeaser variant="dashboard" mode="overlay" />
          </div>
        {/if}
      </section>

      <div class="dashboard-body">
        <div class="dashboard-content">
      <section class="quick-grid" aria-label="Snabb översikt">
        <article class="quick-card mood-card">
          <div class="card-head">
            <div>
              <h2>Ditt mående idag</h2>
              <p>Hur känner du dig just nu?</p>
            </div>
            <TrendingUp size={20} aria-hidden="true" />
          </div>
          <div class="mood-face" aria-label={`Mående: ${moodLabel}`}>
            <span class="eye left"></span>
            <span class="eye right"></span>
            <span class="mouth"></span>
          </div>
          <strong class="mood-label">{moodLabel}</strong>
          <a class="card-button" href="/humorsparning">
            Uppdatera mående
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </article>

        <article class="quick-card tools-card">
          <div class="card-head">
            <div>
              <h2>Verktyg för dig</h2>
              <p>Utforska övningar och verktyg som kan hjälpa dig.</p>
            </div>
            <Heart size={22} aria-hidden="true" />
          </div>
          <div class="leaf-mark" aria-hidden="true">
            <Leaf size={66} strokeWidth={1.4} />
            <Sparkles class="spark-mark" size={17} />
          </div>
          <a class="card-button" href="/ovningar">
            Visa verktyg
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </article>

        <a
          class="quick-card insight-card quick-card-link"
          class:personal-preview={isAnonymous}
          href="/framsteg"
          aria-label="Öppna Framsteg"
        >
          <div class="card-head">
            <div>
              <h2>Dina insikter</h2>
              <p>Små steg leder till stora förändringar.</p>
            </div>
          </div>
          <div class="chart-mark" aria-hidden="true">
            <BarChart3 size={72} strokeWidth={1.5} />
            <Sparkles class="spark-mark" size={16} />
          </div>
          <span class="card-button">
            Öppna framsteg
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </a>
      </section>

      <section class="lower-grid">
        <article class="activity-card" class:personal-preview={isAnonymous}>
          <header>
            <h2>Senaste aktivitet</h2>
          </header>

          <div class="activity-list">
            {#each latestActivity as activity}
              {@const ActivityIcon = activity.icon}
              <div class="activity-item">
                <span class:green={activity.tone === 'green'} class:purple={activity.tone === 'purple'} class:mint={activity.tone === 'mint'} class="activity-icon">
                  <ActivityIcon size={19} strokeWidth={2} />
                </span>
                <span>
                  <strong>{activity.title}</strong>
                  <small>{activity.time}</small>
                </span>
              </div>
            {/each}
          </div>

          <a class="text-link" href="/dagbok">
            Visa all aktivitet
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </article>

        <article class="quote-card">
          <div class="quote-mark" aria-hidden="true">“</div>
          <blockquote>
            Det räcker att du är här.<br />
            En liten stund i taget.
          </blockquote>
          <span class="quote-heart">
            <Heart size={26} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </span>
          <div class="mountains" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </article>
      </section>
        </div>

        <aside class="framsteg-aside" aria-label="Framsteg">
          <section class="framsteg-panel" class:personal-preview={isAnonymous}>
            <button
              class="framsteg-panel-toggle"
              type="button"
              aria-controls="dashboard-framsteg-details"
              aria-expanded={progressExpanded}
              onclick={() => (progressExpanded = !progressExpanded)}
            >
              <span class="framsteg-panel-head">
                <span class="framsteg-panel-icon" aria-hidden="true">
                  <Leaf size={22} strokeWidth={1.8} />
                </span>
                <span class="framsteg-title-wrap">
                  <span class="framsteg-title">Framsteg</span>
                  <span class="framsteg-subtitle">{progressExpanded ? 'Dölj överblicken' : 'Visa mer här'}</span>
                </span>
              </span>
              <span class={`framsteg-expand-icon ${progressExpanded ? 'expanded' : ''}`} aria-hidden="true">
                <ChevronDown size={20} />
              </span>
            </button>
            <p class="framsteg-panel-lead">{progressPreview.summary}</p>
            <div class="framsteg-panel-stats">
              <div class="framsteg-stat">
                <strong>{progressPreview.totalEntries}</strong>
                <span>Texter skrivna</span>
              </div>
              <div class="framsteg-stat">
                <strong>{progressPreview.currentStreak}</strong>
                <span>Dagar i följd</span>
              </div>
              <div class="framsteg-stat">
                <strong>{progressPreview.weeklyEntries}</strong>
                <span>Den här veckan</span>
              </div>
            </div>
            {#if progressExpanded}
              <div id="dashboard-framsteg-details" class="framsteg-panel-details">
                <h3>Din lugna överblick</h3>
                <p>
                  Här samlas dina små steg utan att du behöver lämna Mitt rum. Fortsätt i samma takt och låt mönster
                  växa fram över tid.
                </p>
                <ul>
                  <li>{progressPreview.totalEntries} texter finns sparade i din historik.</li>
                  <li>{progressPreview.weeklyEntries} steg har lagts till den här veckan.</li>
                  <li>{progressPreview.currentStreak} dagar i följd syns som små avtryck.</li>
                </ul>
              </div>
            {/if}
          </section>
        </aside>
      </div>

      <p class="dashboard-footer">
        <Leaf size={14} aria-hidden="true" />
        MittPsyke - för din mentala välmående resa
      </p>
    </main>
  </div>
</div>

<style>
  .mp-dashboard {
    --mp-card: rgba(255, 255, 255, 0.92);
    --mp-card-solid: #fffdf8;
    --mp-card-border: rgba(52, 91, 55, 0.1);
    --mp-text: #1f231c;
    --mp-text-dim: #6d746a;
    --mp-green: #3a7a52;
    --mp-green-soft: #e4f3e0;
    --mp-blue: #4a7fd4;
    --mp-blue-soft: #edf4ff;
    --mp-purple: #9b7ec8;
    --mp-purple-soft: #f5f0fc;
    --mp-yellow: #e8bc4a;
    --mp-radius: 16px;
    --mp-shadow: 0 14px 36px rgba(69, 83, 61, 0.07);
    color: var(--mp-text);
    min-height: 100vh;
    background:
      radial-gradient(820px 440px at 82% 0%, rgba(232, 244, 224, 0.55), transparent 64%),
      radial-gradient(680px 360px at 6% 96%, rgba(250, 238, 214, 0.42), transparent 62%),
      linear-gradient(160deg, #fffefb 0%, #faf7f0 42%, #f2f7ee 100%);
  }

  .dashboard-shell {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    min-height: 100vh;
  }

  .dashboard-main {
    display: flex;
    flex-direction: column;
    gap: 28px;
    padding: 44px 48px 24px;
    min-width: 0;
  }

  .dashboard-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(280px, 26%, 340px);
    gap: 20px;
    align-items: start;
  }

  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 28px;
    min-width: 0;
  }

  .framsteg-aside {
    position: sticky;
    top: 24px;
    min-width: 0;
  }

  .framsteg-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 22px;
    border-radius: var(--mp-radius);
    border: 1px solid var(--mp-card-border);
    background: linear-gradient(150deg, rgba(234, 248, 230, 0.9), rgba(255, 255, 253, 0.94));
    box-shadow: 0 10px 28px rgba(69, 83, 61, 0.06);
  }

  .framsteg-panel-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .framsteg-panel-toggle:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--mp-green) 32%, transparent);
    outline-offset: 5px;
    border-radius: 12px;
  }

  .framsteg-panel-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
  }

  .framsteg-panel-icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: var(--mp-green-soft);
    color: var(--mp-green);
    flex: 0 0 auto;
  }

  .framsteg-title-wrap {
    display: grid;
    gap: 0.12rem;
    min-width: 0;
  }

  .framsteg-title {
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.15;
  }

  .framsteg-subtitle {
    color: var(--mp-text-dim);
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .framsteg-expand-icon {
    flex: 0 0 auto;
    color: var(--mp-green);
    transition: transform 0.18s ease;
  }

  .framsteg-expand-icon.expanded {
    transform: rotate(180deg);
  }

  .framsteg-panel-lead {
    margin: 0;
    color: var(--mp-text-dim);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .framsteg-panel-stats {
    display: grid;
    gap: 10px;
  }

  .framsteg-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--mp-card-border);
  }

  .framsteg-stat strong {
    font-size: 1.35rem;
    line-height: 1;
    color: var(--mp-text);
  }

  .framsteg-stat span {
    color: var(--mp-text-dim);
    font-size: 0.85rem;
    text-align: right;
  }

  .framsteg-panel-details {
    display: grid;
    gap: 0.75rem;
    padding: 0.95rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.64);
    border: 1px solid var(--mp-card-border);
  }

  .framsteg-panel-details h3,
  .framsteg-panel-details p {
    margin: 0;
  }

  .framsteg-panel-details h3 {
    font-size: 0.95rem;
    line-height: 1.2;
  }

  .framsteg-panel-details p,
  .framsteg-panel-details li {
    color: var(--mp-text-dim);
    font-size: 0.86rem;
    line-height: 1.5;
  }

  .framsteg-panel-details ul {
    display: grid;
    gap: 0.42rem;
    margin: 0;
    padding-left: 1.1rem;
  }

  .topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    padding-bottom: 0.35rem;
  }

  .topbar h1 {
    margin: 0;
    font-size: clamp(1.9rem, 3.1vw, 2.3rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .home-return-link {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    margin-bottom: 0.7rem;
    color: var(--mp-green);
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
  }

  .home-return-link:hover,
  .home-return-link:focus-visible {
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .topbar p {
    margin: 0.6rem 0 0;
    color: var(--mp-text-dim);
    font-size: 1.05rem;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 0 0 auto;
  }

  .avatar-button {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    text-decoration: none;
  }

  .avatar-button {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(38, 60, 38, 0.08);
    box-shadow: 0 6px 18px rgba(69, 83, 61, 0.05);
  }

  .avatar-button :global(.companion-avatar) {
    width: 44px;
    height: 44px;
  }

  .soft-account-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0.62rem 1rem;
    border-radius: 8px;
    border: 1px solid rgba(85, 124, 104, 0.18);
    background: rgba(255, 255, 255, 0.72);
    color: #405b4e;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 10px 24px rgba(69, 83, 61, 0.07);
  }

  .companion-hero {
    position: relative;
    height: clamp(320px, 28vw, 420px);
    min-height: 320px;
    overflow: hidden;
    border-radius: var(--mp-radius);
    box-shadow: var(--mp-shadow);
    border: 1px solid rgba(255, 255, 255, 0.88);
    background:
      linear-gradient(135deg, #f7f3e8 0%, #e8f0e4 52%, #dce8e2 100%);
  }

  .personal-preview {
    position: relative;
    overflow: hidden;
  }

  .personal-preview::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    background: rgba(255, 253, 248, 0.22);
    backdrop-filter: blur(1.5px);
    pointer-events: none;
  }

  .companion-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: var(--hero-image);
    background-size: cover;
    /* Följ samma fokus som förgrundsbilden så den suddiga bakgrunden matchar */
    background-position: var(--hero-focus, 70% 64%);
    opacity: 0.35;
    filter: blur(10px) saturate(1.04);
    transform: scale(1.03);
    pointer-events: none;
  }

  .companion-hero.personal-preview::before {
    opacity: 0.28;
    filter: blur(8px) saturate(0.96);
  }

  .personal-preview > :not(.preview-note) {
    opacity: 0.88;
    filter: saturate(0.94);
  }

  .companion-hero.personal-preview > :not(.preview-note) {
    opacity: 1;
    filter: none;
  }

  .preview-note {
    position: absolute;
    z-index: 4;
  }

  .hero-preview-note {
    right: clamp(18px, 3vw, 34px);
    bottom: clamp(18px, 3vw, 34px);
    width: min(28rem, calc(100% - 36px));
  }

  .companion-hero img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* Fokus styrs per följeslagare via --hero-focus (standard: nedre högra tredjedelen där djuret sitter) */
    object-position: var(--hero-focus, 70% 64%);
    display: block;
    z-index: 0;
  }

  .companion-hero[data-companion='bear'] img {
    width: min(62%, 720px);
    height: 100%;
    inset: auto 0 0 auto;
    left: auto;
    object-fit: contain;
    object-position: right bottom;
    filter: saturate(1.02);
  }

  .companion-hero[data-companion='fox'] img {
    object-fit: cover;
    /* Håll räven (nedre högra tredjedelen) helt i bild oavsett kortets bredd */
    object-position: var(--hero-focus, 70% 64%);
  }

  .companion-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 247, 0.92) 0%,
        rgba(255, 253, 247, 0.62) 34%,
        rgba(255, 253, 247, 0.08) 52%,
        transparent 68%
      ),
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 38%, rgba(255, 255, 255, 0.06));
    pointer-events: none;
  }

  .selected-companion-mark {
    position: absolute;
    z-index: 2;
    right: clamp(34px, 8vw, 112px);
    bottom: clamp(34px, 7vw, 82px);
    width: clamp(96px, 13vw, 148px);
    height: clamp(96px, 13vw, 148px);
    filter: drop-shadow(0 18px 28px rgba(52, 67, 46, 0.22));
  }

  .selected-companion-mark :global(.companion-avatar) {
    width: 100%;
    height: 100%;
  }

  .hero-copy {
    position: absolute;
    z-index: 2;
    left: clamp(24px, 4vw, 48px);
    top: clamp(36px, 6vw, 72px);
    max-width: min(22rem, 42%);
  }

  .hero-copy h2 {
    margin: 0;
    color: #2a3d2e;
    font-size: clamp(1.75rem, 3vw, 2.35rem);
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  .hero-copy p {
    margin: 0.75rem 0 1.1rem;
    color: #5a6658;
    font-size: 1.02rem;
    line-height: 1.5;
  }

  .soft-heart {
    color: #7fb888;
  }

  .time-badge {
    position: absolute;
    z-index: 2;
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.72rem 0.95rem;
    border-radius: 12px;
    background: rgba(255, 252, 245, 0.94);
    border: 1px solid rgba(232, 220, 190, 0.45);
    box-shadow: 0 8px 22px rgba(69, 83, 61, 0.08);
    color: #d4a017;
  }

  .time-badge span {
    display: grid;
    gap: 0.15rem;
    color: var(--mp-text);
  }

  .time-badge small {
    color: var(--mp-text-dim);
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .quick-card,
  .activity-card,
  .quote-card {
    border-radius: var(--mp-radius);
    border: 1px solid var(--mp-card-border);
    background: var(--mp-card);
    box-shadow: 0 10px 28px rgba(69, 83, 61, 0.06);
  }

  .quick-card {
    min-height: 220px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .quick-card-link {
    color: inherit;
    text-decoration: none;
    transition:
      border-color 0.16s ease,
      box-shadow 0.16s ease,
      transform 0.16s ease;
  }

  .quick-card-link:hover,
  .quick-card-link:focus-visible {
    border-color: color-mix(in srgb, var(--accent, var(--mp-green)) 28%, transparent);
    box-shadow: 0 14px 34px rgba(69, 83, 61, 0.1);
    transform: translateY(-1px);
    outline: none;
  }

  .mood-card {
    background: linear-gradient(145deg, rgba(234, 248, 230, 0.96), rgba(255, 255, 253, 0.92));
    --accent: var(--mp-green);
  }

  .tools-card {
    background: linear-gradient(145deg, rgba(237, 244, 255, 0.96), rgba(252, 254, 255, 0.92));
    --accent: var(--mp-blue);
  }

  .insight-card {
    background: linear-gradient(145deg, rgba(245, 240, 252, 0.96), rgba(255, 253, 255, 0.92));
    --accent: var(--mp-purple);
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--accent, var(--mp-green));
  }

  .card-head :global(svg) {
    opacity: 0.55;
  }

  .card-head h2 {
    margin: 0;
    color: var(--mp-text);
    font-size: 1.05rem;
  }

  .card-head p {
    margin: 0.55rem 0 0;
    color: var(--mp-text-dim);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .mood-face {
    position: relative;
    width: 68px;
    height: 68px;
    margin: auto auto 0;
    border-radius: 50%;
    background: #bfe6bd;
    box-shadow: inset 0 0 0 9px rgba(91, 182, 98, 0.18);
  }

  .eye {
    position: absolute;
    top: 28px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #35974a;
  }

  .eye.left {
    left: 24px;
  }

  .eye.right {
    right: 24px;
  }

  .mouth {
    position: absolute;
    left: 23px;
    top: 39px;
    width: 22px;
    height: 10px;
    border-bottom: 4px solid #35974a;
    border-radius: 0 0 999px 999px;
  }

  .mood-label {
    text-align: center;
    color: var(--mp-green);
  }

  .leaf-mark,
  .chart-mark {
    position: relative;
    display: grid;
    place-items: center;
    flex: 1;
    color: var(--accent);
    opacity: 0.5;
  }

  .leaf-mark :global(.spark-mark),
  .chart-mark :global(.spark-mark) {
    position: absolute;
    transform: translate(2.2rem, -1.4rem);
    color: #bba0ff;
  }

  .card-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-height: 38px;
    margin-top: auto;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--accent, var(--mp-green)) 22%, transparent);
    color: var(--accent, var(--mp-green));
    background: rgba(255, 255, 255, 0.72);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.88rem;
    font-family: inherit;
    transition: background 0.16s ease;
    cursor: pointer;
  }

  .card-button:hover,
  .card-button:focus-visible {
    background: rgba(255, 255, 255, 0.95);
  }

  .lower-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 20px;
  }

  .activity-card,
  .quote-card {
    min-height: 242px;
    padding: 24px;
  }

  .activity-card {
    background: rgba(255, 255, 255, 0.96);
  }

  .activity-card h2 {
    margin: 0;
    font-size: 1rem;
  }

  .activity-list {
    display: grid;
    gap: 1rem;
    margin: 1rem 0 1.25rem;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .activity-icon {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    border-radius: 50%;
  }

  .activity-icon.green {
    color: #23833d;
    background: #dff1df;
  }

  .activity-icon.purple {
    color: #7641bd;
    background: #efe3ff;
  }

  .activity-icon.mint {
    color: #2e9445;
    background: #d9f4d9;
  }

  .activity-item strong,
  .activity-item small {
    display: block;
  }

  .activity-item strong {
    font-size: 0.9rem;
  }

  .activity-item small {
    margin-top: 0.2rem;
    color: var(--mp-text-dim);
    font-size: 0.84rem;
  }

  .text-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--mp-card-border);
    color: var(--mp-green);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .quote-card {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255, 246, 228, 0.98), rgba(255, 251, 240, 0.94)),
      #fff8ed;
    border-color: rgba(210, 186, 140, 0.18);
  }

  .quote-mark {
    color: var(--mp-yellow);
    font-size: 4rem;
    font-weight: 900;
    line-height: 0.75;
  }

  .quote-card blockquote {
    position: relative;
    z-index: 1;
    margin: 0.55rem 0 1.3rem;
    font-size: clamp(1.2rem, 2vw, 1.45rem);
    line-height: 1.45;
    font-weight: 700;
  }

  .quote-heart {
    position: relative;
    z-index: 1;
    color: var(--mp-yellow);
  }

  .mountains {
    position: absolute;
    inset: auto 0 0;
    height: 38%;
    opacity: 0.48;
  }

  .mountains span {
    position: absolute;
    inset: auto -4% 0;
    height: 68%;
    background: #b8cfa8;
    clip-path: polygon(0 100%, 13% 63%, 23% 80%, 35% 38%, 48% 76%, 59% 44%, 74% 78%, 86% 52%, 100% 82%, 100% 100%);
  }

  .mountains span:nth-child(2) {
    height: 88%;
    background: #d4dfc4;
    transform: translateY(16px);
    opacity: 0.62;
  }

  .mountains span:nth-child(3) {
    height: 55%;
    background: #ebe8d8;
    transform: translateY(8px);
    opacity: 0.72;
  }

  .dashboard-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    margin: 0;
    color: #7d8579;
    font-size: 0.85rem;
  }

  .mp-dashboard :global(.mp-sidebar) {
    min-height: 100vh;
    position: sticky;
    top: 0;
    border-width: 0 1px 0 0;
    border-color: rgba(52, 91, 55, 0.08);
    border-radius: 0;
    padding: 36px 20px;
    background: rgba(255, 253, 248, 0.88);
    box-shadow: none;
  }

  .mp-dashboard :global(.mp-sidebar .nav a.active) {
    background: linear-gradient(135deg, rgba(228, 241, 222, 0.92), rgba(240, 248, 236, 0.82));
    color: #356944;
  }

  .mp-dashboard :global(.mp-sidebar .support-card) {
    background: rgba(255, 255, 255, 0.78);
    border-color: rgba(52, 91, 55, 0.08);
    min-height: 96px;
    color: #9fd4a8;
  }

  @media (max-width: 980px) {
    .dashboard-shell {
      grid-template-columns: 1fr;
    }

    .dashboard-main {
      padding: 24px 22px 20px;
      gap: 24px;
    }

    .quick-grid,
    .lower-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-body {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .framsteg-aside {
      position: static;
    }

    .hero-copy {
      max-width: min(20rem, 48%);
    }

    .mp-dashboard :global(.mp-sidebar) {
      min-height: auto;
      position: static;
      border-width: 0 0 1px;
      padding: 18px;
    }
  }

  @media (max-width: 620px) {
    .dashboard-main {
      padding: 16px 14px 18px;
      gap: 20px;
    }

    .topbar {
      align-items: flex-start;
      gap: 1rem;
    }

    .topbar h1 {
      font-size: 1.5rem;
    }

    .topbar p {
      font-size: 0.98rem;
    }

    .topbar-actions {
      gap: 0.5rem;
      padding-top: 0.15rem;
    }

    .avatar-button {
      width: 40px;
      height: 40px;
    }

    .companion-hero {
      height: clamp(280px, 72vw, 340px);
      min-height: 280px;
    }

    .companion-hero[data-companion='bear'] img {
      width: min(58%, 280px);
      object-position: right bottom;
    }

    .companion-hero::after {
      background:
        linear-gradient(
          90deg,
          rgba(255, 253, 247, 0.94) 0%,
          rgba(255, 253, 247, 0.72) 40%,
          rgba(255, 253, 247, 0.12) 58%,
          transparent 72%
        ),
        linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 42%);
    }

    .hero-copy {
      left: 16px;
      top: 20px;
      max-width: 46%;
    }

    .hero-copy h2 {
      font-size: 1.35rem;
    }

    .hero-copy p {
      margin: 0.5rem 0 0.75rem;
      font-size: 0.88rem;
    }

    .soft-heart :global(svg) {
      width: 20px;
      height: 20px;
    }

    .selected-companion-mark {
      right: 16px;
      bottom: 72px;
      width: 88px;
      height: 88px;
    }

    .time-badge {
      top: 12px;
      right: 12px;
      left: auto;
      bottom: auto;
      padding: 0.55rem 0.72rem;
      gap: 0.5rem;
      max-width: calc(100% - 24px);
    }

    .time-badge :global(svg) {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .time-badge strong {
      font-size: 0.82rem;
    }

    .time-badge small {
      font-size: 0.72rem;
    }

    .companion-hero.personal-preview .time-badge {
      display: none;
    }

    .hero-preview-note {
      right: 12px;
      bottom: 12px;
      left: 12px;
      width: auto;
    }

    .quick-card,
    .activity-card,
    .quote-card {
      padding: 18px;
    }

    .quick-card {
      min-height: 200px;
    }
  }

  @media (max-width: 390px) {
    .dashboard-main {
      padding: 14px 12px 16px;
    }

    .hero-copy {
      max-width: 50%;
    }

    .hero-copy h2 {
      font-size: 1.22rem;
    }

    .companion-hero[data-companion='bear'] img {
      width: min(54%, 240px);
    }

    .time-badge {
      padding: 0.48rem 0.62rem;
    }
  }

  @media (max-width: 320px) {
    .topbar h1 {
      font-size: 1.32rem;
    }

    .hero-copy {
      max-width: 52%;
    }

    .hero-copy p {
      display: none;
    }

    .companion-hero {
      min-height: 260px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-button {
      transition: none;
    }
  }
</style>
