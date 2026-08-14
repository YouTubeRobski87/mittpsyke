<script lang="ts">
  import { onMount } from 'svelte';
  import SEO from '$lib/components/SEO.svelte';
  import AccountTeaser from '$lib/components/AccountTeaser.svelte';
  import CompanionPose from '$lib/components/CompanionPose.svelte';
  import CompanionPresenceTracker from '$lib/components/CompanionPresenceTracker.svelte';
  import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
  import CompanionFriend from '$lib/components/world/CompanionFriend.svelte';
  import CompanionVisitor from '$lib/components/world/CompanionVisitor.svelte';
  import CompanionDailyCard from '$lib/components/world/CompanionDailyCard.svelte';
  import CompanionWorldResponse from '$lib/components/world/CompanionWorldResponse.svelte';
  import {
    Activity,
    ArrowRight,
    BookOpen,
    Feather,
    Heart,
    House,
    Lock,
    MessageCircle,
    Newspaper,
    Sprout,
    SunMedium,
    TrendingUp
  } from 'lucide-svelte';
  import {
    getProgressCompanionDayState,
    getProgressCompanionAnimal,
    getProgressCompanionArtId,
    type ProgressCompanionDayState,
    type ProgressCompanionSelection
  } from '$lib/progressCompanion';
  import { DASHBOARD_CABIN_COMPANION_PLACEMENTS } from '$lib/companionPoseManifest';
  import {
    canTriggerCompanionGreeting,
    COMPANION_GREETING_DURATION_MS,
    getCompanionGreeting
  } from '$lib/companionGreeting';
  import {
    getLivingWorldScene,
    getGardenGrowthPoints,
    getGrowthLevel,
    type LivingWorldScene
  } from '$lib/worldScene';
  import { getLivingWorldReflectionCopy } from '$lib/livingWorldCopy';
  import {
    COMPANION_DAILY_REACTION_DURATION_MS,
    getCompanionDailyQuestionById,
    getCompanionDailyReaction,
    shouldShowCompanionDailyQuestion,
    type CompanionDailyState
  } from '$lib/companionDailyQuestion';
  import { shouldTriggerWorldResponse } from '$lib/world/worldResponse';
  import { getCompanionBond, getCompanionBondLevel } from '$lib/companionBond';

  const ANONYMOUS_PREVIEW_COMPANION: ProgressCompanionSelection = { id: 'fox' };

  // Egen närbild av samma plats som Framsteg. Bilden innehåller inga djur;
  // CompanionPose är alltid det enda lagret som visar följeslagaren.
  const DASHBOARD_HERO_IMAGE = '/images/scenes/dashboard-cabin-close.webp';
  const DASHBOARD_HERO_SRCSET = [
    '/images/scenes/dashboard-cabin-close-800.webp 800w',
    '/images/scenes/dashboard-cabin-close-1200.webp 1200w',
    '/images/scenes/dashboard-cabin-close.webp 1915w'
  ].join(', ');

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
    companionDaily?: CompanionDailyState | null;
    isAnonymous?: boolean;
  };

  let { data } = $props<{ data: DashboardData }>();

  // Dagens fråga kommer färdigt bedömd från servern: är dagen redan hanterad
  // (svarad eller överhoppad) är status inte längre 'pending', och varken
  // refresh eller navigation tillbaka hit kan väcka frågan igen.
  // Serverns läge gäller, tills användaren svarar här och nu. Övertäckningen är
  // bara det lokala, optimistiska läget för det pågående besöket.
  let companionDailyOverride = $state<CompanionDailyState | null>(null);
  let companionDailyBusy = $state(false);
  let companionDailyReaction = $state<string | null>(null);
  let companionDailyReactionTimer: number | null = null;
	let companionVisitorActive = $state(false);
  // Transient räknare för världens korta svar. Sparas aldrig, varken i databasen
  // eller i localStorage - den lever bara så länge sidan är öppen.
  let worldResponseSignal = $state(0);

  const companionDailyState = $derived<CompanionDailyState | null>(
    companionDailyOverride ?? data.companionDaily ?? null
  );
  const companionDailyQuestion = $derived(
    companionDailyState ? getCompanionDailyQuestionById(companionDailyState.questionId) : null
  );
  const showCompanionDailyQuestion = $derived(
    Boolean(companionDailyQuestion) &&
      shouldShowCompanionDailyQuestion({
        isAnonymous: Boolean(data.isAnonymous),
        state: companionDailyState
      })
  );

  // Växtnivån (0-4) driver hur rik den beständiga världen är. Kommer från riktig
  // serverdata (totalEntries) redan vid SSR, så scenen är korrekt från första
  // paint. Svar på följeslagarens fråga väger ett halvt steg vardera - se
  // getGardenGrowthPoints; trösklarna bor kvar i getGrowthLevel.
  // Utloggad förhandsvisning använder en mellannivå så marknadsvyn lever.
  const growthLevel = $derived(
    data.isAnonymous
      ? 3
      : getGrowthLevel(
          getGardenGrowthPoints(
            data.progressPreview.totalEntries,
            companionDailyState?.answeredDayCount ?? 0
          )
        )
  );

  // Uppdateras från samma gemensamma helper som Framsteg, inte från egen
  // dashboardlogik. Det håller ljusgraderingen synkad mellan vyerna.
  let companionDayState = $state<ProgressCompanionDayState>(getProgressCompanionDayState());
  // Härledd, inte lagrad: scenen följer både klockan (sceneDate, som tickar en
  // gång i minuten) och växtnivån. Det gör att ett svar på dagens fråga syns i
  // världen direkt i stället för vid nästa tick.
  let sceneDate = $state(new Date());
  const livingWorldScene = $derived<LivingWorldScene>(
    getLivingWorldScene({ date: sceneDate, growthLevel, features: { cloud: true } })
  );
  let companionGreeting = $state<string | null>(null);
  let companionGreetingReaction = $state(0);
  let lastCompanionGreetingAt = 0;
  let companionGreetingTimer: number | null = null;

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
  const companionBondLevel = $derived(
    getCompanionBondLevel(getCompanionBond(companionDailyState?.answeredDayCount ?? 0))
  );
  const companionName = $derived(selectedCompanion?.name ?? 'Din följeslagare');
  const companionHeroImage = DASHBOARD_HERO_IMAGE;
  const heroCompanionId = $derived(
    companionArtId === 'bear' || companionArtId === 'wolf' ? companionArtId : 'fox'
  ) as 'fox' | 'bear' | 'wolf';
  const heroCompanionPlacement = $derived(DASHBOARD_CABIN_COMPANION_PLACEMENTS[heroCompanionId]);
  // Ingen alt-text för scenbilden: den är dekorativ (aria-hidden) och
  // följeslagaren beskrivs av CompanionPose, som vet vilket djur som visas.
  const heroCompanionIsSleeping = $derived(companionDayState === 'night');

  function greetCompanion() {
    const now = Date.now();
    if (!canTriggerCompanionGreeting(lastCompanionGreetingAt, now)) return;

    lastCompanionGreetingAt = now;
    companionGreetingReaction += 1;
    companionGreeting = getCompanionGreeting(displayName, companionGreetingReaction);

    if (companionGreetingTimer !== null) window.clearTimeout(companionGreetingTimer);
    companionGreetingTimer = window.setTimeout(() => {
      companionGreeting = null;
      companionGreetingTimer = null;
    }, COMPANION_GREETING_DURATION_MS);
  }

  /**
   * Markerar dagen som hanterad direkt i gränssnittet och skickar sedan svaret.
   * Ordningen är medveten: användaren ska aldrig vänta på nätverket, och ett
   * misslyckat anrop får inte ge en ny fråga i samma besök. answerId null =
   * hoppa över, vilket varken ger bond eller tillväxt i trädgården.
   */
  async function respondToCompanionDailyQuestion(answerId: string | null) {
    const state = companionDailyState;
    if (!state || companionDailyBusy || state.status !== 'pending') return;

    companionDailyBusy = true;
    companionDailyOverride = {
      ...state,
      status: answerId ? 'answered' : 'skipped',
      answerId,
      // Bandet och trädgården växer bara av ett faktiskt svar.
      answeredDayCount: state.answeredDayCount + (answerId ? 1 : 0)
    };

    if (answerId) {
      // Följeslagaren reagerar direkt: befintlig settle-gest via
      // greetingReaction, plus en kort replik i samma bubbla som hälsningen.
      companionGreetingReaction += 1;
      companionGreeting = null;
      companionDailyReaction = getCompanionDailyReaction(state.questionId, answerId);
      if (companionDailyReactionTimer !== null) window.clearTimeout(companionDailyReactionTimer);
      companionDailyReactionTimer = window.setTimeout(() => {
        companionDailyReaction = null;
        companionDailyReactionTimer = null;
      }, COMPANION_DAILY_REACTION_DURATION_MS);
    }

    try {
      const response = await fetch('/api/companion/daily-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: state.questionId, answerId })
      });

      // Världen svarar först när sparningen är bekräftad - aldrig optimistiskt,
      // aldrig vid hoppa över, och aldrig på en dag som redan var hanterad.
      // Följeslagarens egen reaktion ovan är däremot medvetet omedelbar: den ska
      // inte vänta på nätverket.
      if (
        shouldTriggerWorldResponse({
          isAnonymous: Boolean(data.isAnonymous),
          previousStatus: state.status,
          answerId,
          requestOk: response.ok
        })
      ) {
        worldResponseSignal += 1;
      }
    } catch {
      // Dagens fråga är frivillig och får aldrig störa besöket.
    } finally {
      companionDailyBusy = false;
    }
  }

  onMount(() => {
    const updateLocalTime = () => {
      const now = new Date();
      companionDayState = getProgressCompanionDayState(now);
      sceneDate = now;
    };

    updateLocalTime();
    const interval = window.setInterval(updateLocalTime, 60 * 1000);
    return () => {
      window.clearInterval(interval);
      if (companionGreetingTimer !== null) window.clearTimeout(companionGreetingTimer);
      if (companionDailyReactionTimer !== null) window.clearTimeout(companionDailyReactionTimer);
    };
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

      <div class="dashboard-body" class:has-daily={showCompanionDailyQuestion}>
      <section
        class="companion-hero"
        class:personal-preview={isAnonymous}
        data-companion={heroCompanionId}
        data-time={companionDayState}
        aria-label="Din följeslagare"
        style={`--hero-image: ${companionHeroImage ? `url('${companionHeroImage}')` : 'none'};`}
      >
        <!-- width/height ger webbläsaren bildens proportioner innan den laddats,
             så hjältekortet inte hoppar till. fetchpriority="high" eftersom det
             här är sidans LCP-element. -->
        <!-- Mitt Hem har en sidokolumn på desktop; hero-rutan är då som mest 984 px
             bred. Det egna sizes-värdet hindrar att 800w förstoras till desktopbredd. -->
        <img
          class="companion-hero-scene"
          srcset={DASHBOARD_HERO_SRCSET}
          sizes="(max-width: 620px) calc(100vw - 28px), (max-width: 980px) calc(100vw - 44px), (max-width: 1440px) calc(100vw - 360px), 984px"
          src={companionHeroImage}
          alt=""
          aria-hidden="true"
          width="1915"
          height="821"
          fetchpriority="high"
          decoding="async"
        />
        <a
          class="cabin-entrance"
          href="/dashboard/kvallsstugan"
          aria-label="Gå in i Kvällsstugan och öppna Kvällslugn"
        >
          <span aria-hidden="true">Kvällslugn</span>
        </a>
        <CompanionPose
          class="hero-companion-pose"
          companionId={heroCompanionId}
          scene="dashboard"
          placement={heroCompanionPlacement}
          greetingReaction={companionGreetingReaction}
          bondLevel={companionBondLevel}
			returnContextEnabled
        />
        <!-- En bubbla i taget vid följeslagaren. Reaktionen på dagens fråga har
             företräde framför hälsningen, så de aldrig kan ligga ovanpå varandra. -->
        {#if companionDailyReaction || companionGreeting}
          <p
            class="companion-greeting"
            style={`--companion-greeting-x: ${heroCompanionPlacement.x}%; --companion-greeting-y: ${heroCompanionPlacement.y}%;`}
            aria-live="polite"
            aria-atomic="true"
          >
            {companionDailyReaction ?? companionGreeting}
          </p>
        {/if}
        <CompanionVisitor
          class="hero-companion-visitor"
          mainCompanionId={heroCompanionId}
          isSleeping={heroCompanionIsSleeping}
          scene="dashboard"
          sceneAllowsVisitor={true}
			onVisitorChange={(isActive) => (companionVisitorActive = isActive)}
        />
        <AmbientWorld
          scene={livingWorldScene}
          class="hero-living-world"
          relationshipStage={isAnonymous ? 0 : companionRelationshipStage}
          visibleEffects={['moon', 'cloud', 'foliage', 'drift', 'butterfly', 'bird']}
          visibleEventKinds={['bird', 'butterfly', 'water', 'wind']}
          eventContext="dashboard"
          eventsBlocked={Boolean(companionDailyReaction || companionGreeting || companionVisitorActive)}
        />
        <!-- Kort, kosmetiskt svar från platsen efter en reflektion. Ligger i
             ambientbandet, alltså bakom följeslagaren, så pusten drar förbi den
             i stället för över den. -->
        <CompanionWorldResponse class="hero-world-response" signal={worldResponseSignal} />
        <CompanionFriend class="hero-companion-friend" companionId={heroCompanionId} stage={isAnonymous ? 0 : companionRelationshipStage} />
        <!-- Textytan ligger i stugscenens lugna högra del. Testet i
             companionPoseState.test.ts kontrollerar marginalen mot varje
             befintlig pose och djurplacering. -->
        <div class="hero-copy">
          <h2>{greeting}</h2>
          <p>{livingWorldReflectionCopy}</p>
          <div class="hero-companion-note">
            <span class="hero-companion-mark" aria-hidden="true"><Sprout size={18} /></span>
            <span class="hero-companion-text">
              <strong>Följeslagaren är här för dig.</strong>
              <small>{companionName} vakar lugnt över din resa.</small>
            </span>
            <button class="hero-companion-link" type="button" onclick={greetCompanion}>
              Säg hej till {companionName}
            </button>
          </div>
        </div>
        {#if isAnonymous}
          <div class="preview-note hero-preview-note">
            <AccountTeaser variant="dashboard" mode="overlay" />
          </div>
        {/if}
      </section>

        <!-- Frågan ligger strax under scenen, aldrig som en modal ovanpå den:
             världen och följeslagaren syns hela tiden. Kortet finns bara i DOM:en
             den dag frågan är obesvarad, och rutnätets grundläge är därför
             oförändrat resten av tiden (se .dashboard-body.has-daily). -->
        {#if showCompanionDailyQuestion && companionDailyQuestion}
          <CompanionDailyCard
            question={companionDailyQuestion}
            {companionName}
            busy={companionDailyBusy}
            onanswer={(answerId) => respondToCompanionDailyQuestion(answerId)}
            onskip={() => respondToCompanionDailyQuestion(null)}
          />
        {/if}

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
          </div>
          <p class="now-summary">{progressPreview.summary}</p>
          <a class="now-cta" href="/framsteg">
            Se alla framsteg
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>

        <section
          class="home-card checkin-card"
          aria-labelledby="dashboard-checkin-title"
          style="--checkin-image: url('/images/Dagboksbild%20med%20bok%2C%20kvist%20och%20kopp.png')"
        >
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
      'checkin checkin explore';
    gap: clamp(0.9rem, 1.4vw, 1.375rem);
    align-items: stretch;
  }

  /* Extraraden finns bara den dag följeslagarens fråga är obesvarad. Grundläget
     ovan rörs aldrig, så resten av tiden ser rutnätet ut precis som förut. */
  .dashboard-body.has-daily {
    grid-template-areas:
      'hero    hero   now'
      'daily   daily  daily'
      'checkin checkin explore';
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
    background-position: 50% 60%;
    display: none;
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
    /* Stugan är motivet i närbilden; följeslagaren är ett separat lager. */
    object-position: 50% 60%;
    display: block;
    z-index: var(--scene-background);
  }

  /* Endast dörren/verandan är en länk. Den är tillräckligt stor för touch men
     täcker aldrig hela världen eller följeslagarens egen interaktion. */
  .cabin-entrance {
    position: absolute;
    z-index: calc(var(--scene-overlay) + 1);
    left: 8%;
    top: 37%;
    width: 23%;
    height: 39%;
    min-width: 44px;
    min-height: 44px;
    border-radius: 12px;
    color: #fff7e6;
    text-decoration: none;
    outline: none;
  }

  .cabin-entrance span {
    position: absolute;
    left: 50%;
    bottom: 5px;
    padding: 0.28rem 0.48rem;
    border: 1px solid rgb(248 207 133 / 0.46);
    border-radius: 999px;
    background: rgb(27 21 15 / 0.72);
    box-shadow: 0 4px 14px rgb(8 8 8 / 0.22);
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    transform: translateX(-50%);
  }

  .cabin-entrance:hover,
  .cabin-entrance:focus-visible {
    box-shadow: inset 0 0 0 2px rgb(248 207 133 / 0.86), 0 0 0 3px rgb(20 29 37 / 0.56);
  }

  .cabin-entrance:focus-visible span {
    background: rgb(38 29 17 / 0.94);
  }

  .companion-hero :global(.hero-living-world) {
    z-index: var(--scene-ambient);
  }

  .companion-hero :global(.hero-companion-pose) {
    z-index: calc(var(--companion-z, 2) + 1);
  }

  /* Samma djupband som det (dolda) världslagret: bakom följeslagaren, framför
     scenbilden. Till skillnad från .hero-living-world döljs det här lagret inte
     - det är hela poängen med det. */
  .companion-hero :global(.hero-world-response) {
    z-index: var(--scene-ambient);
  }

  .companion-greeting {
    position: absolute;
    z-index: var(--scene-overlay);
    left: var(--companion-greeting-x);
    top: calc(var(--companion-greeting-y) - 43%);
    width: max-content;
    max-width: min(12.5rem, calc(100% - 32px));
    margin: 0;
    padding: 0.55rem 0.7rem;
    border: 1px solid rgb(217 202 166 / 0.38);
    border-radius: 12px;
    background: rgb(20 29 37 / 0.9);
    box-shadow: 0 8px 20px rgb(6 12 19 / 0.2);
    color: #f4f1e9;
    font-size: 0.84rem;
    font-weight: 650;
    line-height: 1.3;
    pointer-events: none;
    transform: translateX(-14%);
    animation: companionGreetingIn 180ms ease-out both;
  }

  .companion-greeting::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 34%;
    width: 11px;
    height: 11px;
    border-right: 1px solid rgb(217 202 166 / 0.38);
    border-bottom: 1px solid rgb(217 202 166 / 0.38);
    background: rgb(20 29 37 / 0.9);
    transform: rotate(45deg);
  }

  /* Stugan hålls ljus och öppen till vänster. En lågmäld toning över sjön till
     höger ger det befintliga textblocket lugn kontrast utan att täcka huset. */
  .companion-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: var(--scene-midground);
    background: linear-gradient(90deg, transparent 0 43%, rgb(9 19 33 / 0.16) 64%, rgb(9 19 33 / 0.72) 100%);
    pointer-events: none;
  }

  .companion-hero[data-time='evening'] .companion-hero-scene {
    filter: saturate(0.96) brightness(0.96) sepia(0.04);
  }

  .companion-hero[data-time='night'] .companion-hero-scene {
    filter: saturate(1.04) brightness(0.95);
  }

  .companion-hero[data-time='evening'] :global(.hero-companion-pose) {
    --companion-grade: saturate(0.68) contrast(0.88) brightness(0.88) sepia(0.18) hue-rotate(-6deg);
  }

  .companion-hero[data-time='night'] :global(.hero-companion-pose) {
    --companion-grade: saturate(0.55) contrast(0.84) brightness(0.72) sepia(0.14) hue-rotate(5deg);
  }

  /* Följeslagaren står vid huset. Texten använder den fria ytan till höger. */

  .companion-hero :global(.hero-companion-visitor),
  .companion-hero :global(.hero-companion-friend) {
    display: none;
  }

  /* Bredden är låst till den högra textytan. Marginalen verifieras mot varje
     dashboard-pose i companionPoseState.test.ts. */
  .hero-copy {
    position: absolute;
    z-index: var(--scene-overlay);
    --hero-copy-inset: clamp(20px, 3vw, 38px);
    right: var(--hero-copy-inset);
    left: auto;
    top: clamp(22px, 3.4vw, 42px);
    width: min(23rem, calc(40% - var(--hero-copy-inset)));
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
    font: inherit;
    font-weight: 700;
    font-size: 0.88rem;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.16s ease, transform 0.16s ease;
  }

  .hero-companion-link:hover {
    background: #fff;
    transform: translateY(-1px);
  }

  @keyframes companionGreetingIn {
    from {
      opacity: 0;
      transform: translateX(-14%) translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateX(-14%) translateY(0);
    }
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
    background: var(--checkin-image) right center / cover no-repeat;
    opacity: 1;
  }

  .checkin-card::before {
    content: '';
    position: absolute;
    inset: 0 0 0 42%;
    z-index: 1;
    background: transparent;
  }

  .checkin-card > * {
    position: relative;
    z-index: 2;
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

  .checkin-card .home-card-action {
    border-color: #cbb48b;
    background: #cbb48b;
    color: #101a28;
  }

  .checkin-card .home-card-action:hover {
    border-color: #dbc7a3;
    background: #dbc7a3;
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
        'checkin explore';
    }

    .dashboard-body.has-daily {
      grid-template-areas:
        'hero    hero'
        'daily   daily'
        'now     explore'
        'checkin explore';
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
        'explore';
    }

    .dashboard-body.has-daily {
      grid-template-areas:
        'hero'
        'daily'
        'now'
        'checkin'
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
      background: linear-gradient(90deg, transparent 0 38%, rgb(9 19 33 / 0.18) 61%, rgb(9 19 33 / 0.74) 100%);
    }

    /* Vänsterförankringen bevarar stuga, dörr och veranda i mobil-cropen. */
    .companion-hero-scene {
      object-position: 0% 60%;
    }

    .cabin-entrance {
      left: 5%;
      top: 35%;
      width: 27%;
      height: 42%;
    }

    /* Följeslagaren stannar vid huset till vänster, medan copy behåller den
       mörkare sjöytan till höger. */
    .hero-copy {
      --hero-copy-inset: 16px;
      right: var(--hero-copy-inset);
      left: auto;
      top: 18px;
      width: min(15rem, calc(46% - var(--hero-copy-inset)));
    }

    .hero-copy h2 {
      font-size: 1.35rem;
    }

    .hero-copy > p {
      margin: 0.4rem 0 0;
      font-size: 0.88rem;
    }

    /* CTA:n är en sceninteraktion, inte en chattlänk, och ska därför vara
       åtkomlig även på mobil. Själva companion-copyn döljs för att ge plats. */
    .hero-companion-note {
      display: block;
      padding: 0;
      border: 0;
      background: none;
      box-shadow: none;
    }

    .hero-companion-mark,
    .hero-companion-text {
      display: none;
    }

    .hero-companion-link {
      width: 100%;
      min-height: 38px;
      margin-top: 0.65rem;
      padding: 0.42rem 0.5rem;
      font-size: 0.78rem;
      line-height: 1.25;
    }

    .companion-greeting {
      top: calc(var(--companion-greeting-y) - 47%);
      max-width: 7rem;
      padding: 0.46rem 0.55rem;
      font-size: 0.76rem;
      transform: translateX(-40%);
    }

    .companion-greeting::after {
      left: 50%;
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

    /* Smalare, inte bredare, ju mindre skärmen blir - så stugan och
       följeslagaren fortfarande får sin vänstra del av scenen. */
    .hero-copy {
      width: min(13.5rem, calc(44% - var(--hero-copy-inset)));
    }

    .hero-copy h2 {
      font-size: 1.22rem;
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

    .companion-greeting {
      animation: none;
    }
  }
</style>
