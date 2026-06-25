<script>
  export let label = '';
  export let value = '';
  export let sub = '';
  /** Array med tal, t.ex. [28,24,26,16,18,8,12] — ritas som spark-linje */
  export let points = [28, 24, 26, 16, 18, 8, 12];

  // Bygg SVG-path från points, normaliserat till viewBox 120x34
  $: path = (() => {
    if (!points.length) return '';
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const stepX = 120 / (points.length - 1);
    return points
      .map((p, i) => {
        const x = (i * stepX).toFixed(1);
        const y = (30 - ((p - min) / span) * 26).toFixed(1);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  })();

  // Unikt gradient-id så flera kort på samma sida inte krockar
  const gid = 'mp-spark-' + Math.random().toString(36).slice(2, 9);
</script>

<div class="stat">
  <div class="label">{label}</div>
  <div class="num">{value}</div>
  {#if sub}<div class="sub">{sub}</div>{/if}

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
</div>

<style>
  .stat{
    background: var(--mp-card);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    padding: 20px; backdrop-filter: blur(14px);
  }
  .label{ font-size: 0.82rem; color: var(--mp-text-dim); margin-bottom: 8px; }
  .num{ font-size: 2rem; font-weight: 700; line-height: 1; color: var(--mp-text); }
  .sub{ font-size: 0.78rem; color: var(--mp-text-dim); margin-top: 6px; }
  .spark{ margin-top: 14px; height: 34px; width: 100%; display: block; }
</style>
