<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import SEO from '$lib/components/SEO.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import EntryCard from '$lib/components/EntryCard.svelte';
  import SilentCompanion from '$lib/components/dashboard/SilentCompanion.svelte';
  import { trackTikTokButtonClick } from '$lib/analytics/tiktokPixel';
  import { supabase } from '$lib/supabase';
  import type { ProgressCompanionSelection } from '$lib/progressCompanion';
  import {
    SENSITIVE_CONSENT_HEADER,
    SENSITIVE_CONSENT_VERSION,
    hasSensitiveConsent
  } from '$lib/consent';

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
  };

  let { data } = $props<{ data: DashboardData }>();

  const diaryPreview    = $derived(data.diaryPreview);
  const progressPreview = $derived(data.progressPreview);
  const settingsPreview = $derived(data.settingsPreview);
  const primaryDiaryCtaLabel = $derived(diaryPreview.hasEntry ? 'Fortsätt från senast' : 'Börja i dagboken');
  const fallbackDailyQuestion = 'Vad behöver få lite mer plats hos dig idag?';

  // StatCard-data baserad på riktig progressPreview
  const stats = $derived([
    {
      label: 'Inlägg denna vecka',
      value: String(progressPreview.weeklyEntries),
      sub: progressPreview.summary,
      points: [4, 6, 3, 7, 5, progressPreview.weeklyEntries, progressPreview.weeklyEntries]
    },
    {
      label: 'Återvända dagar',
      value: `${progressPreview.currentStreak} dag${progressPreview.currentStreak === 1 ? '' : 'ar'}`,
      sub: 'nära i tid',
      points: [1, 2, 3, 4, 5, 6, progressPreview.currentStreak]
    },
    {
      label: 'Totalt',
      value: String(progressPreview.totalEntries),
      sub: 'inlägg',
      points: [10, 14, 18, 22, 26, 30, progressPreview.totalEntries]
    }
  ]);

  // Growth Garden — stilla status baserad på återkommande dagar
  const gardenStatus = $derived.by(() => {
    const s = progressPreview.currentStreak;
    if (s === 0) return 'Din trädgård väntar på sitt första frö';
    if (s <= 2) return 'Ett litet skott tittar fram';
    if (s <= 6) return 'Den börjar slå rot';
    if (s <= 13) return 'Blommar lite mer idag';
    return 'Står i full blom';
  });
  const gardenStage = $derived.by(() => {
    const s = progressPreview.currentStreak;
    if (s === 0) return 0;
    if (s <= 2) return 1;
    if (s <= 6) return 2;
    if (s <= 13) return 3;
    return 4;
  });
  // Hur många växter som blommar (av 5) — växer med stadiet
  const gardenPlants = $derived([0, 1, 2, 3, 4].map((i) => i < gardenStage + 1));

  // ── AI-insikter (teaser på dashboarden) ──
  type InsightItem = { title: string; description: string };
  type InsightsResponse = {
    insights: InsightItem[];
    aiSummary: string | null;
  };
  let insightsConsent = $state(browser ? hasSensitiveConsent() : false);
  let insightsLoading = $state(false);
  let insightsLoaded = $state(false);
  let topInsight = $state<InsightItem | null>(null);
  let insightSummary = $state<string | null>(null);

  async function loadInsightTeaser() {
    if (!insightsConsent || insightsLoaded) return;
    insightsLoading = true;
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/diary/insights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          [SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
        }
      });
      if (!res.ok) return;
      const payload = (await res.json()) as InsightsResponse;
      insightSummary = payload.aiSummary ?? null;
      topInsight = payload.insights?.[0] ?? null;
      insightsLoaded = true;
    } catch {
      // Tyst fallback — teaser visar inbjudan istället
    } finally {
      insightsLoading = false;
    }
  }
  const hasInsightContent = $derived(Boolean(insightSummary || topInsight));

  type DailyQuestionPayload = {
    id?: string | null;
    question?: string;
    date?: string;
    regenerations?: number;
    maxRegenerations?: number;
    safety?: boolean;
    error?: string;
  };

  type SpegelvattnetPayload = {
    reflection?: {
      id: string;
      week_start: string;
      status: 'ready' | 'paused';
      paused_reason: string | null;
    };
    error?: string;
  };

  let dailyQuestion              = $state('');
  let dailyQuestionId            = $state<string | null>(null);
  let dailyQuestionDate          = $state('');
  let dailyQuestionRegenerations = $state(0);
  let dailyQuestionMaxRegenerations = $state(2);
  let dailyQuestionSafety        = $state(false);
  let dailyQuestionLoading       = $state(true);
  let dailyQuestionRegenerating  = $state(false);
  let dailyQuestionError         = $state('');
  let spegelReflection           = $state<SpegelvattnetPayload['reflection'] | null>(null);
  let spegelLoading              = $state(false);

  const dailyQuestionDiaryHref = $derived(
    `/dagbok/checkin?prompt=${encodeURIComponent(dailyQuestion || fallbackDailyQuestion)}${dailyQuestionId ? `&daily_question_id=${encodeURIComponent(dailyQuestionId)}` : ''}#skriv-sjalv`
  );
  const canRegenerateDailyQuestion = $derived(
    !dailyQuestionSafety && dailyQuestionRegenerations < dailyQuestionMaxRegenerations
  );
  const shouldShowSpegelvattnet = $derived(Boolean(spegelReflection) && !spegelLoading);

  function todayKey() {
    return new Intl.DateTimeFormat('sv-CA', {
      timeZone: 'Europe/Stockholm',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }
  function cacheKey(date = todayKey()) {
    return `mittpsyke_daily_question_${date}`;
  }
  function readCachedDailyQuestion() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey()) ?? 'null') as DailyQuestionPayload | null;
      if (!cached?.question || cached.date !== todayKey()) return null;
      return cached;
    } catch { return null; }
  }
  function applyDailyQuestion(payload: DailyQuestionPayload) {
    dailyQuestion = payload.question?.trim() || fallbackDailyQuestion;
    dailyQuestionId = payload.id ?? null;
    dailyQuestionDate = payload.date || todayKey();
    dailyQuestionRegenerations = payload.regenerations ?? 0;
    dailyQuestionMaxRegenerations = payload.maxRegenerations ?? 2;
    dailyQuestionSafety = Boolean(payload.safety);
    dailyQuestionError = '';
  }
  function cacheDailyQuestion(payload: DailyQuestionPayload) {
    if (typeof localStorage === 'undefined' || !payload.question || payload.safety) return;
    localStorage.setItem(cacheKey(payload.date), JSON.stringify(payload));
  }
  function isSundayOrMonday() {
    const weekday = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Stockholm', weekday: 'short'
    }).format(new Date()).toLowerCase();
    return weekday.startsWith('sön') || weekday.startsWith('mån');
  }

  async function loadSpegelvattnet() {
    if (!isSundayOrMonday()) return;
    spegelLoading = true;
    try {
      const response = await fetch('/api/spegelvattnet/latest');
      const payload = (await response.json().catch(() => ({}))) as SpegelvattnetPayload;
      if (response.ok && payload.reflection) spegelReflection = payload.reflection;
    } finally {
      spegelLoading = false;
    }
  }

  async function loadDailyQuestion() {
    const cached = readCachedDailyQuestion();
    if (cached) {
      applyDailyQuestion(cached);
      dailyQuestionLoading = false;
      return;
    }
    dailyQuestionLoading = true;
    try {
      const response = await fetch('/api/daily-question');
      const payload = (await response.json().catch(() => ({}))) as DailyQuestionPayload;
      if (!response.ok) {
        dailyQuestionError = payload.error ?? 'Kunde inte hämta dagens fråga just nu.';
        dailyQuestion = fallbackDailyQuestion;
        return;
      }
      applyDailyQuestion(payload);
      cacheDailyQuestion(payload);
    } catch {
      dailyQuestion = fallbackDailyQuestion;
      dailyQuestionError = 'Kunde inte hämta dagens fråga just nu.';
    } finally {
      dailyQuestionLoading = false;
    }
  }

  async function regenerateDailyQuestion() {
    if (!canRegenerateDailyQuestion || dailyQuestionRegenerating) return;
    dailyQuestionRegenerating = true;
    dailyQuestionError = '';
    try {
      const response = await fetch('/api/daily-question/regenerate', { method: 'POST' });
      const payload = (await response.json().catch(() => ({}))) as DailyQuestionPayload;
      if (!response.ok) {
        dailyQuestionError = payload.error ?? 'Kunde inte byta fråga just nu.';
        if (payload.question) applyDailyQuestion(payload);
        return;
      }
      applyDailyQuestion(payload);
      cacheDailyQuestion(payload);
    } catch {
      dailyQuestionError = 'Kunde inte byta fråga just nu.';
    } finally {
      dailyQuestionRegenerating = false;
    }
  }

  onMount(() => {
    void loadDailyQuestion();
    void loadSpegelvattnet();
    void loadInsightTeaser();
  });
</script>

<SEO canonical="https://www.mittpsyke.se/dashboard" />

<div class="mp-dashboard">
  <div class="shell">
    <Sidebar active="hem" />

    <main class="main">

      <!-- ── Hero ── -->
      <section class="hero-card">
        <div class="hero-left">
          <div class="kicker">Din plats just nu</div>
          <h1>Välkommen tillbaka{settingsPreview.displayName ? ', ' + settingsPreview.displayName : ''}</h1>
          <p class="hero-lead">Du behöver inte veta exakt vad du känner. Börja med en rad, eller fortsätt där du slutade.</p>
          <div class="hero-actions">
            <a
              href="/dagbok/checkin#senaste-inlagg"
              class="btn btn-primary"
              onclick={() => trackTikTokButtonClick('continue_writing')}>Fortsätt skriva</a>
            <a href="/dagbok/checkin#skriv-sjalv" class="btn btn-ghost">Skriv nytt avtryck</a>
          </div>
        </div>
        <div class="hero-reminder">
          <small>Fokus just nu</small>
          <blockquote>{settingsPreview.dashboardFocusLabel}</blockquote>
          <span>💜</span>
        </div>
      </section>

      <SilentCompanion progressCompanion={data.progressCompanion ?? null} />

      <!-- ── Featured: det som gör MittPsyke unikt ── -->
      <section class="featured">

        <!-- Growth Garden -->
        <a href="/framsteg#growth-garden" class="feature-card garden-feature">
          <div class="feature-head">
            <p class="card-kicker">🌱 Din trädgård</p>
            <span class="garden-rhythm">{progressPreview.currentStreak} dag{progressPreview.currentStreak === 1 ? '' : 'ar'} nära i tid</span>
          </div>

          <!-- Mini-trädgård: växer långsamt med återkommande dagar -->
          <svg class="garden-svg" viewBox="0 0 260 96" aria-hidden="true">
            <defs>
              <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="rgba(124,92,255,0.12)" />
                <stop offset="1" stop-color="rgba(124,92,255,0)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="260" height="96" fill="url(#garden-sky)" rx="12" />
            <!-- mark -->
            <path d="M0 80 Q130 70 260 80 L260 96 L0 96 Z" fill="rgba(110,231,168,0.14)" />
            <line x1="12" y1="81" x2="248" y2="81" stroke="rgba(110,231,168,0.3)" stroke-width="1.5" />
            {#each gardenPlants as bloom, i}
              {@const cx = 36 + i * 48}
              {#if bloom}
                <g class="plant" style="--d:{i * 0.12}s">
                  <line x1={cx} y1="81" x2={cx} y2={gardenStage >= 3 ? 52 : 60} stroke="#6ee7a8" stroke-width="2.5" stroke-linecap="round" />
                  <path d={`M${cx} ${gardenStage >= 3 ? 60 : 66} q-12 -4 -14 -14 q12 0 14 14`} fill="rgba(110,231,168,0.55)" />
                  <path d={`M${cx} ${gardenStage >= 3 ? 60 : 66} q12 -4 14 -14 q-12 0 -14 14`} fill="rgba(110,231,168,0.55)" />
                  {#if gardenStage >= 3}
                    <circle cx={cx} cy="48" r="6.5" fill="var(--mp-lila)" />
                    <circle cx={cx} cy="48" r="2.5" fill="#fff" opacity="0.85" />
                  {:else}
                    <circle cx={cx} cy={gardenStage >= 2 ? 56 : 60} r="4" fill="#8ef0b6" />
                  {/if}
                </g>
              {:else}
                <circle cx={cx} cy="79" r="2.5" fill="rgba(255,255,255,0.12)" />
              {/if}
            {/each}
          </svg>

          <p class="garden-status">{gardenStatus}</p>
          <span class="feature-link">Se din trädgård växa →</span>
        </a>

        <!-- AI-insikter -->
        <a href="/insikter" class="feature-card insight-feature">
          <div class="feature-head">
            <p class="card-kicker">💡 AI-insikter</p>
          </div>

          {#if insightsLoading}
            <div class="skeleton-block" aria-label="Hämtar insikter"></div>
          {:else if hasInsightContent}
            {#if insightSummary}
              <p class="insight-summary">"{insightSummary}"</p>
            {:else if topInsight}
              <p class="insight-title">{topInsight.title}</p>
              <p class="insight-desc">{topInsight.description}</p>
            {/if}
            <span class="feature-link">Se alla insikter →</span>
          {:else}
            <p class="insight-invite">
              Låt AI hitta mönster, teman och utveckling i dina dagboksrader — helt privat.
            </p>
            <span class="feature-link">Generera dina insikter →</span>
          {/if}
        </a>

      </section>

      <!-- ── Statistik ── -->
      <div class="section-title section-title-spaced">Din resa över tid</div>
      <section class="stats">
        {#each stats as s}
          <StatCard label={s.label} value={s.value} sub={s.sub} points={s.points} />
        {/each}
      </section>

      <!-- ── Dagens fråga (prominent) ── -->
      <section class="daily-hero">
        <p class="daily-hero-kicker">❤️ Dagens fråga</p>
        {#if dailyQuestionLoading && !dailyQuestion}
          <div class="skeleton-lg" aria-label="Hämtar dagens fråga"></div>
        {:else}
          <h2 class="daily-hero-q">{dailyQuestion || fallbackDailyQuestion}</h2>
        {/if}
        {#if dailyQuestionSafety}
          <p class="daily-hero-sub">Om det känns akut, ring 112. Fler stödlinjer på stodlinjer.se.</p>
        {:else}
          <p class="daily-hero-sub">Svara kort eller långt. Det räcker att börja där du är.</p>
        {/if}
        <div class="daily-hero-actions">
          <a href={dailyQuestionDiaryHref} class="btn btn-primary btn-lg">Svara nu</a>
          {#if !dailyQuestionSafety}
            <button
              type="button"
              class="refresh-btn"
              onclick={regenerateDailyQuestion}
              disabled={!canRegenerateDailyQuestion || dailyQuestionRegenerating || dailyQuestionLoading}
              title={!canRegenerateDailyQuestion ? 'Du kan byta fråga två gånger per dag.' : 'Byt fråga'}
            >{dailyQuestionRegenerating ? 'Byter...' : 'Byt fråga'}</button>
          {/if}
        </div>
        {#if dailyQuestionError}
          <p class="card-warn">{dailyQuestionError}</p>
        {/if}
      </section>

      <!-- ── Dina kort ── -->
      <div class="section-title section-title-spaced">Dina kort</div>
      <section class="cards-row">

        <!-- Senaste dagboksrad -->
        {#if diaryPreview.hasEntry}
          <EntryCard
            title="Senaste avtryck"
            body={diaryPreview.snippet}
            time={diaryPreview.dateLabel}
          />
        {:else}
          <article class="entry-placeholder">
            <p>Din dagbok väntar stilla. Ett första avtryck kan vara en enda rad.</p>
            <a href="/dagbok/checkin#skriv-sjalv" class="btn btn-ghost">Börja skriva</a>
          </article>
        {/if}

        <!-- Spegelvattnet (sön/mån) -->
        {#if shouldShowSpegelvattnet && spegelReflection}
          <article class="daily-card spegel">
            <p class="card-kicker">Spegelvattnet</p>
            {#if spegelReflection.status === 'paused'}
              <h3>Spegelvattnet är stilla den här veckan.</h3>
              <p class="card-sub">Om något känns tungt finns Stödlinjer alltid där: stodlinjer.se. Vid akut fara, ring 112.</p>
              <a href="https://stodlinjer.se" class="btn btn-ghost" rel="noreferrer">Öppna stödlinjer</a>
            {:else}
              <h3>Spegelvattnet är stilla den här söndagen. Vill du titta?</h3>
              <a href="/spegelvattnet" class="btn btn-ghost">Öppna →</a>
            {/if}
          </article>
        {/if}

      </section>

      <!-- ── Portal-kort ── -->
      <div class="section-title">Snabb översikt</div>
      <section class="portal-grid">

        <article class="portal-card">
          <div class="portal-head">
            <p class="card-kicker">Dagbok</p>
            {#if diaryPreview.hasEntry && diaryPreview.dateLabel}
              <span class="portal-meta">{diaryPreview.dateLabel}</span>
            {/if}
          </div>
          <h2>{diaryPreview.hasEntry ? 'Fortsätt där du var' : 'Börja med ett par ord'}</h2>
          <p class="portal-copy">{diaryPreview.snippet}</p>
          {#if diaryPreview.hasEntry}
            <p class="card-sub">Din dagbok sparar det viktigaste, så att du kan plocka upp tråden senare.</p>
          {/if}
          <a href="/dagbok/checkin" class="btn btn-ghost">{primaryDiaryCtaLabel}</a>
        </article>

        <article class="portal-card">
          <div class="portal-head">
            <p class="card-kicker">Framsteg</p>
            <span class="portal-meta">
              {progressPreview.currentStreak} dag{progressPreview.currentStreak === 1 ? '' : 'ar'} nära i tid
            </span>
          </div>
          <h2>Små steg som syns</h2>
          <p class="portal-copy">{progressPreview.summary}</p>
          <div class="stat-row">
            <span>{progressPreview.weeklyEntries} denna vecka</span>
            <span>{progressPreview.totalEntries} totalt</span>
          </div>
          <a href="/framsteg" class="btn btn-ghost">Se framsteg</a>
        </article>

        <article class="portal-card">
          <div class="portal-head">
            <p class="card-kicker">Inställningar</p>
            <span class="portal-meta">{settingsPreview.themeLabel}</span>
          </div>
          <h2>Det som formar din portal</h2>
          <p class="portal-copy">
            Rytm: {settingsPreview.weeklyGoalLabel}. Fokus: {settingsPreview.dashboardFocusLabel}.
          </p>
          <a href="/dashboard/installningar" class="btn btn-ghost">Öppna inställningar</a>
        </article>

      </section>
    </main>
  </div>
</div>

<style>
  /* ── Design-tokens (scopade till den här sidan) ── */
  .mp-dashboard{
    --mp-lila:        #a882ff;
    --mp-lila-2:      #7c5cff;
    --mp-card:        rgba(255,255,255,0.04);
    --mp-card-border: rgba(168,130,255,0.14);
    --mp-text:        #e8e6f0;
    --mp-text-dim:    #9a98ad;
    --mp-radius:      18px;

    color: var(--mp-text);
    min-height: 100vh;
    padding: 28px;
    background:
      radial-gradient(1200px 600px at 80% -10%, rgba(124,92,255,0.18), transparent 60%),
      radial-gradient(900px 500px at 10% 110%, rgba(168,130,255,0.14), transparent 55%),
      linear-gradient(160deg, #0a0a14, #11101f 60%, #0d0b1a);
  }

  /* ── Grundlayout ── */
  .shell{
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 248px 1fr; gap: 24px;
  }
  .main{ display: flex; flex-direction: column; gap: 24px; }

  .section-title{
    font-size: 0.78rem; letter-spacing: .08em; text-transform: uppercase;
    color: var(--mp-text-dim); margin: 4px 2px;
  }
  /* Mer luft före "Dina kort" (punkt 4) */
  .section-title-spaced{ margin-top: 18px; }

  /* ── Knappar ── */
  .btn{
    display: inline-flex; align-items: center;
    padding: 10px 18px; border-radius: 11px;
    font-size: 0.88rem; font-weight: 600;
    text-decoration: none; border: none; cursor: pointer;
    transition: .15s;
  }
  .btn-primary{
    background: linear-gradient(135deg, var(--mp-lila-2), var(--mp-lila)); color: #fff;
  }
  .btn-ghost{
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--mp-card-border); color: var(--mp-text);
  }
  .btn-ghost:hover{ background: rgba(255,255,255,0.1); }
  .btn-lg{
    padding: 14px 30px; font-size: 1rem; border-radius: 13px;
    box-shadow: 0 10px 24px rgba(124,92,255,0.28);
  }
  .btn-lg:hover{ transform: translateY(-1px); }

  /* ── Hero ── */
  .hero-card{
    display: grid; grid-template-columns: 1.5fr 1fr; gap: 22px;
    background: var(--mp-card);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius); padding: 30px;
    backdrop-filter: blur(14px);
  }
  .kicker{ font-size: 0.78rem; letter-spacing: .05em; text-transform: uppercase; color: var(--mp-lila); margin-bottom: 6px; }
  .hero-card h1{ font-size: 1.65rem; margin: 0 0 10px; font-weight: 700; }
  .hero-lead{ color: var(--mp-text-dim); line-height: 1.55; margin: 0 0 20px; }
  .hero-actions{ display: flex; gap: 10px; flex-wrap: wrap; }
  .hero-reminder{
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--mp-card-border);
    border-radius: 14px; padding: 18px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .hero-reminder small{ color: var(--mp-lila); font-size: 0.75rem; letter-spacing: .04em; text-transform: uppercase; }
  .hero-reminder blockquote{ font-size: 0.92rem; line-height: 1.5; font-style: italic; margin: 0; color: var(--mp-text); }

  /* ── Statistikkort ── */
  .stats{ display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }

  /* ── Kort-rad (dagboksrad + daglig fråga + spegel) ── */
  .cards-row{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 18px; }

  .entry-placeholder{
    border: 1px solid var(--mp-card-border);
    border-radius: 13px; padding: 20px 18px;
    background: rgba(255,255,255,0.02);
    display: flex; flex-direction: column; gap: 14px;
  }
  .entry-placeholder p{ font-size: 0.88rem; color: var(--mp-text-dim); line-height: 1.5; margin: 0; }

  .daily-card{
    border: 1px solid var(--mp-card-border);
    border-radius: 13px; padding: 18px;
    background: rgba(255,255,255,0.02);
    display: flex; flex-direction: column; gap: 10px;
  }
  .daily-card.spegel{
    background: linear-gradient(135deg, rgba(124,92,255,0.1), rgba(168,130,255,0.04));
    border-color: rgba(168,130,255,0.25);
  }
  .daily-card h3{ margin: 0; font-size: 1rem; line-height: 1.4; }

  .card-kicker{ margin: 0; font-size: 0.75rem; letter-spacing: .05em; text-transform: uppercase; color: var(--mp-lila); }
  .card-sub{ margin: 0; font-size: 0.82rem; color: var(--mp-text-dim); line-height: 1.5; }
  .card-warn{ margin: 0; font-size: 0.82rem; color: hsl(39 92% 82% / 0.92); }

  /* ── Dagens fråga (prominent, punkt 6) ── */
  .daily-hero{
    border-radius: var(--mp-radius); padding: 32px 34px;
    background:
      radial-gradient(700px 300px at 100% 0%, rgba(124,92,255,0.18), transparent 55%),
      linear-gradient(135deg, rgba(124,92,255,0.14), rgba(168,130,255,0.05));
    border: 1px solid rgba(168,130,255,0.28);
    display: flex; flex-direction: column; gap: 14px;
    backdrop-filter: blur(14px);
  }
  .daily-hero-kicker{ margin: 0; font-size: 0.8rem; letter-spacing: .05em; text-transform: uppercase; color: var(--mp-lila); }
  .daily-hero-q{
    margin: 0; font-size: 1.7rem; font-weight: 700; line-height: 1.3;
    max-width: 28ch; color: var(--mp-text);
  }
  .daily-hero-sub{ margin: 0; font-size: 0.95rem; color: var(--mp-text-dim); }
  .daily-hero-actions{ display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 4px; }

  /* ── Featured-band (unika funktioner) ── */
  .featured{ display: grid; grid-template-columns: 1.15fr 1fr; gap: 18px; }
  .feature-card{
    display: flex; flex-direction: column; gap: 12px;
    border-radius: var(--mp-radius); padding: 22px 24px;
    text-decoration: none; color: var(--mp-text);
    backdrop-filter: blur(14px); transition: .15s;
    min-height: 210px;
  }
  .feature-card:hover{ transform: translateY(-2px); }
  .feature-head{ display: flex; align-items: center; justify-content: space-between; gap: 10px; }

  .garden-feature{
    background:
      radial-gradient(500px 200px at 0% 100%, rgba(110,231,168,0.14), transparent 60%),
      linear-gradient(135deg, rgba(110,231,168,0.08), rgba(124,92,255,0.05));
    border: 1px solid rgba(110,231,168,0.24);
  }
  .garden-feature:hover{ border-color: rgba(110,231,168,0.42); }
  .garden-svg{ width: 100%; height: auto; display: block; margin: 2px 0; }
  .plant{
    transform-origin: bottom center;
    animation:
      sprout .6s ease both,
      portal-plant-sway 18s ease-in-out infinite;
    animation-delay: var(--d), calc(var(--d, 0s) + 1.2s);
  }
  @keyframes sprout { from{ transform: scaleY(0); opacity: 0 } to{ transform: scaleY(1); opacity: 1 } }
  @keyframes portal-plant-sway {
    0%, 100% { transform: rotate(0deg); }
    48% { transform: rotate(-0.7deg); }
    72% { transform: rotate(0.4deg); }
  }
  .garden-status{ margin: 0; font-size: 0.9rem; color: var(--mp-text); font-weight: 500; }
  .garden-rhythm{
    font-size: 0.78rem; font-weight: 600; white-space: nowrap;
    padding: 5px 12px; border-radius: 20px;
    background: rgba(110,231,168,0.12); color: #8ef0b6;
    border: 1px solid rgba(110,231,168,0.25);
  }

  .insight-feature{
    background:
      radial-gradient(500px 220px at 100% 0%, rgba(168,130,255,0.16), transparent 58%),
      linear-gradient(135deg, rgba(124,92,255,0.1), rgba(168,130,255,0.04));
    border: 1px solid rgba(168,130,255,0.26);
  }
  .insight-feature:hover{ border-color: rgba(168,130,255,0.45); }
  .insight-summary{ margin: 0; font-size: 1.05rem; line-height: 1.55; font-style: italic; color: var(--mp-text); }
  .insight-title{ margin: 0; font-size: 1rem; font-weight: 700; }
  .insight-desc{ margin: 0; font-size: 0.88rem; color: var(--mp-text-dim); line-height: 1.5; }
  .insight-invite{ margin: 0; font-size: 0.95rem; color: var(--mp-text-dim); line-height: 1.6; }

  .feature-link{
    margin-top: auto; font-size: 0.85rem; font-weight: 600; color: var(--mp-lila);
  }
  .skeleton-block{
    flex: 1; min-height: 90px; border-radius: 12px;
    background: linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.12), rgba(255,255,255,.05));
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
  }

  /* Stor skeleton för dagens fråga */
  .skeleton-lg{
    width: min(100%, 26rem); height: 2rem; border-radius: 10px;
    background: linear-gradient(90deg, rgba(255,255,255,.07), rgba(255,255,255,.16), rgba(255,255,255,.07));
    background-size: 200% 100%;
    animation: shimmer 1.2s ease-in-out infinite;
  }

  .refresh-btn{
    border: 0; background: transparent; padding: 0;
    color: var(--mp-text-dim); font: inherit; font-size: 0.85rem;
    text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
  }
  .refresh-btn:hover:not(:disabled){ color: var(--mp-text); }
  .refresh-btn:disabled{ opacity: .45; cursor: default; text-decoration: none; }

  @keyframes shimmer { from{ background-position:100% 0 } to{ background-position:-100% 0 } }

  /* ── Portal-grid ── */
  .portal-grid{ display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
  .portal-card{
    background: var(--mp-card); border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius); padding: 22px;
    backdrop-filter: blur(14px);
    display: flex; flex-direction: column; gap: 12px;
  }
  .portal-card h2{ margin: 0; font-size: 1rem; font-weight: 700; }
  .portal-head{ display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .portal-meta{ font-size: 0.8rem; color: var(--mp-text-dim); }
  .portal-copy{ margin: 0; font-size: 0.87rem; color: var(--mp-text-dim); line-height: 1.55; }
  .stat-row{ display: flex; gap: 14px; font-size: 0.82rem; color: var(--mp-text-dim); }

  /* ── Responsiv ── */
  @media (max-width: 1024px){
    .portal-grid{ grid-template-columns: repeat(2,1fr); }
  }
  @media (max-width: 880px){
    .shell{ grid-template-columns: 1fr; }
    .stats{ grid-template-columns: 1fr; }
    .hero-card{ grid-template-columns: 1fr; }
    .portal-grid{ grid-template-columns: 1fr; }
    .featured{ grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce){
    .plant{ animation: none; }
  }
</style>
