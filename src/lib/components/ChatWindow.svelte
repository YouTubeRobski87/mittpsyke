<script lang="ts">
	import type { ChatMessage } from '$lib/types';

	let { category }: { category: string } = $props();

	let messages = $state<ChatMessage[]>([]);
	let input = $state('');
	let sending = $state(false);
	let chatLog: HTMLDivElement;

	function scrollToBottom() {
		if (chatLog) {
			chatLog.scrollTop = chatLog.scrollHeight;
		}
	}

	async function send() {
		const text = input.trim();
		if (!text || sending) return;

		messages.push({ role: 'user', content: text });
		input = '';
		sending = true;
		scrollToBottom();

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text, category: category.toUpperCase() })
			});

			const data = await res.json();
			messages.push({ role: 'assistant', content: data.reply ?? 'Något gick fel.' });
		} catch {
			messages.push({ role: 'assistant', content: 'Kunde inte nå AI just nu. Försök igen.' });
		} finally {
			sending = false;
			scrollToBottom();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}
</script>

<div class="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
	<div
		bind:this={chatLog}
		class="flex-1 overflow-y-auto p-4 space-y-3"
	>
		{#if messages.length === 0}
			<p class="text-center opacity-60 mt-8">
				Skriv något så börjar vi prata. Allt sker utan dömande.
			</p>
		{/if}

		{#each messages as msg}
			<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
						{msg.role === 'user'
						? 'bg-[var(--primary)] text-white rounded-br-md'
						: 'bg-black/5 dark:bg-white/10 rounded-bl-md'}"
				>
					{#each msg.content.split('\n') as line, i}
						{#if i > 0}<br />{/if}
						{line}
					{/each}
				</div>
			</div>
		{/each}

		{#if sending}
			<div class="flex justify-start">
				<div class="bg-black/5 dark:bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md text-sm opacity-60">
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
				class="flex-1 resize-none rounded-xl border border-black/12 dark:border-white/12
					bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none
					focus:border-[var(--primary)] transition-colors"
			></textarea>
			<button
				onclick={send}
				disabled={sending || !input.trim()}
				class="px-5 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-medium
					disabled:opacity-40 transition-opacity"
			>
				Skicka
			</button>
		</div>
	</div>
</div>
