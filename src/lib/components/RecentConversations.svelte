<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	type ConversationRow = {
		id: string;
		title: string | null;
		category: string | null;
		created_at: string;
	};

	let signedIn = $state(false);
	let loading = $state(false);
	let errorMessage = $state('');
	let conversations = $state<ConversationRow[]>([]);

	const categoryLabels: Record<string, string> = {
		a: 'Ångest',
		b: 'Nedstämdhet',
		e: 'Trauma'
	};

	function formatDate(value: string) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';

		return new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function conversationHref(conversation: ConversationRow) {
		const category = conversation.category?.trim() || 'a';
		return `/chat/${encodeURIComponent(category)}?id=${encodeURIComponent(conversation.id)}`;
	}

	async function loadConversations(userId: string | null) {
		signedIn = Boolean(userId);
		conversations = [];
		errorMessage = '';

		if (!userId) return;

		loading = true;
		const { data, error } = await supabase
			.from('conversations')
			.select('id, title, category, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5);

		loading = false;
		if (error) {
			console.error('Could not load recent conversations:', error);
			errorMessage = 'Dina senaste samtal kunde inte hämtas just nu.';
			return;
		}

		conversations = (data ?? []) as ConversationRow[];
	}

	onMount(() => {
		void supabase.auth.getSession().then(({ data }) => {
			void loadConversations(data.session?.user.id ?? null);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			void loadConversations(session?.user.id ?? null);
		});

		return () => subscription.unsubscribe();
	});
</script>

{#if signedIn}
	<section class="recent-conversations" aria-labelledby="recent-conversations-title">
		<div class="section-heading">
			<div>
				<h2 id="recent-conversations-title">Senaste samtal</h2>
				<p>Fortsätt där du slutade, när det känns rätt.</p>
			</div>
		</div>

		{#if loading}
			<p class="state-message" aria-live="polite">Hämtar dina samtal…</p>
		{:else if errorMessage}
			<p class="state-message" role="status">{errorMessage}</p>
		{:else if conversations.length === 0}
			<p class="state-message">När du har startat ett samtal visas det här.</p>
		{:else}
			<ul>
				{#each conversations as conversation}
					<li>
						<a href={conversationHref(conversation)}>
							<span class="conversation-copy">
								<strong>{conversation.title?.trim() || 'Samtal'}</strong>
								<span>
									{categoryLabels[conversation.category ?? ''] ?? 'Samtalsstöd'}
									{#if formatDate(conversation.created_at)}
										· {formatDate(conversation.created_at)}
									{/if}
								</span>
							</span>
							<span class="continue-label">Fortsätt</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style>
	.recent-conversations {
		max-width: 720px;
		padding: 1rem;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: var(--radius-card);
		background: rgba(248, 250, 252, 0.72);
	}

	.section-heading h2,
	.section-heading p,
	.state-message {
		margin: 0;
	}

	.section-heading h2 {
		font-family: var(--font-heading);
		font-size: 1.15rem;
		letter-spacing: -0.02em;
	}

	.section-heading p,
	.state-message {
		margin-top: 0.25rem;
		font-size: 0.85rem;
		line-height: 1.5;
		opacity: 0.7;
	}

	ul {
		display: grid;
		gap: 0.45rem;
		margin: 0.85rem 0 0;
		padding: 0;
		list-style: none;
	}

	a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.72rem 0.8rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.78);
		color: inherit;
		text-decoration: none;
		transition: background-color 0.16s ease;
	}

	a:hover,
	a:focus-visible {
		background: rgba(15, 23, 42, 0.06);
	}

	a:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.conversation-copy {
		display: grid;
		min-width: 0;
		gap: 0.18rem;
	}

	.conversation-copy strong {
		overflow: hidden;
		font-size: 0.9rem;
		font-weight: 650;
		line-height: 1.35;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.conversation-copy span,
	.continue-label {
		font-size: 0.74rem;
		opacity: 0.65;
	}

	.continue-label {
		flex: 0 0 auto;
		font-weight: 650;
	}

	:global(.dark) .recent-conversations {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(23, 29, 36, 0.76);
	}

	:global(.dark) a {
		background: rgba(255, 255, 255, 0.04);
	}

	:global(.dark) a:hover,
	:global(.dark) a:focus-visible {
		background: rgba(255, 255, 255, 0.09);
	}
</style>
