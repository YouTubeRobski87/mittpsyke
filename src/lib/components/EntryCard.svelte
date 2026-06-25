<script>
  export let title = '';
  export let body = '';
  export let time = '';
  export let tag = '';
</script>

<article class="entry">
  <h3>{title}</h3>
  <p>{body}</p>
  <div class="meta">
    <span>{time}</span>
    {#if tag}<span class="tag">{tag}</span>{/if}
  </div>
</article>

<style>
  .entry{
    border: 1px solid var(--mp-card-border);
    border-radius: 13px; padding: 16px 18px;
    background: rgba(255,255,255,0.02);
  }
  h3{ font-size: 1rem; margin: 0 0 6px; color: var(--mp-text); }
  p{ font-size: 0.88rem; color: var(--mp-text-dim); line-height: 1.5; margin: 0 0 10px; }
  .meta{ display: flex; align-items: center; gap: 10px; font-size: 0.78rem; color: var(--mp-text-dim); }
  .tag{
    padding: 3px 10px; border-radius: 20px; font-size: 0.72rem;
    background: rgba(168,130,255,0.14); color: var(--mp-lila);
    border: 1px solid rgba(168,130,255,0.25);
  }
</style>
