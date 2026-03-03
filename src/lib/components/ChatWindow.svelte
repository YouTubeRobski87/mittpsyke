<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { tick } from 'svelte';
	import type { ChatMessage } from '$lib/types';

	let {
		category,
		initialMessages = [],
		initialConversationId = null
	}: {
		category: string;
		initialMessages?: ChatMessage[];
		initialConversationId?: string | null;
	} = $props();

	let messages = $state<ChatMessage[]>([]);
	let input = $state('');
	let sending = $state(false);
	let savePromptHidden = $state<Record<number, boolean>>({});
	let conversationId = $state<string | null>(
		browser ? window.localStorage.getItem('mittpsyke:last-conversation-id') : null
	);
	let chatLog: HTMLDivElement;

	$effect(() => {
		messages = initialMessages.map((message) => ({ ...message }));
		savePromptHidden = {};

		if (initialConversationId) {
			conversationId = initialConversationId;
			if (browser) {
				window.localStorage.setItem('mittpsyke:last-conversation-id', initialConversationId);
			}
		} else {
			conversationId = null;
		}

		void tick().then(scrollToBottom);
	});

	function scrollToBottom() {
		if (chatLog) {
			chatLog.scrollTop = chatLog.scrollHeight;
		}
	}

	async function send() {
		const text = input.trim();
		if (!text || sending) return;

		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) {
			goto('/login');
			return;
		}

		messages.push({ role: 'user', content: text });
		input = '';
		sending = true;
		await tick();
		scrollToBottom();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session.access_token}`
				},
				body: JSON.stringify({
					message: text,
					category,
					conversationId
				})
			});

			if (!res.ok) {
				throw new Error(`API error: ${res.status}`);
			}

			const data: { reply?: string; conversationId?: string } = await res.json();
			if (data.conversationId) {
				conversationId = data.conversationId;
				if (browser) {
					window.localStorage.setItem('mittpsyke:last-conversation-id', data.conversationId);
				}
			}
			if (browser) {
				window.localStorage.setItem('mittpsyke:last-chat-category', category);
			}

			messages.push({ role: 'assistant', content: data.reply ?? 'Något gick fel.' });
			await tick();
			scrollToBottom();
		} catch {
			messages.push({ role: 'assistant', content: 'Något gick fel.' });
			await tick();
			scrollToBottom();
		} finally {
			sending = false;
			await tick();
			scrollToBottom();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	async function saveAsJournalNote(content: string, index: number) {
		savePromptHidden[index] = true;

		const { data } = await supabase.auth.getSession();
		if (!data.session) {
			goto('/login');
			return;
		}

		goto(`/dagbok?prefill=${encodeURIComponent(content)}`);
	}
</script>

<div class="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
	<div
		bind:this={chatLog}
		class="flex-1 overflow-y-auto p-4 space-y-3"
	>
		{#if messages.length === 0}
			<div class="text-center mt-6">
				<img
					src="/assets/mittpsyke-hero.png"
					alt=""
					class="mx-auto mb-4 opacity-80"
					style="max-width: 220px"
				/>
				<p class="text-sm opacity-70 mb-2">Hur mår du?</p>
				<p class="text-center opacity-60">
					Skriv något så börjar vi prata. Allt sker utan dömande.
				</p>
			</div>
		{/if}

		{#each messages as msg, i}
			<div class="space-y-1">
				<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
					<div
						class="max-w-[80%] px-4 py-3 rounded-[var(--radius-card)] text-sm leading-relaxed
							{msg.role === 'user'
							? 'bg-[var(--primary)] text-white rounded-br-md'
							: 'bg-black/5 dark:bg-white/10 rounded-bl-md'}"
					>
						{#each msg.content.split('\n') as line, j}
							{#if j > 0}<br />{/if}
							{line}
						{/each}
					</div>
				</div>

				{#if msg.role === 'assistant' && !savePromptHidden[i]}
					<div class="text-xs opacity-55 px-1 text-left">
						Vill du spara detta som anteckning?
						<button
							type="button"
							class="ml-1 underline hover:opacity-100 transition-opacity"
							onclick={() => saveAsJournalNote(msg.content, i)}
						>
							Ja
						</button>
					</div>
				{/if}
			</div>
		{/each}

		{#if sending}
			<div class="flex justify-start">
				<div class="bg-black/5 dark:bg-white/10 px-4 py-3 rounded-[var(--radius-card)] rounded-bl-md text-sm opacity-60">
					Skriver...
				</div>
			</div>
		{/if}
	</div>

	<div class="border-t border-black/8 dark:border-white/10 p-4">
		<div class="flex gap-2">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder="Skriv här..."
				rows={1}
				class="flex-1 resize-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
					bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none
					focus:border-[var(--primary)] transition-colors"
			></textarea>
			<button
				onclick={send}
				disabled={sending || !input.trim()}
				class="px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium
					disabled:opacity-40 transition-opacity"
			>
				Skicka
			</button>
		</div>
		<p class="mt-3 sm:mt-2 text-xs opacity-60 text-center sm:text-left">
			Behöver du akut stöd?
			<a
				href="https://stodlinjer.se"
				target="_blank"
				rel="noopener noreferrer"
				class="underline opacity-75 hover:opacity-100 transition-opacity"
			>
				Hitta stödlinjer här
			</a>
		</p>
	</div>
</div>
