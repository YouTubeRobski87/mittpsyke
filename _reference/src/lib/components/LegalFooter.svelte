<script lang="ts">
	import { page } from '$app/state';
	import { authStore } from '$lib/stores/auth.svelte';

	interface ActionLink {
		label: string;
		feedbackLabel: string;
		onclick: () => void | Promise<void>;
	}

	let { actionLinks = [] }: { actionLinks?: ActionLink[] } = $props();

	let feedbackIndex = $state<number | null>(null);

	async function handleAction(action: ActionLink, index: number) {
		await action.onclick();
		feedbackIndex = index;
		setTimeout(() => {
			feedbackIndex = null;
		}, 2000);
	}

	const links = [
		{ href: '/about', label: 'Om' },
		{ href: '/guide', label: 'Guide' },
		{ href: '/contact', label: 'Kontakt' },
		{ href: '/privacy', label: 'Integritet' },
		{ href: '/cookies', label: 'Kakor' },
		{ href: '/terms', label: 'Villkor' }
	];

	const authLink = $derived(
		authStore.isLoggedIn
			? { href: '/profile', label: 'Profil' }
			: { href: '/login', label: 'Logga in' }
	);

	const allLinks = $derived([authLink, ...links]);
	const visibleLinks = $derived(allLinks.filter(link => link.href !== page.url.pathname));
</script>

<footer class="legal-footer">
	<nav class="legal-links">
		{#each visibleLinks as link}
			<a href={link.href}>{link.label}</a>
		{/each}
		{#each actionLinks as action, i}
			<button class="action-link" onclick={() => handleAction(action, i)}>
				{feedbackIndex === i ? action.feedbackLabel : action.label}
			</button>
		{/each}
	</nav>
	<div class="copyright">
		Upphovsrätt © Storify 2026
	</div>
</footer>

<style>
	.legal-footer {
		margin-top: 1rem;
		padding-top: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		align-self: center;
		gap: 1rem;
		font-family: var(--font-primary);
		width: 100%;
		max-width: 720px;
	}

	.legal-links {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
	}

	.legal-links a {
		color: var(--color-text-muted);
		opacity: 0.5;
		font-size: var(--text-xs);
		text-decoration: none;
		transition: opacity 0.2s ease;
		white-space: nowrap;
	}

	.legal-links a:hover,
	.action-link:hover {
		opacity: 1;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.action-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-text-muted);
		opacity: 0.5;
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		cursor: pointer;
		text-decoration: none;
		transition: opacity 0.2s ease;
		white-space: nowrap;
	}

	.copyright {
		padding-top: 1rem;
		padding-bottom: 1.5rem;
		border-top: 1px solid var(--color-border);
		width: 100%;
		text-align: center;
		color: var(--color-text-muted);
		opacity: 0.6;
		font-size: var(--text-xs);
	}
</style>
