<script lang="ts">
	import { browser } from '$app/environment';
	import ChatWindow from '$lib/components/ChatWindow.svelte';
	import HealthConsent from '$lib/components/HealthConsent.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { getPortalByKey } from '$lib/data/portals';
	import { resolveChatCategory } from '$lib/data/chat-slugs';
	import { supabase } from '$lib/supabase';
	import type { ChatMessage } from '$lib/types';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

	// Slugen i URL:en (t.ex. "angest") slås om till den interna kategorikoden ("a")
	// som redan används i databasen, portalnycklar och /api/chat.
	const category = $derived(resolveChatCategory(page.params.category ?? ''));
	const portal = $derived(getPortalByKey(category));

	let hasConsent = $state(false);

	onMount(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return;

			const parsed = JSON.parse(stored);
			if (parsed?.accepted && parsed?.policy_version === VERSION) {
				hasConsent = true;
			}
		} catch {
			hasConsent = false;
		}
	});

	const seoMeta: Record<string, { title: string; description: string }> = {
		a: {
			title: 'Samtalsstöd för ångest – chatta anonymt | MittPsyke',
			description:
				'Prata anonymt om ångest, oro och tankar som snurrar. AI-samtalsstöd utan väntetid – börja i din egen takt.'
		},
		b: {
			title: 'Samtalsstöd vid depression – chatta anonymt | MittPsyke',
			description:
				'Varsamt stöd för tunga dagar och låg ork. Prata anonymt om nedstämdhet med AI-baserat samtalsstöd.'
		},
		e: {
			title: 'Samtalsstöd vid trauma – chatta anonymt | MittPsyke',
			description:
				'Varsamt AI-samtalsstöd för dig som bär på svåra upplevelser. Prata anonymt i din takt och på dina villkor.'
		}
	};

	const pageMeta = $derived(
		seoMeta[category] ?? {
			title: 'Samtalsstöd – chatta anonymt | MittPsyke',
			description: 'Anonymt AI-samtalsstöd för psykisk hälsa. Börja i din egen takt utan konto.'
		}
	);

	const conversationIdFromUrl = $derived(page.url.searchParams.get('id'));

	let initialMessages = $state<ChatMessage[]>([]);
	let initialConversationId = $state<string | null>(null);

	$effect(() => {
		if (!browser || !category) return;
		try {
			window.localStorage.setItem('mittpsyke:last-chat-category', category);
		} catch {
			// Chatten fungerar även när webbläsaren blockerar lokal lagring.
		}
	});

	$effect(() => {
		if (!browser) return;
		let alive = true;

		async function loadHistory() {
			const id = conversationIdFromUrl?.trim() ?? '';
			initialMessages = [];
			initialConversationId = null;

			if (!id) return;

			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session) return;

			const { data: conversation, error: conversationError } = await supabase
				.from('conversations')
				.select('id')
				.eq('id', id)
				.eq('user_id', session.user.id)
				.maybeSingle();

			if (!alive) return;

			if (conversationError) {
				console.error('Could not verify conversation:', conversationError);
				return;
			}

			if (!conversation) return;

			const { data: historyRows, error: historyError } = await supabase
				.from('messages')
				.select('role, content')
				.eq('conversation_id', id)
				.order('created_at', { ascending: true });

			if (!alive) return;

			if (historyError) {
				console.error('Could not load conversation messages:', historyError);
				return;
			}

			const nextMessages = (historyRows ?? [])
				.filter(
					(row): row is { role: 'user' | 'assistant'; content: string } =>
						(row.role === 'user' || row.role === 'assistant') && typeof row.content === 'string'
				)
				.map((row) => ({ role: row.role, content: row.content }));

			initialMessages = nextMessages;
			initialConversationId = id;
		}

		void loadHistory();

		return () => {
			alive = false;
		};
	});
</script>

<SEO canonical={`https://www.mittpsyke.se${page.url.pathname}`} />

<svelte:head>
	<meta name="robots" content="noindex, follow" />
	<title>{pageMeta.title}</title>
	<meta name="description" content={pageMeta.description} />
	<meta property="og:title" content={pageMeta.title} />
	<meta property="og:description" content={pageMeta.description} />
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: pageMeta.title,
		description: pageMeta.description,
		url: `https://www.mittpsyke.se${page.url.pathname}`,
		dateModified: '2026-07-10',
		inLanguage: 'sv-SE'
	})}<\/script>`}
</svelte:head>

{#if !hasConsent}
	<HealthConsent
		onAccept={() => {
			hasConsent = true;
		}}
	/>
{:else}
	<div class="container py-2 sm:py-4" data-page="chat">
		{#if portal}
			<div class="portal-header text-center mb-1">
				<span class="text-xl">{portal.icon}</span>
				<h1 class="text-base sm:text-lg font-semibold mt-0.5">{portal.title}</h1>
				<p class="text-xs opacity-60 hidden sm:block">{portal.description}</p>
			</div>
		{/if}

		<ChatWindow
			category={category}
			initialMessages={initialMessages}
			initialConversationId={initialConversationId}
		/>
	</div>
{/if}

<style>
	[data-page='chat'] {
		display: flex;
		flex-direction: column;
		height: calc(100svh - 4.75rem - env(safe-area-inset-top));
		width: 100%;
		max-width: 100%;
		min-width: 0;
		overflow: hidden;
		padding-block: 0.5rem 0;
	}

	@supports (height: 100dvh) {
		[data-page='chat'] {
			height: calc(100dvh - 4.75rem - env(safe-area-inset-top));
		}
	}

	[data-page='chat'] :global(.chat-container) {
		flex: 1 1 auto;
		min-height: 0;
	}

	@media (max-width: 767px) {
		[data-page='chat'] {
			height: calc(100svh - 3.5rem - env(safe-area-inset-top));
			padding: 0.25rem 0 0;
		}

		@supports (height: 100dvh) {
			[data-page='chat'] {
				height: calc(100dvh - 3.5rem - env(safe-area-inset-top));
			}
		}

		.portal-header {
			flex: 0 0 auto;
			margin-bottom: 0.2rem;
		}

	}

	@media (max-width: 768px) {
		/* Låt informationskortet, meddelandeytan och inmatningen dela den verkliga
		 * mobilviewporten. min-height: 0 är viktigt för att barnen ska kunna krympa. */
		.container[data-page='chat'] {
			display: flex;
			flex-direction: column;
			height: calc(100svh - 3.5rem - env(safe-area-inset-top));
			min-height: calc(100svh - 3.5rem - env(safe-area-inset-top));
			overflow: hidden;
		}

		@supports (height: 100dvh) {
			.container[data-page='chat'] {
				height: calc(100dvh - 3.5rem - env(safe-area-inset-top));
				min-height: calc(100dvh - 3.5rem - env(safe-area-inset-top));
			}
		}

		.chat-intro-panel {
			flex: 0 0 auto;
		}
	}
</style>
