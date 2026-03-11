<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
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
	let hasTrackedOpen = $state(false);
	let hasTrackedFirstMessage = $state(false);
	let firstMessageSource = $state<'manual' | 'chip'>('manual');
	let hasSensitiveDataConsent = $state(false);
	let conversationId = $state<string | null>(
		browser ? window.localStorage.getItem('mittpsyke:last-conversation-id') : null
	);
	let chatLog: HTMLDivElement;
	const guestIdStorageKey = 'mittpsyke:guest-id';
	const starterSuggestions = [
		'Jag känner mig orolig just nu',
		'Tankarna snurrar och jag får ingen ro',
		'Jag vet inte riktigt varför jag mår dåligt',
		'Kan du hjälpa mig sortera mina tankar?'
	];

	const elevatedSupportKeywords = [
		'för mycket',
		'orkar inte',
		'hopplös',
		'hopplöst',
		'ensam',
		'kan inte mer',
		'prata med någon',
		'prata med en människa',
		'text räcker inte',
		'texten räcker inte'
	];

	const acuteSupportKeywords = [
		'akut fara',
		'självmord',
		'ta mitt liv',
		'vill dö',
		'orkar inte leva',
		'skada mig själv',
		'skada någon annan'
	];

	function latestUserMessageContent() {
		for (let i = messages.length - 1; i >= 0; i -= 1) {
			const msg = messages[i];
			if (msg.role === 'user') return msg.content.toLowerCase();
		}
		return '';
	}

	function supportLevel() {
		const text = latestUserMessageContent();
		if (!text) return 'standard';
		if (acuteSupportKeywords.some((keyword) => text.includes(keyword))) return 'acute';
		if (elevatedSupportKeywords.some((keyword) => text.includes(keyword))) return 'elevated';
		return 'standard';
	}

	let currentSupportLevel = $derived(supportLevel());
	let showStarterSuggestions = $derived(
		hasSensitiveDataConsent && messages.length === 0 && input.trim().length === 0
	);

	async function trackEvent(
		eventName: string,
		data: Record<string, string | number> = {}
	) {
		if (!browser) return;
		try {
			await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					event: eventName,
					category: category || null,
					timestamp: new Date().toISOString(),
					...data
				})
			});
		} catch {
			// Best effort: analytics must never affect chat flow.
		}
	}

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

	onMount(() => {
		hasSensitiveDataConsent = hasSensitiveConsent();

		if (hasTrackedOpen) return;
		hasTrackedOpen = true;
		void trackEvent('chat_open');
	});

	function scrollToBottom() {
		if (chatLog) {
			chatLog.scrollTop = chatLog.scrollHeight;
		}
	}

	function getOrCreateGuestId() {
		if (!browser) return null;
		const existingGuestId = window.localStorage.getItem(guestIdStorageKey)?.trim();
		if (existingGuestId) return existingGuestId;

		const guestId = crypto.randomUUID();
		window.localStorage.setItem(guestIdStorageKey, guestId);
		return guestId;
	}

	async function send() {
		const text = input.trim();
		if (!hasSensitiveDataConsent || !text || sending) return;

		const {
			data: { session }
		} = await supabase.auth.getSession();
		const guestId = session ? null : getOrCreateGuestId();

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
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION,
					...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
				},
				body: JSON.stringify({
					message: text,
					category,
					conversationId,
					...(guestId ? { guestId } : {})
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

			if (!hasTrackedFirstMessage) {
				void trackEvent('first_message_sent', {
					source: firstMessageSource,
					textLength: text.length
				});
				hasTrackedFirstMessage = true;
			}

			messages.push({
				role: 'assistant',
				content: (data.reply && data.reply.trim())
					? data.reply
					: 'Något gick fel.'
			});
			await tick();
			scrollToBottom();
		} catch {
			messages.push({
				role: 'assistant',
				content: 'Något gick fel.'
			});
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

	function useStarterSuggestion(text: string) {
		if (!hasSensitiveDataConsent) return;
		firstMessageSource = 'chip';
		void trackEvent('starter_chip_clicked', {
			source: 'chip',
			textLength: text.length
		});
		input = text;
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

	function acceptSensitiveConsent() {
		grantSensitiveConsent();
		hasSensitiveDataConsent = true;
	}
</script>

<div class="chat-container flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
	<div class="px-4 pb-2 text-right">
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
		>
			Behöver du mänsklig kontakt? Se stödlinjer
		</a>
	</div>

	<div
		bind:this={chatLog}
		class="chat-messages flex-1 overflow-y-auto p-4 space-y-3"
		aria-live="polite"
		aria-busy={sending}
	>
		{#if messages.length === 0}
			<div class="text-center mt-6">
				<img
					src="/assets/mittpsyke-hero.png"
					alt=""
					width="220"
					height="220"
					decoding="async"
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
			<div class="flex justify-start" role="status" aria-live="polite">
				<div class="bg-black/5 dark:bg-white/10 px-4 py-3 rounded-[var(--radius-card)] rounded-bl-md text-sm opacity-60">
					Skriver...
				</div>
			</div>
		{/if}
	</div>

	<div class="chat-input-area border-t border-black/8 dark:border-white/10 p-4">
		{#if !hasSensitiveDataConsent}
			<div class="mb-3">
				<ConsentGate
					title="Samtycke innan chatt"
					dataLabel="Det du skriver i chatten"
					serviceLabel="AI- och tredjepartstjänster"
					onAccept={acceptSensitiveConsent}
				/>
			</div>
		{/if}

		{#if currentSupportLevel === 'acute'}
			<div class="mb-3 rounded-[var(--radius-card)] border border-rose-300/70 bg-rose-50 dark:bg-rose-900/20 px-3 py-3 text-sm">
				<p class="font-medium text-rose-900 dark:text-rose-100">
					Om du är i akut fara eller riskerar att skada dig själv eller någon annan, ring 112 direkt.
				</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<a href="tel:112" class="support-chip support-chip-urgent">Ring 112</a>
					<a href="tel:1177" class="support-chip">Ring 1177</a>
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
				</div>
			</div>
		{:else if currentSupportLevel === 'elevated'}
			<div class="mb-3 rounded-[var(--radius-card)] border border-amber-300/70 bg-amber-50 dark:bg-amber-900/20 px-3 py-3 text-sm">
				<p class="text-amber-900 dark:text-amber-100">
					Du behöver inte bära allt ensam. Här finns stödlinjer om du vill prata med någon.
				</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
					<a href="tel:+15672921889" class="support-chip">Prata med någon</a>
				</div>
			</div>
		{:else}
			<div class="mb-3 rounded-[var(--radius-card)] border border-black/10 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.03] px-3 py-3 text-sm">
				<p class="opacity-85">
					Behöver du mänsklig kontakt? Här finns stödlinjer med chatt och telefon.
				</p>
				<div class="mt-2">
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="support-chip">Se stödlinjer</a>
				</div>
			</div>
		{/if}

		{#if showStarterSuggestions}
			<div class="mb-3">
				<p class="text-xs opacity-70 mb-2">Du kan börja med något enkelt:</p>
				<div class="starter-chips">
					{#each starterSuggestions as suggestion}
						<button type="button" class="starter-chip" onclick={() => useStarterSuggestion(suggestion)}>
							{suggestion}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if hasSensitiveDataConsent}
			<div class="flex gap-2">
				<label class="sr-only" for="chat-message">Skriv ditt meddelande</label>
				<textarea
					id="chat-message"
					bind:value={input}
					onkeydown={handleKeydown}
					placeholder="Skriv här..."
					aria-describedby="chat-help-text"
					rows={1}
					class="flex-1 resize-none rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
						bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none
						focus:border-[var(--primary)] transition-colors"
				></textarea>
				<button
					type="button"
					onclick={send}
					disabled={sending || !input.trim()}
					class="px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium
						disabled:opacity-40 transition-opacity"
				>
					Skicka
				</button>
			</div>
			<p id="chat-help-text" class="mt-2 text-xs opacity-60">Skriv i din egen takt. Vid akut fara, ring 112. För vårdråd, kontakta 1177.</p>
		{/if}
		<div class="mt-3 text-center">
			<a
				href="mailto:mittpsyke@ownit.nu"
				class="inline-block px-4 py-2 rounded-[12px] bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-200 text-sm font-medium
					hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors border border-teal-200 dark:border-teal-800/50"
				title="Skicka e-post till support"
			>
				Kontakta oss
			</a>
		</div>
	</div>
</div>

<style>
	.support-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.18);
		background: rgba(255, 255, 255, 0.85);
		font-size: 0.78rem;
		font-weight: 600;
		color: #1e293b;
		text-decoration: none;
	}

	.support-chip-urgent {
		background: #b91c1c;
		border-color: #b91c1c;
		color: #fff;
	}

	:global(.dark) .support-chip {
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.08);
		color: #e5e7eb;
	}

	:global(.dark) .support-chip-urgent {
		background: #dc2626;
		border-color: #dc2626;
		color: #fff;
	}

	.starter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.starter-chip {
		padding: 0.4rem 0.65rem;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: rgba(15, 23, 42, 0.03);
		font-size: 0.78rem;
		line-height: 1.25;
		text-align: left;
		color: rgba(15, 23, 42, 0.86);
	}

	.starter-chip:hover {
		background: rgba(15, 23, 42, 0.07);
	}

	:global(.dark) .starter-chip {
		border-color: rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.9);
	}
</style>
