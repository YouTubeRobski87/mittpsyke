<script lang="ts">
  import {
    BarChart3,
    BookOpen,
    Heart,
    Home,
    Leaf,
    LifeBuoy,
    Settings,
    Smile,
    Wrench
  } from 'lucide-svelte';

  export let active = 'hem';

  type IconComponent = typeof Home;

  const items: Array<{ id: string; label: string; icon: IconComponent; href: string }> = [
    { id: 'hem', label: 'Hem', icon: Home, href: '/dashboard' },
    { id: 'maende', label: 'Mående', icon: Smile, href: '/humorsparning' },
    { id: 'dagbok', label: 'Dagbok', icon: BookOpen, href: '/dagbok' },
    { id: 'verktyg', label: 'Verktyg', icon: Wrench, href: '/ovningar' },
    { id: 'statistik', label: 'Statistik', icon: BarChart3, href: '/framsteg' },
    { id: 'resurser', label: 'Resurser', icon: LifeBuoy, href: '/guider' },
    { id: 'installningar', label: 'Inställningar', icon: Settings, href: '/dashboard/installningar' }
  ];
</script>

<aside class="mp-sidebar">
  <a class="brand" href="/dashboard" aria-label="MittPsyke hem">
    <span class="brand-mark"><Leaf size={26} strokeWidth={1.9} /></span>
    <span>MittPsyke</span>
  </a>

  <nav class="nav" aria-label="Huvudnavigering">
    {#each items as item}
      {@const ItemIcon = item.icon}
      <a
        href={item.href}
        class:active={active === item.id}
        aria-current={active === item.id ? 'page' : undefined}
      >
        <span class="ico">
          <ItemIcon size={21} strokeWidth={1.9} />
        </span>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <div class="support-card">
    <div>
      <strong>Du är inte ensam.</strong>
      <p>Vi finns här för dig.</p>
    </div>
    <Heart size={20} fill="currentColor" strokeWidth={0} aria-hidden="true" />
  </div>
</aside>

<style>
  .mp-sidebar {
    --sidebar-text: var(--mp-text, #20231f);
    --sidebar-dim: var(--mp-text-dim, #687163);
    --sidebar-green: var(--mp-green, #2f6f46);
    --sidebar-border: var(--mp-card-border, rgba(52, 91, 55, 0.12));
    background: var(--mp-card, rgba(255, 255, 255, 0.74));
    border: 1px solid var(--sidebar-border);
    border-radius: var(--mp-radius, 8px);
    padding: 24px 18px;
    min-width: 0;
    backdrop-filter: blur(14px);
    height: fit-content;
    position: sticky;
    top: 28px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #2d5b28;
    font-weight: 800;
    font-size: 1.38rem;
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #dcefdc;
    color: #2f6f46;
  }

  .nav {
    display: grid;
    gap: 0.65rem;
  }

  .nav a {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-height: 48px;
    padding: 0 0.8rem;
    border-radius: 8px;
    color: var(--sidebar-text);
    text-decoration: none;
    font-size: 1rem;
    font-weight: 650;
    transition: background 0.16s ease, color 0.16s ease;
  }

  .nav a:hover {
    background: rgba(222, 239, 220, 0.58);
    color: var(--sidebar-green);
  }

  .nav a.active {
    background: linear-gradient(135deg, rgba(215, 235, 207, 0.96), rgba(232, 244, 226, 0.86));
    color: #23552f;
  }

  .ico {
    display: grid;
    place-items: center;
    flex: 0 0 22px;
    color: currentColor;
  }

  .support-card {
    margin-top: auto;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem;
    min-height: 104px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.62);
    border: 1px solid var(--sidebar-border);
    color: #8bcf9d;
  }

  .support-card strong {
    display: block;
    margin-bottom: 0.65rem;
    color: var(--sidebar-text);
    font-size: 0.95rem;
  }

  .support-card p {
    margin: 0;
    color: var(--sidebar-dim);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .mp-sidebar {
      position: static;
      border-radius: 0;
      gap: 1rem;
    }

    .nav {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.45rem;
    }

    .nav a {
      justify-content: center;
      min-height: 44px;
      padding: 0 0.55rem;
      font-size: 0.9rem;
    }

    .support-card {
      display: none;
    }
  }

  @media (max-width: 620px) {
    .brand {
      font-size: 1.2rem;
    }

    .nav {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .nav a {
      justify-content: flex-start;
    }
  }
</style>
