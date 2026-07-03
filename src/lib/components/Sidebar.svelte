<script>
  export let active = 'hem';

  const items = [
    { id: 'hem',           label: 'Hem',               ico: '⌂', href: '/dashboard' },
    { id: 'inlagg',        label: 'Inlägg',            ico: '✎', href: '/inlagg' },
    { id: 'analys',        label: 'Analys',            ico: '📊', href: '/analys' },
    { id: 'insikter',      label: 'Insiktsgenerering', ico: '💡', href: '/insikter' },
    { id: 'akademin',      label: 'Kreatörsakademin',  ico: '🎓', href: '/akademin' },
    { id: 'ovningar',      label: 'Övningar',          ico: '🧩', href: '/ovningar' },
    { id: 'installningar', label: 'Inställningar',      ico: '⚙', href: '/dashboard/installningar' }
  ];
</script>

<aside class="mp-sidebar">
  <div class="brand"><span class="dot">🧠</span> MittPsyke</div>

  <nav class="nav">
    {#each items as item}
      <a
        href={item.href}
        class:active={active === item.id}
        aria-current={active === item.id ? 'page' : undefined}
      >
        <span class="ico">{item.ico}</span> {item.label}
      </a>
    {/each}
  </nav>

  <div class="support-card">
    <b>💜 Du är inte ensam</b>
    <p>Ta hand om dig själv, en dag i taget.</p>
  </div>
</aside>

<style>
  .mp-sidebar{
    background: var(--mp-card);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    padding: 24px 18px;
    min-width: 0;
    backdrop-filter: blur(14px);
    height: fit-content;
    position: sticky;
    top: 28px;
  }
  .brand{
    display: flex; align-items: center; gap: 10px;
    font-weight: 700; font-size: 1.15rem;
    margin-bottom: 28px; padding-left: 6px;
    color: var(--mp-text);
  }
  .brand .dot{
    width: 30px; height: 30px; border-radius: 9px;
    background: linear-gradient(135deg, var(--mp-lila), var(--mp-lila-2));
    display: grid; place-items: center; font-size: 15px;
  }
  .nav a{
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 11px;
    color: var(--mp-text-dim); text-decoration: none;
    font-size: 0.92rem; margin-bottom: 4px; transition: .15s;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nav a:hover{ color: var(--mp-text); background: rgba(168,130,255,0.06); }
  .nav a.active{
    color: #fff;
    background: linear-gradient(135deg, rgba(124,92,255,0.35), rgba(168,130,255,0.18));
    border: 1px solid rgba(168,130,255,0.3);
  }
  .nav .ico{ width: 18px; flex: 0 0 18px; text-align: center; opacity: .85; }

  .support-card{
    margin-top: 24px; padding: 16px; border-radius: 13px;
    background: linear-gradient(135deg, rgba(124,92,255,0.16), rgba(168,130,255,0.06));
    border: 1px solid rgba(168,130,255,0.2);
  }
  .support-card b{ display: flex; align-items: center; gap: 8px; font-size: 0.9rem; margin-bottom: 6px; color: var(--mp-text); }
  .support-card p{ font-size: 0.8rem; color: var(--mp-text-dim); line-height: 1.4; }

  @media (max-width: 880px){
    .mp-sidebar{ position: static; }
  }

  @media (max-width: 480px){
    .mp-sidebar{
      padding: 18px 14px;
    }
  }
</style>
