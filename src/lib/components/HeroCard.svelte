<script>
  export let greeting = 'Välkommen tillbaka,';
  export let title = 'Hur mår du idag?';
  export let lead = 'Skriv av dig, reflektera och följ din utveckling över tid — helt anonymt.';
  export let reminderLabel = 'Dagens påminnelse';
  export let reminder = 'Du behöver inte ha allt klart idag. Det räcker att du tar ett steg i taget.';
</script>

<section class="hero">
  <div>
    <div class="greeting">{greeting}</div>
    <h1>{title}</h1>
    <p class="lead">{lead}</p>
    <div class="btn-row">
      <button class="btn btn-primary" on:click>+ Skriv nytt inlägg</button>
      <button class="btn btn-ghost" on:click>Visa mina insikter</button>
    </div>
  </div>

  <div class="reminder">
    <small>{reminderLabel}</small>
    <blockquote>"{reminder}"</blockquote>
    <span class="heart">💜</span>
  </div>
</section>

<style>
  .hero{
    display: grid; grid-template-columns: 1.5fr 1fr; gap: 22px;
    background: var(--mp-card);
    border: 1px solid var(--mp-card-border);
    border-radius: var(--mp-radius);
    padding: 30px; backdrop-filter: blur(14px);
  }
  .greeting{ font-size: 0.95rem; color: var(--mp-text-dim); margin-bottom: 4px; }
  h1{ font-size: 1.7rem; margin: 0 0 12px; font-weight: 700; color: var(--mp-text); }
  .lead{ color: var(--mp-text-dim); line-height: 1.55; margin-bottom: 22px; max-width: 90%; }

  .btn-row{ display: flex; gap: 12px; flex-wrap: wrap; }
  .btn{
    padding: 11px 20px; border-radius: 11px; font-size: 0.9rem;
    font-weight: 600; border: none; cursor: pointer;
  }
  .btn-primary{ background: linear-gradient(135deg, var(--mp-lila-2), var(--mp-lila)); color: #fff; }
  .btn-ghost{ background: transparent; border: 1px solid var(--mp-card-border); color: var(--mp-text); }

  .reminder{
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--mp-card-border);
    border-radius: 14px; padding: 18px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .reminder small{ color: var(--mp-lila); font-size: 0.75rem; letter-spacing: .04em; text-transform: uppercase; }
  .reminder blockquote{ font-size: 0.92rem; line-height: 1.5; font-style: italic; margin: 0; color: var(--mp-text); }
  .heart{ font-size: 1.3rem; }

  @media (max-width: 880px){
    .hero{ grid-template-columns: 1fr; }
  }
</style>
