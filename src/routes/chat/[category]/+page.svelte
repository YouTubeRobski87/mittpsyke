<script lang="ts">
	import { browser } from '$app/environment';
	import ChatWindow from '$lib/components/ChatWindow.svelte';
	import HealthConsent from '$lib/components/HealthConsent.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { getPortalByKey } from '$lib/data/portals';
	import { supabase } from '$lib/supabase';
	import type { ChatMessage } from '$lib/types';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

	const category = $derived(page.params.category ?? '');
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

		<section class="chat-intro-panel" aria-labelledby="chat-intro-title">
			<h2 id="chat-intro-title">Så går det till här</h2>
			<p>
				Du skriver några rader. MittPsyke svarar lugnt och hjälper dig att sortera det som känns
				mest nära just nu.
			</p>
			<ul>
				<li>Du behöver inte formulera allt perfekt.</li>
				<li>Du kan ta en sak i taget och pausa när du vill.</li>
				<li>Vid akut fara ska du ringa 112 i stället för att använda chatten.</li>
			</ul>
		</section>

		<ChatWindow
			category={category}
			initialMessages={initialMessages}
			initialConversationId={initialConversationId}
		/>
	</div>
{/if}

<style>
	.chat-intro-panel {
		max-width: 42rem;
		margin: 0 auto 0.85rem;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		background: rgba(248, 245, 239, 0.9);
		border: 1px solid rgba(52, 91, 55, 0.1);
		color: inherit;
	}

	.chat-intro-panel h2 {
		margin: 0 0 0.4rem;
		font-size: 0.98rem;
		font-weight: 700;
	}

	.chat-intro-panel p {
		margin: 0;
		font-size: 0.94rem;
		line-height: 1.6;
	}

	.chat-intro-panel ul {
		margin: 0.65rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
		font-size: 0.9rem;
		line-height: 1.55;
	}

	:global(.dark) .chat-intro-panel {
		background: rgba(23, 29, 36, 0.84);
		border-color: rgba(255, 255, 255, 0.08);
	}

	@media (max-width: 768px) {
		/* Chatten behöver börja direkt under sidhuvudet på små skärmar.
		 * Annars hamnar samtycket och skrivfältet utanför den låsta chattytan. */
		.chat-intro-panel {
			display: none;
		}
	}
</style>
