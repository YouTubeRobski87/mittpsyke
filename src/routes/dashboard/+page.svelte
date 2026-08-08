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
    Activity,
    ArrowRight,
    BookOpen,
    Feather,
    Heart,
    House,
    Lock,
    MessageCircle,
    MoonStar,
    Newspaper,
    Sprout,
    SunMedium,
    Sunrise,
    Sunset,
    TrendingUp
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

  let localHour = $state<number | null>(null);
  let localCompanionScene = $state<DashboardCompanionScene | null>(null);
  let livingWorldScene = $state<LivingWorldScene>(getLivingWorldScene({ growthLevel }));

  const diaryPreview = $derived(data.diaryPreview);
  const progressPreview = $derived(data.progressPreview);
  const settingsPreview = $derived(data.settingsPreview);
  const isAnonymous = $derived(Boolean(data.isAnonymous));
  // Fem lugna segment i stället för en XP-liknande mätare. Nivå 0 tänder ett
  // segment - basvärlden är aldrig tom, samma hållning som FOLIAGE_OPACITY_SCALE
  // i worldScene.ts där nivå 0 ligger på 0.72 och inte på noll.
  const gardenSegments = $derived([0, 1, 2, 3, 4].map((step) => step <= growthLevel));
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
          <div class="dashboard-title-row">
            <House size={32} aria-hidden="true" />
            <h1 id="dashboard-title">Mitt Hem</h1>
          </div>
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
          scene="dashboard"
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
        <!-- Texten är inte placerad "mitt emot räven". Den är kapad till
             COMPANION_DASHBOARD_COPY_SAFE_WIDTH_PCT, den yta scenen lovar att
             hålla fri från både följeslagare och besökare oavsett vilken pose,
             position eller vilket djur som råkar vara valt. Löftet hålls av
             testerna i companionPoseState.test.ts - ändra aldrig bredden här
             utan att uppdatera konstanten och låta testet räkna om marginalen. -->
        <div class="hero-copy">
          <h2>{greeting}</h2>
          <p>{livingWorldReflectionCopy}</p>
          <div class="hero-companion-note">
            <span class="hero-companion-mark" aria-hidden="true"><Sprout size={18} /></span>
            <span class="hero-companion-text">
              <strong>Följeslagaren är här för dig.</strong>
              <small>{companionName} vakar lugnt över din resa.</small>
            </span>
            <a class="hero-companion-link" href="/chat">Säg hej till {companionName}</a>
          </div>
        </div>
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


        <section class="now-panel" aria-labelledby="dashboard-now-title">
          <h2 id="dashboard-now-title">Ditt nuläge</h2>
          <div class="now-stats">
            <div class="now-stat">
              <span class="now-stat-mark now-stat-mark--green" aria-hidden="true"><Feather size={18} /></span>
              <span class="now-stat-body">
                <strong>{progressPreview.totalEntries}</strong>
                <small>Texter skrivna</small>
              </span>
            </div>
            <div class="now-stat">
              <span class="now-stat-mark now-stat-mark--blue" aria-hidden="true"><TrendingUp size={18} /></span>
              <span class="now-stat-body">
                <strong>{progressPreview.currentStreak}</strong>
                <small>Dagar i följd</small>
              </span>
            </div>
            <div class="now-stat">
              <span class="now-stat-mark now-stat-mark--yellow" aria-hidden="true"><SunMedium size={18} /></span>
              <span class="now-stat-body">
                <strong>{progressPreview.weeklyEntries}</strong>
                <small>Den här veckan</small>
              </span>
            </div>
            <div class="now-stat">
              <span class="now-stat-mark now-stat-mark--green" aria-hidden="true"><Sprout size={18} /></span>
              <span class="now-stat-body">
                <strong>{growthLevel}</strong>
                <small>Trädgården växer</small>
              </span>
            </div>
          </div>
          <p class="now-summary">{progressPreview.summary}</p>
          <a class="now-cta" href="/framsteg">
            Se alla framsteg
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>

        <section class="home-card checkin-card" aria-labelledby="dashboard-checkin-title">
          <div class="home-card-head">
            <span class="home-card-mark home-card-mark--rose" aria-hidden="true"><Heart size={20} /></span>
            <h2 id="dashboard-checkin-title">Dagens incheckning</h2>
          </div>
          <p class="home-card-lead">Hur har du det idag?</p>
          <p class="home-card-copy">Sätt ord på det du känner. Allt du skriver stannar hos dig.</p>
          {#if diaryPreview.hasEntry && diaryPreview.dateLabel}
            <p class="home-card-note">Du skrev {diaryPreview.dateLabel}.</p>
          {/if}
          <a class="home-card-action" href="/dagbok/checkin">Skriv i dagboken</a>
        </section>

        <section class="home-card garden-card" aria-labelledby="dashboard-garden-title">
          <div class="home-card-head">
            <span class="home-card-mark home-card-mark--green" aria-hidden="true"><Sprout size={20} /></span>
            <h2 id="dashboard-garden-title">Growth Garden</h2>
          </div>
          <p class="home-card-copy">Din trädgård växer med din närvaro.</p>
          <p class="home-card-copy">Små steg, stor skillnad.</p>
          <!-- Fem segment, inte en cellindikator: North Star säger uttryckligen
               "Inte XP. Inte nivåer." Segmenten speglar samma växtnivå som
               världen redan använder, inget eget poängsystem. -->
          <div
            class="garden-progress"
            role="img"
            aria-label={`Trädgården växer, nivå ${growthLevel} av 4`}
          >
            {#each gardenSegments as grown}
              <span class:grown aria-hidden="true"></span>
            {/each}
          </div>
          <!-- /framsteg tills vidare: ingen egen trädgårdsroute finns. -->
          <a class="home-card-action" href="/framsteg">Gå till trädgården</a>
        </section>

        <nav class="explore-panel" aria-labelledby="dashboard-explore-title">
          <h2 id="dashboard-explore-title">Utforska vidare</h2>
          <a href="/framsteg">
            <span class="explore-mark" aria-hidden="true"><Activity size={18} /></span>
            <span class="explore-text"><strong>Framsteg</strong><small>Se din utveckling över tid</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a href="/guider">
            <span class="explore-mark" aria-hidden="true"><BookOpen size={18} /></span>
            <span class="explore-text"><strong>Guider</strong><small>Praktiska övningar och stöd</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a href="/chat">
            <span class="explore-mark" aria-hidden="true"><MessageCircle size={18} /></span>
            <span class="explore-text"><strong>Chatta med AI</strong><small>Sortera tankar i lugn och ro</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a href="/blogg">
            <span class="explore-mark" aria-hidden="true"><Newspaper size={18} /></span>
            <span class="explore-text"><strong>Artiklar</strong><small>Kunskap och inspiration</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </nav>
      </div>

      <section class="privacy-row" aria-labelledby="privacy-title">
        <span class="privacy-mark"><Lock size={20} aria-hidden="true" /></span>
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
    background: #091321;
  }

  :global(.site-header) {
    background: #091321 !important;
    border-bottom: 1px solid rgba(160, 188, 220, 0.16);
  }

  .dashboard-shell {
    display: block;
    min-height: 100vh;
  }

  .dashboard-main {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 1.6vw, 1.5rem);
    width: min(1440px, 100%);
    margin: 0 auto;
    padding: clamp(18px, 2.4vw, 28px) clamp(14px, 2.6vw, 40px) clamp(24px, 3vw, 36px);
    min-width: 0;
  }

  /* Bred desktopgrid. Världen tar två av tre kolumnspår, nulägespanelen det
     tredje. Raden under återanvänder exakt samma spår, så de två jämnstora
     korten linjerar med världen och utforska-panelen med nuläget. Tidigare låg
     allt i en enda kolumn med width: min(100%, 44rem) - det var den kapningen,
     inte sidmarginalerna, som gjorde högra tredjedelen tom. */
  .dashboard-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 0.95fr);
    grid-template-areas:
      'hero    hero   now'
      'checkin garden explore';
    gap: clamp(0.9rem, 1.4vw, 1.375rem);
    align-items: stretch;
  }

  .topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    padding-bottom: 0.1rem;
  }

  .topbar h1 {
    margin: 0;
    font-size: clamp(1.9rem, 3.1vw, 2.3rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .dashboard-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--mp-green);
  }

  .dashboard-title-row h1 {
    color: var(--mp-text);
  }

  .topbar p {
    margin: 0.45rem 0 0;
    color: var(--mp-text-dim);
    font-size: 1.05rem;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 0 0 auto;
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

  /* ── Världen ─────────────────────────────────────────────────────────── */

  .companion-hero {
    grid-area: hero;
    position: relative;
    --scene-background: 0;
    --scene-midground: 1;
    --scene-ambient: 2;
    --scene-companion: 3;
    --scene-foreground: 4;
    --scene-overlay: 5;
    min-height: 320px;
    height: clamp(320px, 26vw, 400px);
    overflow: hidden;
    border-radius: var(--mp-radius);
    box-shadow: var(--mp-shadow);
    border: 1px solid var(--mp-card-border);
    background: #101b2b;
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

  /* Läsbarhetstvätten över vänstra tredjedelen. Den är förutsättningen för att
     hjältetexten kan vara mörk text direkt på scenen i stället för en egen
     panel - en panel hade krävt att bildytan kröps ihop, och då hade
     följeslagarens procentkoordinater slutat peka på rätt mark. */
  .companion-hero::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 49%;
    z-index: var(--scene-midground);
    background: rgba(9, 19, 33, 0.82);
    pointer-events: none;
  }

  .companion-hero :global(.hero-companion-pose) {
    left: calc(100% - var(--companion-x, 78%));
  }

  /* Bredden är låst till den yta scenen garanterar fri från följeslagare och
     besökare - se COMPANION_DASHBOARD_COPY_SAFE_WIDTH_PCT i
     companionPoseManifest.ts. Höj den aldrig utan att höja konstanten, för då
     räknar testet i companionPoseState.test.ts om marginalen och faller om
     scenen inte längre håller löftet. */
  .hero-copy {
    position: absolute;
    z-index: var(--scene-overlay);
    --hero-copy-inset: clamp(20px, 3vw, 38px);
    right: var(--hero-copy-inset);
    left: auto;
    top: clamp(22px, 3.4vw, 42px);
    /* Indraget måste dras av, annars hamnar textens HÖGERkant på
       inset + 40 % och kryper in i besökarens yta. Det är högerkanten som är
       löftet, inte bredden. */
    width: min(23rem, calc(45% - var(--hero-copy-inset)));
  }

  .hero-copy h2 {
    margin: 0;
    color: var(--mp-text);
    font-size: clamp(1.4rem, 2.2vw, 1.9rem);
    line-height: 1.12;
    letter-spacing: -0.01em;
    /* Hälsningen innehåller användarens eget visningsnamn, alltså text vi inte
       känner längden på. Bredden är låst av companion-safe-arean och får inte
       ge efter, så ordet bryts i stället. hyphens fungerar eftersom <html> har
       lang="sv"; anywhere är nätet under för ett namn utan brytpunkter. */
    overflow-wrap: anywhere;
    hyphens: auto;
  }

  .hero-copy > p {
    margin: 0.45rem 0 0.85rem;
    color: var(--mp-text-dim);
    font-size: 0.98rem;
    line-height: 1.5;
  }

  .hero-companion-note {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.35rem 0.6rem;
    padding: 0.7rem 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(49, 71, 58, 0.16);
    background: rgba(255, 253, 248, 0.9);
    box-shadow: 0 8px 22px rgba(10, 25, 45, 0.14);
  }

  .hero-companion-mark {
    display: grid;
    place-items: center;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 8px;
    color: #4f7d54;
    background: rgba(120, 174, 110, 0.2);
  }

  .hero-companion-text {
    display: grid;
    gap: 0.12rem;
    min-width: 0;
  }

  .hero-companion-text strong {
    color: #31473a;
    font-size: 0.92rem;
  }

  .hero-companion-text small {
    color: #5f6f64;
    font-size: 0.84rem;
    line-height: 1.35;
  }

  .hero-companion-link {
    grid-column: 1 / -1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    margin-top: 0.1rem;
    padding: 0.45rem 0.8rem;
    border: 1px solid rgba(49, 71, 58, 0.2);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.72);
    color: #31473a;
    font-weight: 700;
    font-size: 0.88rem;
    text-decoration: none;
    transition: background-color 0.16s ease, transform 0.16s ease;
  }

  .hero-companion-link:hover {
    background: #fff;
    transform: translateY(-1px);
  }

  .time-badge {
    display: none;
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

  /* ── Ditt nuläge ─────────────────────────────────────────────────────── */

  .now-panel {
    grid-area: now;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    min-width: 0;
    padding: clamp(1rem, 1.5vw, 1.3rem);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    background: rgba(17, 27, 43, 0.88);
    box-shadow: var(--mp-shadow);
  }

  .now-panel h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .now-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }

  .now-stat {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    padding: 0.7rem 0.75rem;
    border: 1px solid rgba(160, 188, 220, 0.18);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.045);
  }

  .now-stat-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2rem;
    height: 2rem;
    border-radius: 9px;
  }

  .now-stat-mark--green {
    color: var(--mp-green);
    background: var(--mp-green-soft);
  }

  .now-stat-mark--blue {
    color: var(--mp-blue);
    background: var(--mp-blue-soft);
  }

  .now-stat-mark--yellow {
    color: var(--mp-yellow);
    background: rgba(223, 187, 126, 0.16);
  }

  .now-stat-body {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .now-stat-body strong {
    font-size: 1.5rem;
    line-height: 1.05;
  }

  .now-stat-body small {
    color: var(--mp-text-dim);
    font-size: 0.8rem;
    line-height: 1.25;
  }

  .now-summary {
    margin: 0;
    color: var(--mp-text-dim);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  /* ── De två jämnstora korten ─────────────────────────────────────────── */

  .home-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    padding: clamp(1rem, 1.5vw, 1.3rem);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    background: var(--mp-card);
    box-shadow: var(--mp-shadow);
  }

  .checkin-card {
    grid-area: checkin;
    position: relative;
    overflow: hidden;
    isolation: isolate;
  }

  .checkin-card::after {
    content: '';
    position: absolute;
    inset: 0 0 0 42%;
    z-index: 0;
    background: url('/assets/diary/dagboken-background.webp') right center / cover no-repeat;
    opacity: 0.4;
  }

  .checkin-card::before {
    content: '';
    position: absolute;
    inset: 0 0 0 42%;
    z-index: 1;
    background: rgba(9, 19, 33, 0.46);
  }

  .checkin-card > * {
    position: relative;
    z-index: 2;
  }

  .garden-card {
    grid-area: garden;
  }

  .home-card-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .home-card-head h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .home-card-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 10px;
  }

  .home-card-mark--rose {
    color: #e9a3ac;
    background: rgba(206, 120, 133, 0.18);
  }

  .home-card-mark--green {
    color: var(--mp-green);
    background: var(--mp-green-soft);
  }

  .home-card-lead {
    margin: 0.15rem 0 0;
    font-weight: 650;
  }

  .home-card-copy {
    margin: 0;
    color: var(--mp-text-dim);
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .home-card-note {
    margin: 0.1rem 0 0;
    color: var(--mp-text-dim);
    font-size: 0.84rem;
  }

  /* Fem segment kopplade till growthLevel (0-4). Nivå 0 tänder ett segment -
     basvärlden är aldrig tom. Medvetet inte en cellindikator: North Star säger
     "Inte XP. Inte nivåer." */
  .garden-progress {
    display: flex;
    gap: 0.4rem;
    margin: 0.45rem 0 0.2rem;
  }

  .garden-progress span {
    flex: 1;
    height: 0.5rem;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.07);
  }

  .garden-progress span.grown {
    background: #79ad6f;
  }

  /* ── Utforska vidare ─────────────────────────────────────────────────── */

  .explore-panel {
    grid-area: explore;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    padding: clamp(1rem, 1.5vw, 1.3rem);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    background: rgba(17, 27, 43, 0.88);
    box-shadow: var(--mp-shadow);
  }

  .explore-panel h2 {
    margin: 0 0 0.3rem;
    font-size: 1.05rem;
  }

  .explore-panel a {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-height: 52px;
    padding: 0.5rem 0.6rem;
    border: 1px solid transparent;
    border-radius: 10px;
    color: var(--mp-text);
    text-decoration: none;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      transform 0.16s ease;
  }

  .explore-panel a:hover {
    border-color: rgba(160, 188, 220, 0.32);
    background: rgba(220, 232, 243, 0.1);
    transform: translateX(2px);
  }

  .explore-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 9px;
    color: var(--mp-blue);
    background: var(--mp-blue-soft);
  }

  .explore-text {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
    margin-right: auto;
  }

  .explore-text strong {
    font-size: 0.95rem;
  }

  .explore-text small {
    color: var(--mp-text-dim);
    font-size: 0.8rem;
  }

  /* Bara pilen: markernas svg ligger inne i sina span, inte direkt under a. */
  .explore-panel a > :global(svg) {
    flex: 0 0 auto;
    color: var(--mp-text-dim);
  }

  /* ── Knappar ─────────────────────────────────────────────────────────── */

  .now-cta,
  .home-card-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 46px;
    margin-top: auto;
    padding: 0.7rem 1.1rem;
    border: 1px solid rgba(160, 188, 220, 0.36);
    border-radius: 10px;
    background: transparent;
    color: var(--mp-text);
    font-weight: 700;
    text-decoration: none;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      box-shadow 0.16s ease,
      transform 0.16s ease;
  }

  .now-cta:hover,
  .home-card-action:hover {
    background: rgba(220, 232, 243, 0.1);
    border-color: rgba(220, 232, 243, 0.62);
    box-shadow: none;
    transform: translateY(-1px);
  }

  /* Trädgården är den lugnare av de två - konturknapp mot dagbokens fyllda. */
  .garden-card .home-card-action {
    border-color: rgba(160, 188, 220, 0.36);
    background: transparent;
    color: var(--mp-text);
  }

  .checkin-card .home-card-action {
    border-color: #cbb48b;
    background: #cbb48b;
    color: #101a28;
  }

  .checkin-card .home-card-action:hover {
    border-color: #dbc7a3;
    background: #dbc7a3;
  }

  .garden-card .home-card-action:hover {
    border-color: #a7bfd6;
    background: rgba(220, 232, 243, 0.12);
    box-shadow: none;
  }

  .now-cta:focus-visible,
  .home-card-action:focus-visible,
  .hero-companion-link:focus-visible,
  .explore-panel a:focus-visible,
  .privacy-row a:focus-visible,
  .soft-account-link:focus-visible {
    outline: 3px solid #dce8f3;
    outline-offset: 3px;
    border-radius: 10px;
  }

  /* ── Integritet ──────────────────────────────────────────────────────── */

  .privacy-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.25rem;
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    background: rgba(13, 23, 39, 0.84);
  }

  .privacy-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--mp-green);
  }

  .privacy-row div {
    min-width: 0;
  }

  .privacy-row h2,
  .privacy-row p {
    margin: 0;
  }

  .privacy-row h2 {
    font-size: 0.98rem;
  }

  .privacy-row p {
    margin-top: 0.25rem;
    color: var(--mp-text-dim);
    font-size: 0.88rem;
  }

  .privacy-row a {
    margin-left: auto;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    padding: 0.65rem 0.9rem;
    border: 1px solid rgba(160, 188, 220, 0.3);
    border-radius: 10px;
    background: transparent;
    color: var(--mp-text);
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      box-shadow 0.16s ease,
      transform 0.16s ease;
  }

  .privacy-row a:hover {
    border-color: rgba(220, 232, 243, 0.62);
    background: rgba(220, 232, 243, 0.1);
    box-shadow: none;
    transform: translateY(-1px);
  }

  /* ── Responsivt ──────────────────────────────────────────────────────── */

  /* Tre spår blir två: världen över hela bredden, sedan nuläge + utforska,
     sedan de två korten. Ordningen håller "din plats" överst och länkarna
     sist, precis som i en kolumn. */
  @media (max-width: 1180px) {
    .dashboard-body {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-areas:
        'hero    hero'
        'now     explore'
        'checkin garden';
    }
  }

  @media (max-width: 980px) {
    .dashboard-main {
      padding: 22px 20px 24px;
    }

    .privacy-row {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .privacy-row a {
      margin-left: 0;
    }
  }

  @media (max-width: 860px) {
    .dashboard-body {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'hero'
        'now'
        'checkin'
        'garden'
        'explore';
    }
  }

  @media (max-width: 620px) {
    .dashboard-main {
      padding: 16px 14px 20px;
      gap: 16px;
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

    .companion-hero {
      height: clamp(280px, 72vw, 340px);
      min-height: 280px;
    }

    .companion-hero::after {
      left: 38%;
      background: rgba(9, 19, 33, 0.84);
    }

    /* På mobil ligger copy fortsatt över den mörka högra delen av scenen. */
    .hero-copy {
      --hero-copy-inset: 16px;
      top: 18px;
      width: min(17rem, calc(46% - var(--hero-copy-inset)));
    }

    .hero-copy h2 {
      font-size: 1.35rem;
    }

    .hero-copy > p {
      margin: 0.4rem 0 0;
      font-size: 0.88rem;
    }

    /* Chattvägen finns kvar i "Utforska vidare" när kortet inte ryms. */
    .hero-companion-note {
      display: none;
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
  }

  @media (max-width: 430px) {
    .now-stats {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 390px) {
    .dashboard-main {
      padding: 14px 12px 16px;
    }

    /* Smalare, inte bredare, ju mindre skärmen blir - annars möter texten
       tidsbrickan på högersidan. */
    .hero-copy {
      width: min(14rem, calc(44% - var(--hero-copy-inset)));
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

  @media (max-width: 320px) {
    .topbar h1 {
      font-size: 1.32rem;
    }

    .hero-copy h2 {
      font-size: 1.08rem;
    }

    .hero-copy > p {
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
    .now-cta,
    .home-card-action,
    .hero-companion-link,
    .explore-panel a,
    .privacy-row a {
      transition: none;
      animation: none !important;
      transform: none !important;
    }
  }
</style>
