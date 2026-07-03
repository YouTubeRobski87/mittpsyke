<script lang="ts">
  export let label = '';
  export let value = '';
  export let sub = '';
  /** Array med tal, t.ex. [28,24,26,16,18,8,12] — ritas som spark-linje */
  export let points: number[] = [28, 24, 26, 16, 18, 8, 12];

  type SparkPoint = {
    x: number;
    y: number;
    value: number;
  };

  type Trend = 'up' | 'down' | 'flat';

  // Räkna fram koordinater i viewBox-enheter (120 x 34)
  $: coords = ((): SparkPoint[] => {
    if (!points.length) return [];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const stepX = points.length > 1 ? 120 / (points.length - 1) : 0;
    return points.map((p, i) => ({
      x: i * stepX,
      y: 30 - ((p - min) / span) * 26,
      value: p
    }));
  })();

  $: path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  // Index för "idag" (sista punkten) och "bästa perioden" (högsta värdet)
  $: todayIdx = coords.length - 1;
  $: bestIdx = coords.reduce((best, c, i) => (c.value > coords[best].value ? i : best), 0);

  // Trend: jämför sista mot första punkten
  $: trend = ((): Trend => {
    if (coords.length < 2) return 'flat';
    const diff = points[points.length - 1] - points[0];
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
    return 'flat';
  })();

  const trendIcon: Record<Trend, string> = { up: '↑', down: '↓', flat: '→' };
  const trendLabel: Record<Trend, string> = { up: 'Uppåt', down: 'Nedåt', flat: 'Stabilt' };

  // Procentposition för HTML-markörer (matchar den utstretchade SVG:n)
  const pct = (c: SparkPoint) => ({ left: (c.x / 120) * 100, top: (c.y / 34) * 100 });

  // Unikt gradient-id så flera kort på samma sida inte krockar
  const gid = 'mp-spark-' + Math.random().toString(36).slice(2, 9);
</script>

<div class="stat">
  <div class="stat-head">
    <div class="label">{label}</div>
    <span class="trend trend-{trend}" title={trendLabel[trend]}>{trendIcon[trend]}</span>
  </div>
  <div class="num">{value}</div>
  {#if sub}<div class="sub">{sub}</div>{/if}

  <div class="spark-wrap">
    <svg class="spark" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--mp-lila-2)" />
          <stop offset="1" stop-color="var(--mp-lila)" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={`url(#${gid})`} stroke-width="2.4"
            stroke-linejoin="round" stroke-linecap="round" />
    </svg>

    {#if coords.length}
      <!-- Bästa perioden: ring -->
      {#if bestIdx !== todayIdx}
        <span class="marker best" style="left:{pct(coords[bestIdx]).left}%; top:{pct(coords[bestIdx]).top}%"></span>
      {/if}
      <!-- Idag: fylld prick (färgad efter trend) -->
      <span class="marker today trend-{trend}" style="left:{pct(coords[todayIdx]).left}%; top:{pct(coords[todayIdx]).top}%"></span>
    {/if}
  </div>

  <div class="legend">
    <span><i class="dot today-dot trend-{trend}"></i> Idag</span>
    {#if bestIdx !== todayIdx}<span><i class="dot best-dot"></i> Bästa</span>{/if}
  </div>
</div>

<style>
  .stat{
    background: var(--mp-card);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    padding: 20px; backdrop-filter: blur(14px);
    min-width: 0;
  }
  .stat-head{ display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .label{ font-size: 0.82rem; color: var(--mp-text-dim); }
  .num{ font-size: 2rem; font-weight: 700; line-height: 1; color: var(--mp-text); }
  .sub{ font-size: 0.78rem; color: var(--mp-text-dim); margin-top: 6px; }

  /* Trend-badge */
  .trend{
    font-size: 0.85rem; font-weight: 700; line-height: 1;
    width: 22px; height: 22px; border-radius: 7px;
    display: grid; place-items: center;
  }
  .trend-up{ color: #6ee7a8; background: rgba(110,231,168,0.12); }
  .trend-down{ color: #f5b97a; background: rgba(245,185,122,0.12); }
  .trend-flat{ color: var(--mp-lila); background: rgba(168,130,255,0.12); }

  /* Sparkline + markörer */
  .spark-wrap{ position: relative; margin-top: 14px; height: 34px; max-width: 100%; overflow: clip; }
  .spark{ height: 34px; width: 100%; display: block; }

  .marker{
    position: absolute; transform: translate(-50%, -50%);
    border-radius: 50%; pointer-events: none;
  }
  .marker.today{
    width: 8px; height: 8px;
    box-shadow: 0 0 0 3px rgba(10,10,20,0.55);
  }
  .marker.today.trend-up{ background: #6ee7a8; }
  .marker.today.trend-down{ background: #f5b97a; }
  .marker.today.trend-flat{ background: var(--mp-lila); }
  .marker.best{
    width: 9px; height: 9px;
    background: transparent;
    border: 2px solid var(--mp-lila);
    box-shadow: 0 0 0 2px rgba(10,10,20,0.55);
  }

  /* Teckenförklaring */
  .legend{
    display: flex; gap: 14px; margin-top: 10px;
    font-size: 0.7rem; color: var(--mp-text-dim);
  }
  .legend span{ display: inline-flex; align-items: center; gap: 5px; }
  .dot{ width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .today-dot.trend-up{ background: #6ee7a8; }
  .today-dot.trend-down{ background: #f5b97a; }
  .today-dot.trend-flat{ background: var(--mp-lila); }
  .best-dot{ background: transparent; border: 1.5px solid var(--mp-lila); }

  @media (max-width: 480px) {
    .stat {
      padding: 16px;
    }

    .stat-head {
      margin-bottom: 6px;
    }

    .label,
    .sub,
    .legend {
      overflow-wrap: break-word;
    }

    .num {
      font-size: 1.65rem;
    }

    .spark-wrap {
      margin-top: 10px;
      height: 30px;
    }

    .spark {
      height: 30px;
    }

    .legend {
      margin-top: 8px;
    }
  }
</style>
