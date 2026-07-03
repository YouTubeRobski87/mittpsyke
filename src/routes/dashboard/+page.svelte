<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
  import AccountTeaser from '$lib/components/AccountTeaser.svelte';
  import CompanionAvatar from '$lib/components/CompanionAvatar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import {
    ArrowRight,
    BarChart3,
    Bell,
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
    type ProgressCompanionArtId,
    type ProgressCompanionSelection
  } from '$lib/progressCompanion';

  const GENERIC_COMPANION_HERO_IMAGE =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 640%22%3E%3Cdefs%3E%3ClinearGradient id=%22sky%22 x1=%220%22 x2=%220%22 y1=%220%22 y2=%221%22%3E%3Cstop offset=%220%25%22 stop-color=%22%23f5edcf%22/%3E%3Cstop offset=%2258%25%22 stop-color=%22%23cfe2d2%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23a8c69a%22/%3E%3C/linearGradient%3E%3ClinearGradient id=%22water%22 x1=%220%22 x2=%221%22 y1=%220%22 y2=%220%22%3E%3Cstop offset=%220%25%22 stop-color=%22%238fb6b2%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%23d7e9d6%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%221200%22 height=%22640%22 fill=%22url(%23sky)%22/%3E%3Cpath d=%22M0 310 C150 230 280 250 410 300 C560 360 690 260 830 285 C980 315 1060 245 1200 280 L1200 640 L0 640 Z%22 fill=%22%237fa071%22 opacity=%220.48%22/%3E%3Cpath d=%22M0 390 C190 335 350 360 520 395 C710 435 905 370 1200 400 L1200 640 L0 640 Z%22 fill=%22url(%23water)%22 opacity=%220.82%22/%3E%3Cpath d=%22M0 500 C190 450 360 470 520 510 C710 555 920 485 1200 515 L1200 640 L0 640 Z%22 fill=%22%238aaa76%22/%3E%3Ccircle cx=%22910%22 cy=%22132%22 r=%2276%22 fill=%22%23fff5cf%22 opacity=%220.82%22/%3E%3Cpath d=%22M160 0 C120 140 126 300 92 640 H250 C218 400 225 180 296 0 Z%22 fill=%22%235c4d37%22 opacity=%220.82%22/%3E%3Cpath d=%22M178 0 C152 152 158 300 134 640%22 fill=%22none%22 stroke=%22%23443627%22 stroke-width=%2210%22 opacity=%220.38%22/%3E%3Cg fill=%22%23799b62%22 opacity=%220.62%22%3E%3Ccircle cx=%22202%22 cy=%2280%22 r=%2274%22/%3E%3Ccircle cx=%22290%22 cy=%2254%22 r=%2265%22/%3E%3Ccircle cx=%22110%22 cy=%2252%22 r=%2260%22/%3E%3Ccircle cx=%22366%22 cy=%2290%22 r=%2254%22/%3E%3C/g%3E%3C/svg%3E';

  function getDashboardCompanionHeroImage(artId: ProgressCompanionArtId, hasSelectedCompanion: boolean) {
    if (!hasSelectedCompanion || artId === 'fox') return '/images/home-companion-fox.webp';
    if (artId === 'bear') return '/images/home-companion-bear.webp';
    return GENERIC_COMPANION_HERO_IMAGE;
  }

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

  let { data } = $props<{ data: DashboardData }>();

  const diaryPreview = $derived(data.diaryPreview);
  const progressPreview = $derived(data.progressPreview);
  const settingsPreview = $derived(data.settingsPreview);
  const isAnonymous = $derived(Boolean(data.isAnonymous));
  const displayName = $derived(settingsPreview.displayName);
  const greeting = $derived(
    isAnonymous ? 'Välkommen hit' : `Välkommen tillbaka${displayName ? `, ${displayName}` : ''}`
  );
  const selectedCompanion = $derived(getProgressCompanionAnimal(data.progressCompanion));
  const hasSelectedCompanion = $derived(Boolean(selectedCompanion));
  const companionArtId = $derived(getProgressCompanionArtId(selectedCompanion?.id ?? 'fox'));
  const companionName = $derived(selectedCompanion?.name ?? 'Din följeslagare');
  const companionHeroImage = $derived(getDashboardCompanionHeroImage(companionArtId, hasSelectedCompanion));
  const companionHeroAlt = $derived(
    hasSelectedCompanion
      ? `${companionName} vilar på sin lugna plats`
      : 'En lugn plats i naturen där din följeslagare vilar'
  );
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
</script>

<SEO canonical="https://www.mittpsyke.se/dashboard" />

<div class="mp-dashboard">
  <div class="dashboard-shell">
    <Sidebar active="hem" showLogout={!isAnonymous} />

    <main class="dashboard-main" aria-labelledby="dashboard-title">
      <header class="topbar">
        <div>
          <h1 id="dashboard-title">{greeting}</h1>
          <p>Hur mår du idag?</p>
        </div>

        <div class="topbar-actions" aria-label="Kontroller">
          {#if isAnonymous}
            <a class="soft-account-link" href="/register">Skapa konto</a>
          {:else}
            <a class="icon-button" href="/notiser" aria-label="Öppna notiser">
              <Bell size={21} strokeWidth={1.9} />
            </a>
            <a class="avatar-button" href="/dashboard/installningar" aria-label="Öppna inställningar">
              <CompanionAvatar selection={data.progressCompanion} size="lg" decorative />
            </a>
          {/if}
        </div>
      </header>

      <section class="companion-hero" class:personal-preview={isAnonymous} inert={isAnonymous} data-companion={companionArtId} aria-labelledby="companion-title">
        <img
          src={companionHeroImage}
          alt={companionHeroAlt}
          decoding="async"
        />
        {#if hasSelectedCompanion && companionArtId !== 'bear' && companionArtId !== 'fox'}
          <div class="selected-companion-mark" aria-hidden="true">
            <CompanionAvatar selection={data.progressCompanion} size="xl" decorative animated={false} />
          </div>
        {/if}
        <div class="hero-copy">
          <h2 id="companion-title">{companionName}</h2>
          <p>Den finns kvar här när du återvänder.</p>
          <span class="soft-heart">
            <Heart size={23} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </span>
        </div>
        <div class="time-badge" aria-label="God morgon">
          <SunMedium size={24} aria-hidden="true" />
          <span>
            <strong>God morgon</strong>
            <small>En ny dag börjar.</small>
          </span>
        </div>
      </section>

      {#if isAnonymous}
        <AccountTeaser variant="dashboard" />
      {/if}

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

        <article class="quick-card insight-card" class:personal-preview={isAnonymous} inert={isAnonymous}>
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
          <a class="card-button" href="/framsteg">
            Se statistik
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </article>
      </section>

      <section class="lower-grid">
        <article class="activity-card" class:personal-preview={isAnonymous} inert={isAnonymous}>
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

      <p class="dashboard-footer">
        <Leaf size={14} aria-hidden="true" />
        MittPsyke - för din mentala välmående resa
      </p>
    </main>
  </div>
</div>

<style>
  .mp-dashboard {
    --mp-card: rgba(255, 255, 255, 0.78);
    --mp-card-solid: #fffdf8;
    --mp-card-border: rgba(52, 91, 55, 0.12);
    --mp-text: #20231f;
    --mp-text-dim: #6a7168;
    --mp-green: #2f6f46;
    --mp-green-soft: #dcefdc;
    --mp-blue: #2261c9;
    --mp-blue-soft: #eaf3ff;
    --mp-purple: #8444c6;
    --mp-purple-soft: #f3eafe;
    --mp-yellow: #f4c74c;
    --mp-radius: 8px;
    --mp-shadow: 0 18px 44px rgba(69, 83, 61, 0.09);
    color: var(--mp-text);
    min-height: 100vh;
    background:
      radial-gradient(780px 420px at 78% 2%, rgba(227, 241, 220, 0.68), transparent 62%),
      radial-gradient(620px 340px at 8% 92%, rgba(247, 232, 198, 0.5), transparent 62%),
      linear-gradient(135deg, #fffdf9 0%, #f7f4ed 46%, #eef5eb 100%);
  }

  .dashboard-shell {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    min-height: 100vh;
  }

  .dashboard-main {
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding: 40px 42px 18px;
    min-width: 0;
  }

  .topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .topbar h1 {
    margin: 0;
    font-size: clamp(1.9rem, 3.1vw, 2.3rem);
    line-height: 1.08;
    letter-spacing: 0;
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

  .icon-button,
  .avatar-button {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    text-decoration: none;
  }

  .icon-button {
    color: #2d302b;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(38, 60, 38, 0.11);
    box-shadow: 0 10px 24px rgba(69, 83, 61, 0.07);
  }

  .avatar-button {
    background: rgba(255, 255, 255, 0.82);
    border: 1px solid rgba(38, 60, 38, 0.11);
    box-shadow: 0 10px 24px rgba(69, 83, 61, 0.07);
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
    min-height: clamp(280px, 34vw, 420px);
    overflow: hidden;
    border-radius: 8px;
    box-shadow: var(--mp-shadow);
    border: 1px solid rgba(255, 255, 255, 0.72);
    background: #edf3e6;
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
    background: rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(2px);
    pointer-events: none;
  }

  .personal-preview > * {
    opacity: 0.76;
    filter: saturate(0.82);
  }

  .companion-hero img {
    width: 100%;
    height: 100%;
    min-height: inherit;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  .companion-hero[data-companion='bear'] img {
    object-position: 28% center;
  }

  .companion-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(255, 250, 236, 0.78), rgba(255, 250, 236, 0.24) 37%, rgba(255, 250, 236, 0.04));
    pointer-events: none;
  }

  .selected-companion-mark {
    position: absolute;
    z-index: 1;
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
    z-index: 1;
    left: clamp(26px, 4vw, 52px);
    top: clamp(42px, 7vw, 90px);
    max-width: min(28rem, 55%);
  }

  .hero-copy h2 {
    margin: 0;
    font-size: clamp(1.8rem, 3vw, 2.45rem);
    line-height: 1.08;
  }

  .hero-copy p {
    margin: 0.9rem 0 1.3rem;
    color: #3f443d;
    font-size: 1.08rem;
  }

  .soft-heart {
    color: #8dcfa2;
  }

  .time-badge {
    position: absolute;
    z-index: 1;
    top: 24px;
    right: 22px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(66, 66, 45, 0.12);
    box-shadow: 0 14px 34px rgba(65, 70, 54, 0.12);
    color: #eead21;
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
    gap: 18px;
  }

  .quick-card,
  .activity-card,
  .quote-card {
    border-radius: 8px;
    border: 1px solid var(--mp-card-border);
    background: var(--mp-card);
    box-shadow: 0 12px 30px rgba(69, 83, 61, 0.07);
    backdrop-filter: blur(16px);
  }

  .quick-card {
    min-height: 208px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .mood-card {
    background: linear-gradient(135deg, rgba(241, 250, 237, 0.88), rgba(255, 255, 252, 0.78));
  }

  .tools-card {
    background: linear-gradient(135deg, rgba(241, 247, 255, 0.9), rgba(252, 254, 255, 0.76));
    --accent: var(--mp-blue);
  }

  .insight-card {
    background: linear-gradient(135deg, rgba(250, 244, 255, 0.9), rgba(255, 253, 255, 0.78));
    --accent: var(--mp-purple);
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    color: var(--accent, var(--mp-green));
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
    opacity: 0.72;
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
    min-height: 36px;
    margin-top: auto;
    border-radius: 7px;
    border: 1px solid color-mix(in srgb, var(--accent, var(--mp-green)) 28%, transparent);
    color: var(--accent, var(--mp-green));
    background: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .lower-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 20px;
  }

  .activity-card,
  .quote-card {
    min-height: 242px;
    padding: 22px;
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
      linear-gradient(180deg, rgba(255, 246, 222, 0.94), rgba(255, 252, 245, 0.72)),
      var(--mp-card-solid);
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
    height: 42%;
    opacity: 0.65;
  }

  .mountains span {
    position: absolute;
    inset: auto -4% 0;
    height: 68%;
    background: #9eb98f;
    clip-path: polygon(0 100%, 13% 63%, 23% 80%, 35% 38%, 48% 76%, 59% 44%, 74% 78%, 86% 52%, 100% 82%, 100% 100%);
  }

  .mountains span:nth-child(2) {
    height: 88%;
    background: #c1cfac;
    transform: translateY(16px);
    opacity: 0.72;
  }

  .mountains span:nth-child(3) {
    height: 55%;
    background: #e2e6cc;
    transform: translateY(8px);
    opacity: 0.82;
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
    border-radius: 0;
    padding: 34px 18px;
    background: rgba(255, 255, 255, 0.55);
    box-shadow: none;
  }

  @media (max-width: 980px) {
    .dashboard-shell {
      grid-template-columns: 1fr;
    }

    .dashboard-main {
      padding: 22px;
    }

    .quick-grid,
    .lower-grid {
      grid-template-columns: 1fr;
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
      padding: 16px;
      gap: 18px;
    }

    .topbar {
      align-items: center;
    }

    .topbar h1 {
      font-size: 1.55rem;
    }

    .topbar-actions {
      gap: 0.55rem;
    }

    .icon-button,
    .avatar-button {
      width: 42px;
      height: 42px;
    }

    .companion-hero {
      min-height: 330px;
    }

    .companion-hero img {
      object-position: 24% center;
    }

    .companion-hero[data-companion='bear'] img {
      object-position: 22% center;
    }

    .companion-hero::after {
      background: linear-gradient(180deg, rgba(255, 250, 236, 0.78), rgba(255, 250, 236, 0.08) 64%);
    }

    .hero-copy {
      left: 22px;
      top: 28px;
      max-width: calc(100% - 44px);
    }

    .selected-companion-mark {
      right: 20px;
      bottom: 112px;
      width: 108px;
      height: 108px;
    }

    .time-badge {
      top: auto;
      right: auto;
      left: 16px;
      bottom: 16px;
    }

    .quick-card,
    .activity-card,
    .quote-card {
      padding: 18px;
    }
  }
</style>
