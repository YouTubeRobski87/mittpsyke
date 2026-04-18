<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { supabase } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Notification = {
		id: string;
		type: string;
		title: string;
		body: string;
		link: string;
		is_read: boolean;
		created_at: string;
	};

	let notifications = $state<Notification[]>([]);
	let markingAll = $state(false);
	let markAllDone = $state(false);

	$effect(() => {
		notifications = data.notifications as Notification[];
	});

	function formatRelativeTime(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);
		if (diffMins < 1) return 'just nu';
		if (diffMins < 60) return `${diffMins} min sedan`;
		if (diffHours < 24) return `${diffHours} tim sedan`;
		if (diffDays === 1) return 'igår';
		if (diffDays < 7) return `${diffDays} dagar sedan`;
		return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	async function getToken(): Promise<string | null> {
		const { data: { session } } = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	async function markAsRead(id: string) {
		const token = await getToken();
		if (!token) return;
		await fetch('/api/notifications', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ id })
		});
		notifications = notifications.map((n) => n.id === id ? { ...n, is_read: true } : n);
	}

	async function markAllAsRead() {
		if (markingAll) return;
		markingAll = true;
		const token = await getToken();
		if (!token) { markingAll = false; return; }
		const res = await fetch('/api/notifications', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ all: true })
		});
		if (res.ok) {
			notifications = notifications.map((n) => ({ ...n, is_read: true }));
			markAllDone = true;
		}
		markingAll = false;
	}

	const unread = $derived(notifications.filter((n) => !n.is_read).length);
</script>

<SEO canonical="https://www.mittpsyke.se/notiser" />

<svelte:head>
	<title>Notiser | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="auth-page">
	<div class="auth-shell">
		<div class="auth-panel page-header">
			<h1 class="page-title">Notiser</h1>
			{#if unread > 0}
				<p class="auth-muted">{unread} olästa</p>
			{/if}
		</div>

		{#if notifications.length === 0}
			<div class="auth-panel">
				<p class="auth-muted" style="text-align:center; padding: 2rem 0;">
					Inga notiser än.
				</p>
			</div>
		{:else}
			{#if unread > 0}
				<div class="auth-panel" style="padding-bottom: 0.25rem;">
					<button
						class="btn-secondary btn-sm"
						onclick={markAllAsRead}
						disabled={markingAll}
					>
						{markingAll ? 'Markerar…' : markAllDone ? 'Klart' : 'Markera alla som lästa'}
					</button>
				</div>
			{/if}

			<ul class="notif-list auth-panel" style="padding: 0; list-style: none;">
				{#each notifications as n (n.id)}
					<li class="notif-item" class:notif-unread={!n.is_read}>
						<a
							href={n.link || '/notiser'}
							class="notif-link"
							onclick={() => { if (!n.is_read) markAsRead(n.id); }}
						>
							<span class="notif-title">{n.title}</span>
							<span class="notif-body">{n.body}</span>
							<span class="notif-time">{formatRelativeTime(n.created_at)}</span>
						</a>
						{#if !n.is_read}
							<button
								class="notif-read-btn"
								aria-label="Markera som läst"
								onclick={() => markAsRead(n.id)}
							>✓</button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.notif-list {
		border-radius: var(--radius-card, 12px);
		overflow: hidden;
	}

	.notif-item {
		display: flex;
		align-items: stretch;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		position: relative;
		transition: background 0.15s;
	}

	.notif-item:last-child {
		border-bottom: none;
	}

	.notif-unread {
		background: rgba(var(--primary-rgb, 0, 120, 100), 0.04);
	}

	.notif-link {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.9rem 1rem;
		text-decoration: none;
		color: inherit;
	}

	.notif-link:hover {
		text-decoration: none;
		opacity: 0.85;
	}

	.notif-title {
		font-size: 0.9rem;
		font-weight: 500;
		opacity: 0.9;
	}

	.notif-body {
		font-size: 0.85rem;
		opacity: 0.65;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 36ch;
	}

	.notif-time {
		font-size: 0.78rem;
		opacity: 0.45;
		margin-top: 0.1rem;
	}

	.notif-read-btn {
		flex-shrink: 0;
		align-self: center;
		padding: 0.4rem 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.85rem;
		opacity: 0.4;
		transition: opacity 0.15s;
	}

	.notif-read-btn:hover {
		opacity: 0.8;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		font-size: 0.85rem;
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 0.15s;
	}

	.btn-secondary:hover:not(:disabled) {
		opacity: 1;
	}

	.btn-sm {
		font-size: 0.8rem;
		padding: 0.35rem 0.75rem;
	}
</style>

