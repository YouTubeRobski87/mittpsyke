<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggle from './ThemeToggle.svelte';

	let pathname: string = $derived(page.url.pathname);
</script>

<nav class="navbar" class:no-border={pathname.startsWith('/wizard')}>
	<div class="navbar-inner">
		<a href="/" class="navbar-brand">Storify</a>

		<div class="navbar-actions">
			<ThemeToggle variant="inline" />
		</div>
	</div>
</nav>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		padding: 0.75rem 1.25rem;
		padding-top: calc(env(safe-area-inset-top, 0px) + 0.75rem);
		background: var(--color-bg);
	}

	.navbar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 720px;
		margin: 0 auto;
		width: 100%;
	}

	.navbar.no-border {
		border-bottom: none;
	}

	.navbar-brand {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-medium);
		font-stretch: 115%;
		letter-spacing: var(--tracking-tighter);
		color: var(--color-text);
		text-decoration: none;
	}

	.navbar-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}


</style>
