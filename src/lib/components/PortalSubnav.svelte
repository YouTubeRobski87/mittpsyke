<script lang="ts">
	type PortalTab = 'dagbok' | 'dashboard' | 'framsteg' | 'installningar';

	interface TabItem {
		key: PortalTab;
		label: string;
		href: string;
	}

	const tabs: TabItem[] = [
		{ key: 'dagbok', label: 'Dagbok', href: '/dagbok' },
		{ key: 'dashboard', label: 'Min portal', href: '/dashboard' },
		{ key: 'framsteg', label: 'Framsteg', href: '/framsteg' },
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
		<slot name="actions" />
	</header>
</div>
