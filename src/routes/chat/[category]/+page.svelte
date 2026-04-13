<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ChatWindow from '$lib/components/ChatWindow.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { getPortalByKey } from '$lib/data/portals';
	import { supabase } from '$lib/supabase';
	import type { ChatMessage } from '$lib/types';
	import { page } from '$app/state';

	const category = $derived(page.params.category ?? '');
	const portal = $derived(getPortalByKey(category));

	const seoMeta: Record<string, { title: string; description: string }> = {
		a: {
			title: 'Samtalsstöd för ångest – chatta anonymt | MittPsyke',
			description: 'Prata anonymt om ångest, oro och tankar som snurrar. AI-samtalsstöd utan väntetid – börja i din egen takt.'
		},
		b: {
			title: 'Samtalsstöd vid depression – chatta anonymt | MittPsyke',
			description: 'Varsamt stöd för tunga dagar och låg ork. Prata anonymt om nedstämdhet med AI-baserat samtalsstöd.'
		},
		e: {
			title: 'Samtalsstöd vid trauma – chatta anonymt | MittPsyke',
			description: 'Varsamt AI-samtalsstöd för dig som bär på svåra upplevelser. Prata anonymt i din takt och på dina villkor.'
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
		window.localStorage.setItem('mittpsyke:last-chat-category', category);
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
			if (!session) {
				return;
			}

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

			if (!conversation) {
				return;
			}

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
</svelte:head>

<div class="container py-6" data-page="chat">
	{#if portal}
		<div class="portal-header text-center mb-4">
			<span class="text-2xl">{portal.icon}</span>
			<h1 class="text-xl font-semibold mt-1">{portal.title}</h1>
			<p class="text-sm opacity-70">{portal.description}</p>
		</div>
	{/if}

	<ChatWindow
		category={category}
		initialMessages={initialMessages}
		initialConversationId={initialConversationId}
	/>
</div>
