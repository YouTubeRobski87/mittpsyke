<script lang="ts">
	type PortalTab = 'hem' | 'dagbok' | 'framsteg' | 'gemenskap' | 'installningar';

	interface TabItem {
		key: PortalTab;
		label: string;
		href: string;
	}

	// Kärnnyttan kommer först. Kvällstugan är samma plats som Mitt Hem, men den
	// mer precisa etiketten undviker två namn på samma destination i navigationen.
	const tabs: TabItem[] = [
		{ key: 'dagbok', label: 'Dagbok', href: '/dagbok/checkin' },
		{ key: 'framsteg', label: 'Framsteg', href: '/framsteg' },
		{ key: 'hem', label: 'Kvällstugan', href: '/dashboard/kvallsstugan' },
		{ key: 'installningar', label: 'Inställningar', href: '/dashboard/installningar' }
	];

	let {
		title,
		description = '',
		active
	}: {
		title: string;
		description?: string;
		active: PortalTab;
	} = $props();
</script>

<div class="auth-shell">
	<nav class="auth-subnav" aria-label="Portalnavigering">
		{#each tabs as tab}
			<a
				href={tab.href}
				class="auth-subnav-link"
				class:active={active === tab.key}
				aria-current={active === tab.key ? 'page' : undefined}
			>
				{tab.label}
			</a>
		{/each}
	</nav>

	<header class="auth-hero">
		<div>
			<h1>{title}</h1>
			{#if description}
				<p>{description}</p>
			{/if}
		</div>
	</header>
</div>
