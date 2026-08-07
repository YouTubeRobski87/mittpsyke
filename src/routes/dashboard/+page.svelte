<script lang="ts">
  import { onMount } from 'svelte';
  import SEO from '$lib/components/SEO.svelte';
  import AccountTeaser from '$lib/components/AccountTeaser.svelte';
  import CompanionPose from '$lib/components/CompanionPose.svelte';
  import CompanionPresenceTracker from '$lib/components/CompanionPresenceTracker.svelte';
  import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
  import CompanionFriend from '$lib/components/world/CompanionFriend.svelte';
  import CompanionVisitor from '$lib/components/world/CompanionVisitor.svelte';
  import {
    ArrowRight,
    ChevronDown,
    Heart,
    MoonStar,
    SunMedium,
    Sunrise,
    Sunset
  } from 'lucide-svelte';
  import {
    getDashboardCompanionScene,
    getProgressCompanionDayState,
    COMPANION_WORLD_SCENE_IMAGE,
    COMPANION_WORLD_SCENE_SRCSET,
    COMPANION_WORLD_SCENE_BACKDROP,
    COMPANION_WORLD_SCENE_FALLBACK,
    getProgressCompanionAnimal,
    getProgressCompanionArtId,
    getProgressCompanionHeroFocus,
    type DashboardCompanionScene,
    type ProgressCompanionSelection
  } from '$lib/progressCompanion';
  import { BEAR_SCENE_PLACEMENTS, WOLF_SCENE_PLACEMENTS } from '$lib/companionPoseManifest';
  import { getLivingWorldScene, getGrowthLevel, type LivingWorldScene } from '$lib/worldScene';
  import { getLivingWorldReflectionCopy } from '$lib/livingWorldCopy';

  const ANONYMOUS_PREVIEW_COMPANION: ProgressCompanionSelection = { id: 'fox' };

  const GENERIC_COMPANION_HERO_IMAGE = COMPANION_WORLD_SCENE_IMAGE;

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
    companionRelationshipStage?: 0 | 1 | 2 | 3 | 4;
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

  function getCompanionBadgeMessage(hour: number | null): CompanionBadgeMessage | null {
    if (hour === null) return null;
    return getLocalGreeting(hour);
  }

  let { data } = $props<{ data: DashboardData }>();

  // Växtnivån (0-4) driver hur rik den beständiga världen är. Kommer från riktig
  // serverdata (totalEntries) redan vid SSR, så scenen är korrekt från första
  // paint. Utloggad förhandsvisning använder en mellannivå så marknadsvyn lever.
  const growthLevel = $derived(
    data.isAnonymous ? 3 : getGrowthLevel(data.progressPreview.totalEntries)
  );

  let progressExpanded = $state(false);
  let localHour = $state<number | null>(null);
  let localCompanionScene = $state<DashboardCompanionScene | null>(null);
  let livingWorldScene = $state<LivingWorldScene>(getLivingWorldScene({ growthLevel }));

  const diaryPreview = $derived(data.diaryPreview);
  const progressPreview = $derived(data.progressPreview);
  const settingsPreview = $derived(data.settingsPreview);
  const isAnonymous = $derived(Boolean(data.isAnonymous));
  const livingWorldReflectionCopy = $derived(
    getLivingWorldReflectionCopy(isAnonymous ? undefined : progressPreview.totalEntries)
  );
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
  const companionRelationshipStage = $derived(data.companionRelationshipStage ?? 0);
  const companionName = $derived(selectedCompanion?.name ?? 'Din följeslagare');
  const companionHeroImage = GENERIC_COMPANION_HERO_IMAGE;
  const heroCompanionId = $derived(
    companionArtId === 'bear' || companionArtId === 'wolf' ? companionArtId : 'fox'
  ) as 'fox' | 'bear' | 'wolf';
  const heroFocus = $derived(getProgressCompanionHeroFocus(heroCompanionId));
  const companionHeroAlt =
  'En vaken, nyfiken räv sitter vid ett träd i en varm och stillsam naturmiljö vid en sjö';
  const companionBadgeMessage = $derived(localCompanionScene?.greeting ?? null);
  // Uppdateras tillsammans med den lokala scenen, så besökaren följer samma
  // nattdefinition som huvudföljeslagarens poser.
  const heroCompanionIsSleeping = $derived(
    localCompanionScene !== null && getProgressCompanionDayState() === 'night'
  );
  // Ikonen ska följa hälsningen — "God natt" fick tidigare alltid en solikon.
  const CompanionBadgeIcon = $derived(
    companionBadgeMessage?.label === 'God morgon'
      ? Sunrise
      : companionBadgeMessage?.label === 'God dag'
        ? SunMedium
        : companionBadgeMessage?.label === 'God kväll'
          ? Sunset
          : companionBadgeMessage?.label === 'God natt'
            ? MoonStar
            : SunMedium
  );
  onMount(() => {
    const updateLocalTime = () => {
      localHour = new Date().getHours();
      const now = new Date();
      localCompanionScene = getDashboardCompanionScene(now);
      livingWorldScene = getLivingWorldScene({ date: now, growthLevel });
    };

    updateLocalTime();
    const interval = window.setInterval(updateLocalTime, 60 * 1000);
    return () => window.clearInterval(interval);
  });
</script>

<SEO canonical="https://www.mittpsyke.se/dashboard" />

<div class="mp-dashboard">
  <CompanionPresenceTracker enabled={!isAnonymous} />
  <div class="dashboard-shell">
    <main class="dashboard-main" aria-labelledby="dashboard-title">
      <header class="topbar">
        <div>
          {#if isAnonymous}
            <a class="home-return-link" href="/">&larr; Till startsidan</a>
          {/if}
          <h1 id="dashboard-title">Mitt Hem</h1>
          <p>Din personliga plats för reflektion, närvaro och utveckling.</p>
        </div>

        <div class="topbar-actions" aria-label="Kontroller">
          {#if isAnonymous}
            <a class="soft-account-link" href="/register">Spara platsen</a>
          {/if}
        </div>
      </header>

      <div class="dashboard-body">
      <section
        class="companion-hero"
        class:personal-preview={isAnonymous}
        data-companion={heroCompanionId}
        aria-label="Din följeslagare"
        style={`--hero-image: ${companionHeroImage ? `url('${COMPANION_WORLD_SCENE_BACKDROP}')` : 'none'}; --hero-focus: ${heroFocus};`}
      >
        <!-- width/height ger webbläsaren bildens proportioner innan den laddats,
             så hjältekortet inte hoppar till. fetchpriority="high" eftersom det
             här är sidans LCP-element. -->
        <!-- Mitt Hem har en sidokolumn på desktop; hero-rutan är då som mest 984 px
             bred. Det egna sizes-värdet hindrar att 800w förstoras till desktopbredd. -->
        <img
          class="companion-hero-scene"
          srcset={COMPANION_WORLD_SCENE_SRCSET}
          sizes="(max-width: 980px) calc(100vw - 44px), (max-width: 1440px) calc(100vw - 360px), 984px"
          src={COMPANION_WORLD_SCENE_FALLBACK}
          alt=""
          aria-hidden="true"
          width="1672"
          height="941"
          fetchpriority="high"
          decoding="async"
        />
        <!-- Grenen/löven uppe till höger ligger inbränd i companionHeroImage (ingen
             alfakanal). När en mattad utklippsfil finns (t.ex.
             dashboard-lakeside-world-foliage.webp), lägg ett eget <img> här med
             samma object-fit/object-position, klassen "companion-hero-foliage",
             och animera med canopySway (AmbientWorld.svelte). -->
        <CompanionPose
          class="hero-companion-pose"
          companionId={heroCompanionId}
          placement={
            heroCompanionId === 'bear'
              ? BEAR_SCENE_PLACEMENTS.dashboard
              : heroCompanionId === 'wolf'
                ? WOLF_SCENE_PLACEMENTS.dashboard
                : null
          }
        />
        <CompanionVisitor
          class="hero-companion-visitor"
          mainCompanionId={heroCompanionId}
          isSleeping={heroCompanionIsSleeping}
          scene="dashboard"
          sceneAllowsVisitor={Boolean(localCompanionScene)}
        />
        <AmbientWorld scene={livingWorldScene} class="hero-living-world" relationshipStage={isAnonymous ? 0 : companionRelationshipStage} />
        <CompanionFriend class="hero-companion-friend" companionId={heroCompanionId} stage={isAnonymous ? 0 : companionRelationshipStage} />
        <div class="time-badge" aria-label={companionBadgeMessage?.label ?? 'Hälsning'}>
          <CompanionBadgeIcon size={24} aria-hidden="true" />
          <span>
            <strong>{companionBadgeMessage?.label ?? 'Välkommen'}</strong>
            <small>{companionBadgeMessage?.note ?? 'Din plats finns här.'}</small>
          </span>
        </div>
        {#if isAnonymous}
          <div class="preview-note hero-preview-note">
            <AccountTeaser variant="dashboard" mode="overlay" />
          </div>
        {/if}
      </section>


        <div class="dashboard-content">
          <section class="now-panel" aria-labelledby="dashboard-now-title">
            <p>{livingWorldReflectionCopy}</p>
            <h2 id="dashboard-now-title">Just nu</h2>
            <p>{progressPreview.summary}</p>
          </section>

          <section class="next-step-panel" aria-labelledby="dashboard-next-step-title">
            <div>
              <h2 id="dashboard-next-step-title">Fortsätt skriva</h2>
              <p>Sätt ord på det du känner.</p>
            </div>
            <a class="dashboard-primary-action" href="/dagbok/checkin">
              Skriv i dagboken
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a class="dashboard-secondary-link" href="/framsteg">Se din utveckling</a>
          </section>

          <section class="dashboard-details" aria-labelledby="dashboard-details-title">
            <button
              class="dashboard-details-toggle"
              type="button"
              aria-controls="dashboard-more-details"
              aria-expanded={progressExpanded}
              onclick={() => (progressExpanded = !progressExpanded)}
            >
              <span id="dashboard-details-title">{progressExpanded ? 'Dölj mer' : 'Visa mer'}</span>
              <span class:expanded={progressExpanded} class="dashboard-details-chevron" aria-hidden="true">
                <ChevronDown size={20} />
              </span>
            </button>
            {#if progressExpanded}
              <div id="dashboard-more-details" class="dashboard-details-content">
                <div class="dashboard-stats" aria-label="Din lugna överblick">
                  <div><strong>{progressPreview.totalEntries}</strong><span>Texter skrivna</span></div>
                  <div><strong>{progressPreview.currentStreak}</strong><span>Dagar i följd</span></div>
                  <div><strong>{progressPreview.weeklyEntries}</strong><span>Den här veckan</span></div>
                </div>

                <section class="dashboard-activity" aria-labelledby="dashboard-activity-title">
                  <h3 id="dashboard-activity-title">Senaste i dagboken</h3>
                  <p>{diaryPreview.hasEntry ? `Du skrev ${diaryPreview.dateLabel || 'senast'}.` : 'Din dagbok väntar på dig när du vill.'}</p>
                  <a href="/dagbok">Visa all aktivitet</a>
                </section>

                <nav class="dashboard-explore" aria-label="Utforska vidare">
                  <a href="/guider">Guider</a>
                  <a href="/chat">Chatta med AI</a>
                  <a href="/blogg">Artiklar</a>
                </nav>
              </div>
            {/if}
          </section>
        </div>
      </div>

      <section class="privacy-row" aria-labelledby="privacy-title">
        <span class="privacy-mark"><Heart size={20} aria-hidden="true" /></span>
        <div><h2 id="privacy-title">Ditt innehåll är ditt</h2><p>Du bestämmer vad som sparas och vad som raderas. Läs mer om din integritet.</p></div>
        <a href="/integritet">Integritet &amp; trygghet</a>
      </section>
    </main>
  </div>
</div>

<style>
  .mp-dashboard {
    --mp-card: rgba(17, 27, 43, 0.88);
    --mp-card-solid: #111b2b;
    --mp-card-border: rgba(160, 188, 220, 0.2);
    --mp-text: #f4f1e9;
    --mp-text-dim: #c5cbd6;
    --mp-green: #8fc97a;
    --mp-green-soft: rgba(120, 174, 110, 0.18);
    --mp-blue: #93b8f5;
    --mp-blue-soft: rgba(91, 137, 214, 0.18);
    --mp-purple: #ba9ee8;
    --mp-purple-soft: rgba(141, 111, 202, 0.2);
    --mp-yellow: #dfbb7e;
    --mp-radius: 16px;
    --mp-shadow: 0 14px 36px rgba(69, 83, 61, 0.07);
    color: var(--mp-text);
    min-height: 100vh;
    background:
      radial-gradient(800px 420px at 64% 0%, rgba(35, 66, 100, 0.24), transparent 68%),
      radial-gradient(680px 420px at 10% 80%, rgba(26, 63, 73, 0.18), transparent 70%),
      linear-gradient(145deg, #07111f 0%, #0b1526 48%, #0c1728 100%);
  }

  .dashboard-shell {
    display: block;
    min-height: 100vh;
  }

  .dashboard-main {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: min(1440px, 100%);
    margin: 0 auto;
    padding: 30px 3rem 40px;
    min-width: 0;
  }

  .dashboard-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
	grid-template-areas:
	  'hero'
	  'content';
    gap: clamp(1.5rem, 3vw, 2.5rem);
    align-items: start;
  }

  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: clamp(1.5rem, 3vw, 2.25rem);
    min-width: 0;
	grid-area: content;
  }

  .now-panel,
  .next-step-panel,
  .dashboard-details {
    width: min(100%, 44rem);
  }

  .now-panel {
    display: grid;
    gap: 0.5rem;
    padding: 0 0.25rem;
  }

  .now-panel h2,
  .now-panel p,
  .next-step-panel h2,
  .next-step-panel p,
  .dashboard-activity h3,
  .dashboard-activity p {
    margin: 0;
  }

  .now-panel h2,
  .next-step-panel h2 {
    font-size: clamp(1.2rem, 2vw, 1.45rem);
  }

  .now-panel p,
  .next-step-panel p,
  .dashboard-activity p {
    color: var(--mp-text-dim);
    line-height: 1.6;
  }

  .next-step-panel {
    display: grid;
    gap: 1rem;
    padding: clamp(1.25rem, 3vw, 1.75rem);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    background: rgba(17, 27, 43, 0.72);
  }

  .dashboard-primary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    width: fit-content;
    min-height: 48px;
    padding: 0.78rem 1.2rem;
    border-radius: 12px;
    background: #dce8f3;
    color: #19364b;
    font-weight: 700;
    text-decoration: none;
  }

  .dashboard-secondary-link,
  .dashboard-activity a,
  .dashboard-explore a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--mp-blue);
    font-weight: 650;
    text-decoration: none;
  }

  .dashboard-secondary-link {
    width: fit-content;
  }

  .dashboard-details {
    border-top: 1px solid var(--mp-card-border);
  }

  .dashboard-details-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 48px;
    padding: 0.25rem 0;
    border: 0;
    background: transparent;
    color: var(--mp-text);
    font: inherit;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  .dashboard-details-chevron {
    display: inline-flex;
    transition: transform 0.16s ease;
  }

  .dashboard-details-chevron.expanded {
    transform: rotate(180deg);
  }

  .dashboard-details-content {
    display: grid;
    gap: 1.25rem;
    padding: 0.75rem 0 0.25rem;
  }

  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .dashboard-stats div {
    display: grid;
    gap: 0.2rem;
    padding: 0.9rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
  }

  .dashboard-stats strong {
    color: var(--mp-green);
    font-size: 1.35rem;
  }

  .dashboard-stats span {
    color: var(--mp-text-dim);
    font-size: 0.82rem;
  }

  .dashboard-activity {
    display: grid;
    gap: 0.45rem;
  }

  .dashboard-explore {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 1rem;
  }

  .dashboard-primary-action:hover,
  .privacy-row a:hover {
    background: #edf4fa;
  }

  .dashboard-primary-action:focus-visible,
  .dashboard-secondary-link:focus-visible,
  .dashboard-details-toggle:focus-visible,
  .dashboard-activity a:focus-visible,
  .dashboard-explore a:focus-visible {
    outline: 3px solid #dce8f3;
    outline-offset: 3px;
    border-radius: 8px;
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

  .avatar-button :global(.user-avatar) {
    width: 44px;
    height: 44px;
  }

  .soft-account-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
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
	grid-area: hero;
    position: relative;
	--scene-background: 0;
	--scene-midground: 1;
	--scene-ambient: 2;
	--scene-companion: 3;
	--scene-foreground: 4;
	--scene-overlay: 5;
	min-height: 300px;
	height: clamp(300px, 24vw, 360px);
    overflow: hidden;
    border-radius: var(--mp-radius);
    box-shadow: var(--mp-shadow);
    border: 1px solid var(--mp-card-border);
    background: linear-gradient(135deg, #16243a 0%, #0a1424 100%);
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
    z-index: var(--scene-background);
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

  .companion-hero-scene {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* Fokus styrs per följeslagare via --hero-focus (standard: nedre högra tredjedelen där djuret sitter) */
    object-position: var(--hero-focus, 70% 64%);
    display: block;
    z-index: var(--scene-background);
  }

  .companion-hero[data-companion='fox'] .companion-hero-scene {
    object-fit: cover;
    /* Håll räven (nedre högra tredjedelen) helt i bild oavsett kortets bredd */
    object-position: var(--hero-focus, 70% 64%);
  }

  .companion-hero :global(.hero-living-world) {
    z-index: var(--scene-ambient);
  }

  .companion-hero :global(.hero-companion-pose) {
    z-index: calc(var(--companion-z, 2) + 1);
  }

  .companion-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: var(--scene-midground);
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

  .companion-hero[data-companion='bear']::after {
    background:
      linear-gradient(90deg, rgba(16, 42, 45, 0.72) 0%, rgba(16, 42, 45, 0.44) 33%, rgba(16, 42, 45, 0.12) 58%, transparent 76%),
      linear-gradient(180deg, rgba(8, 24, 32, 0.16), transparent 42%, rgba(8, 24, 32, 0.22));
  }

  .companion-hero[data-companion='bear'] .hero-copy h2,
  .companion-hero[data-companion='bear'] .hero-copy p {
    color: #fffaf2;
    text-shadow: 0 2px 14px rgba(8, 24, 32, 0.38);
  }

  .companion-hero[data-companion='bear'] .time-badge {
    top: 14px;
    right: 14px;
    gap: 0.45rem;
    padding: 0.5rem 0.65rem;
    border-color: rgba(255, 250, 242, 0.28);
    background: rgba(255, 253, 248, 0.86);
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
    z-index: var(--scene-overlay);
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
    z-index: var(--scene-overlay);
    top: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.72rem 0.95rem;
    border-radius: 12px;
    background: rgba(255, 253, 248, 0.94);
    border: 1px solid rgba(49, 71, 58, 0.18);
    box-shadow: 0 8px 24px rgba(10, 25, 45, 0.16);
    color: #d4a017;
    opacity: 1;
  }

  .time-badge span {
    display: grid;
    gap: 0.15rem;
    color: #31473a;
    font-size: 15px;
    font-weight: 600;
    opacity: 1;
  }

  .time-badge small {
    color: #5f6f64;
    font-size: 14px;
    font-weight: 400;
    opacity: 1;
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
    /* 44px är Apples HIG-minimum för träffytor. 38px gav missar på mobil. */
    min-height: 44px;
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

  .mp-dashboard .text-link {
    min-height: 44px;
    margin-top: 0.25rem;
    padding: 0.68rem 0.85rem;
    border: 1px solid #a7bfd6;
    border-radius: 10px;
    transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  }

  .mp-dashboard .text-link:hover {
    background: #edf4fa;
    border-color: #c4d5e4;
    box-shadow: 0 4px 12px rgba(4, 17, 31, 0.18);
    transform: translateY(-1px);
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

  .mp-dashboard .quick-card,
  .mp-dashboard .activity-card,
  .mp-dashboard .quote-card {
    border-color: var(--mp-card-border);
    background: linear-gradient(145deg, rgba(18, 30, 48, 0.96), rgba(13, 23, 39, 0.96));
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
  }

  .mp-dashboard .quick-card p,
  .mp-dashboard .activity-item small,
  .mp-dashboard .quote-card blockquote { color: var(--mp-text-dim); }

  .mp-dashboard .card-button,
  .mp-dashboard .text-link {
    border-color: #a7bfd6;
    background: #dce8f3;
    color: #19364b;
    font-size: 15px;
    font-weight: 700;
    opacity: 1;
  }

  .mp-dashboard .card-button {
    min-height: 44px;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.26) inset;
    transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
  }

  .mp-dashboard .card-button:hover {
    background: #edf4fa;
    border-color: #c4d5e4;
    box-shadow: 0 4px 12px rgba(4, 17, 31, 0.18);
    transform: translateY(-1px);
  }

  .mp-dashboard .card-button:focus-visible,
  .mp-dashboard .text-link:focus-visible,
  .mp-dashboard .explore-panel a:focus-visible,
  .mp-dashboard .privacy-row a:focus-visible {
    outline: 3px solid #dce8f3;
    outline-offset: 3px;
  }

  .mp-dashboard .mood-card { background: linear-gradient(145deg, rgba(24, 57, 52, 0.92), rgba(14, 31, 42, 0.96)); }
  .mp-dashboard .tools-card { background: linear-gradient(145deg, rgba(28, 42, 66, 0.94), rgba(13, 23, 39, 0.96)); }
  .mp-dashboard .insight-card { background: linear-gradient(145deg, rgba(51, 39, 77, 0.86), rgba(13, 23, 39, 0.96)); }

  .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mood-card, .tools-card { min-height: 288px; }
  .mood-card { background: linear-gradient(135deg, rgba(17, 35, 52, 0.92), rgba(13, 23, 39, 0.96)) !important; }
  .tools-card { background: linear-gradient(135deg, rgba(23, 42, 45, 0.92), rgba(13, 23, 39, 0.96)) !important; }
  .garden-progress { display: flex; gap: 0.25rem; margin: auto 0 1rem; }
  .garden-progress span { width: 0.85rem; height: 0.7rem; border-radius: 2px; background: linear-gradient(135deg, #4d9566, #a9dc7d); }
  .garden-progress span:nth-last-child(-n+2) { background: rgba(237, 243, 225, 0.7); }

  .explore-panel {
    display: grid;
    gap: 0;
    margin-top: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    background: rgba(17, 27, 43, 0.88);
  }
  .explore-panel h2 { margin: 0 0 0.7rem; font-size: 1.05rem; }
  .explore-panel a { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; min-height:44px; margin:0.22rem 0; padding:0.62rem 0.75rem; border:1px solid rgba(160,188,220,0.32); border-radius:9px; background:rgba(255,255,255,0.045); color:var(--mp-text); text-decoration:none; transition:background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease; }
  .explore-panel a:hover { border-color:#a7bfd6; background:rgba(220,232,243,0.12); box-shadow:0 3px 10px rgba(4,17,31,0.15); transform:translateX(2px); }
  .explore-panel span { display:grid; gap:0.15rem; }
  .explore-panel small { color:var(--mp-text-dim); font-size:0.78rem; }

  .privacy-row { display:flex; align-items:center; gap:1rem; margin-top:1.25rem; padding:1.25rem; border:1px solid var(--mp-card-border); border-radius:var(--mp-radius); background:rgba(13,23,39,0.84); }
  .privacy-mark { display:grid; place-items:center; width:2.5rem; height:2.5rem; border-radius:10px; background:rgba(255,255,255,0.06); color:var(--mp-green); }
  .privacy-row div { min-width:0; }
  .privacy-row h2, .privacy-row p { margin:0; }
  .privacy-row h2 { font-size:0.98rem; }
  .privacy-row p { margin-top:0.25rem; color:var(--mp-text-dim); font-size:0.88rem; }
  .privacy-row a { margin-left:auto; min-height:42px; display:inline-flex; align-items:center; padding:0.65rem 0.9rem; border:1px solid #a7bfd6; border-radius:10px; background:#dce8f3; color:#19364b; font-weight:700; text-decoration:none; white-space:nowrap; transition:background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease; }
  .privacy-row a:hover { border-color:#c4d5e4; background:#edf4fa; box-shadow:0 4px 12px rgba(4,17,31,0.18); transform:translateY(-1px); }

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
	  grid-template-areas:
		'hero'
		'content';
      gap: 24px;
    }

    .privacy-row { align-items:flex-start; flex-wrap:wrap; }
    .privacy-row a { margin-left:0; }

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

    .dashboard-primary-action {
      width: 100%;
    }

    .dashboard-stats {
      grid-template-columns: 1fr;
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
      /* Brickan är högerankrad och .hero-copy vänsterankrad i samma vertikala
         band. Utan ett breddtak här växte brickan in över rubriken. Taket och
         .hero-copys bredd måste tillsammans lämna luft för sidoavstånden. */
      max-width: 46%;
    }

    .time-badge :global(svg) {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .time-badge strong {
      font-size: 15px;
    }

    .time-badge small {
      font-size: 14px;
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

    /* Smalare, inte bredare, ju mindre skärmen blir - annars möter texten
       tidsbrickan på högersidan. */
    .hero-copy {
      max-width: 44%;
    }

    .hero-copy h2 {
      font-size: 1.22rem;
    }

    .time-badge {
      padding: 0.48rem 0.62rem;
      /* Snävare tak än 620px-regeln: utrymmet mellan rubrik och bricka blir
         annars nere på ett par pixlar här. */
      max-width: 42%;
    }

  }

	.section-heading {
		display: grid;
		gap: 0.35rem;
		margin-bottom: -0.65rem;
	}

	.section-heading h2,
	.section-heading p {
		margin: 0;
	}

	.section-heading h2 {
		font-size: 1.2rem;
	}

	.section-heading p {
    color: #5f6f64;
    font-size: 14px;
    font-weight: 400;
    opacity: 1;
		font-size: 0.94rem;
	}

  @media (max-width: 320px) {
    .topbar h1 {
      font-size: 1.32rem;
    }

    .hero-copy {
      max-width: 44%;
    }

    .hero-copy p {
      display: none;
    }

    /* På de smalaste skärmarna räcker hälsningen. Utan detta trycks
       noteringen ihop till tre rader och brickan blir onödigt bred. */
    .time-badge small {
      display: none;
    }

    .companion-hero {
      min-height: 260px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-button,
    .text-link,
    .explore-panel a,
    .privacy-row a {
      transition: none;
      animation: none !important;
      transform: none !important;
    }
  }
</style>
