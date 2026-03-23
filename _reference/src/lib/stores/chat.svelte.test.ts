import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Preferences } from '@capacitor/preferences';

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('@capacitor/preferences', () => ({
	Preferences: {
		get: vi.fn().mockResolvedValue({ value: null }),
		set: vi.fn().mockResolvedValue(undefined),
		remove: vi.fn().mockResolvedValue(undefined)
	}
}));

import { chatStore } from './chat.svelte';

describe('chatStore', () => {
	beforeEach(() => {
		chatStore.reset();
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('initial state', () => {
		it('starts in empty phase', () => {
			expect(chatStore.phase).toBe('empty');
		});

		it('starts with no messages', () => {
			expect(chatStore.messages).toEqual([]);
		});

		it('starts not streaming', () => {
			expect(chatStore.isStreaming).toBe(false);
		});

		it('starts with no selected tone', () => {
			expect(chatStore.selectedTone).toBe('');
		});

		it('starts with no generated entry', () => {
			expect(chatStore.generatedEntry).toBe('');
		});

		it('starts with homework enabled by default', () => {
			expect(chatStore.includeHomework).toBe(true);
		});

		it('starts with horoscope and onThisDay disabled', () => {
			expect(chatStore.includeHoroscope).toBe(false);
			expect(chatStore.includeOnThisDay).toBe(false);
		});

		it('starts with no error', () => {
			expect(chatStore.error).toBe('');
		});

		it('isEmpty is true', () => {
			expect(chatStore.isEmpty).toBe(true);
		});

		it('hasMessages is false', () => {
			expect(chatStore.hasMessages).toBe(false);
		});
	});

	describe('message management', () => {
		it('addUserMessage adds a user message', () => {
			chatStore.addUserMessage('Hello');

			expect(chatStore.messages).toHaveLength(1);
			expect(chatStore.messages[0].role).toBe('user');
			expect(chatStore.messages[0].content).toBe('Hello');
			expect(chatStore.messages[0].id).toBeTruthy();
			expect(chatStore.messages[0].timestamp).toBeGreaterThan(0);
		});

		it('addAssistantMessage adds an assistant message', () => {
			chatStore.addAssistantMessage('Hi there!');

			expect(chatStore.messages).toHaveLength(1);
			expect(chatStore.messages[0].role).toBe('assistant');
			expect(chatStore.messages[0].content).toBe('Hi there!');
		});

		it('messages have unique ids', () => {
			chatStore.addUserMessage('First');
			chatStore.addAssistantMessage('Second');
			chatStore.addUserMessage('Third');

			const ids = chatStore.messages.map((m) => m.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(3);
		});

		it('hasMessages is true only when user messages exist', () => {
			expect(chatStore.hasMessages).toBe(false);

			chatStore.addAssistantMessage('Only assistant');
			expect(chatStore.hasMessages).toBe(false);

			chatStore.addUserMessage('Now a user message');
			expect(chatStore.hasMessages).toBe(true);
		});

		it('appendToLastAssistantMessage appends to the last assistant message', () => {
			chatStore.addAssistantMessage('Hello');
			chatStore.appendToLastAssistantMessage(' world');
			chatStore.appendToLastAssistantMessage('!');

			expect(chatStore.messages[0].content).toBe('Hello world!');
		});

		it('appendToLastAssistantMessage does nothing if last message is from user', () => {
			chatStore.addAssistantMessage('AI says');
			chatStore.addUserMessage('User says');
			chatStore.appendToLastAssistantMessage(' extra');

			expect(chatStore.messages[0].content).toBe('AI says');
			expect(chatStore.messages[1].content).toBe('User says');
		});

		it('appendToLastAssistantMessage does nothing if no messages', () => {
			chatStore.appendToLastAssistantMessage('chunk');
			expect(chatStore.messages).toHaveLength(0);
		});

		it('removeLastAssistantMessage removes the last assistant message', () => {
			chatStore.addUserMessage('Hello');
			chatStore.addAssistantMessage('Hi');

			chatStore.removeLastAssistantMessage();

			expect(chatStore.messages).toHaveLength(1);
			expect(chatStore.messages[0].role).toBe('user');
		});

		it('removeLastAssistantMessage does nothing if last is user message', () => {
			chatStore.addAssistantMessage('Hi');
			chatStore.addUserMessage('Hello');

			chatStore.removeLastAssistantMessage();

			expect(chatStore.messages).toHaveLength(2);
		});

		it('removeLastAssistantMessage does nothing if no messages', () => {
			chatStore.removeLastAssistantMessage();
			expect(chatStore.messages).toHaveLength(0);
		});

		it('preserves message order across multiple additions', () => {
			chatStore.addUserMessage('User 1');
			chatStore.addAssistantMessage('AI 1');
			chatStore.addUserMessage('User 2');
			chatStore.addAssistantMessage('AI 2');

			expect(chatStore.messages.map((m) => m.content)).toEqual([
				'User 1',
				'AI 1',
				'User 2',
				'AI 2'
			]);
		});
	});

	describe('streaming', () => {
		it('setStreaming updates streaming state', () => {
			chatStore.setStreaming(true);
			expect(chatStore.isStreaming).toBe(true);

			chatStore.setStreaming(false);
			expect(chatStore.isStreaming).toBe(false);
		});
	});

	describe('error handling', () => {
		it('setError updates error state', () => {
			chatStore.setError('Something went wrong');
			expect(chatStore.error).toBe('Something went wrong');
		});

		it('setError can clear error', () => {
			chatStore.setError('Error');
			chatStore.setError('');
			expect(chatStore.error).toBe('');
		});
	});

	describe('phase transitions', () => {
		it('startChatting transitions to chatting', () => {
			chatStore.startChatting();
			expect(chatStore.phase).toBe('chatting');
			expect(chatStore.isEmpty).toBe(false);
		});

		it('finishInterview transitions to tone-selection', () => {
			chatStore.startChatting();
			chatStore.finishInterview();
			expect(chatStore.phase).toBe('tone-selection');
		});

		it('backToInterview transitions back to chatting', () => {
			chatStore.startChatting();
			chatStore.finishInterview();
			chatStore.backToInterview();
			expect(chatStore.phase).toBe('chatting');
		});

		it('startGenerating transitions to generating', () => {
			chatStore.startChatting();
			chatStore.finishInterview();
			chatStore.startGenerating();
			expect(chatStore.phase).toBe('generating');
		});

		it('showResult transitions to result and stores entry', () => {
			chatStore.startChatting();
			chatStore.finishInterview();
			chatStore.startGenerating();
			chatStore.showResult('Dear diary...');

			expect(chatStore.phase).toBe('result');
			expect(chatStore.generatedEntry).toBe('Dear diary...');
		});

		it('full happy path: empty → chatting → tone-selection → generating → result', () => {
			expect(chatStore.phase).toBe('empty');

			chatStore.startChatting();
			expect(chatStore.phase).toBe('chatting');

			chatStore.finishInterview();
			expect(chatStore.phase).toBe('tone-selection');

			chatStore.startGenerating();
			expect(chatStore.phase).toBe('generating');

			chatStore.showResult('My diary entry');
			expect(chatStore.phase).toBe('result');
			expect(chatStore.generatedEntry).toBe('My diary entry');
		});

		it('backToInterview allows going back from tone-selection to chatting', () => {
			chatStore.startChatting();
			chatStore.addUserMessage('Hello');
			chatStore.addAssistantMessage('Hi!');
			chatStore.finishInterview();

			expect(chatStore.phase).toBe('tone-selection');

			chatStore.backToInterview();
			expect(chatStore.phase).toBe('chatting');
			expect(chatStore.messages).toHaveLength(2);
		});
	});

	describe('tone selection', () => {
		it('setSelectedTone updates the tone', () => {
			chatStore.setSelectedTone('classic');
			expect(chatStore.selectedTone).toBe('classic');
		});

		it('setSelectedTone can change the tone', () => {
			chatStore.setSelectedTone('classic');
			chatStore.setSelectedTone('meme');
			expect(chatStore.selectedTone).toBe('meme');
		});
	});

	describe('addons', () => {
		it('setAddon toggles horoscope', () => {
			chatStore.setAddon('horoscope', true);
			expect(chatStore.includeHoroscope).toBe(true);

			chatStore.setAddon('horoscope', false);
			expect(chatStore.includeHoroscope).toBe(false);
		});

		it('setAddon toggles onThisDay', () => {
			chatStore.setAddon('onThisDay', true);
			expect(chatStore.includeOnThisDay).toBe(true);
		});

		it('setAddon toggles homework', () => {
			// Default is true
			expect(chatStore.includeHomework).toBe(true);

			chatStore.setAddon('homework', false);
			expect(chatStore.includeHomework).toBe(false);
		});
	});

	describe('conversation cap', () => {
		function addMessagePair(index: number) {
			chatStore.addUserMessage(`User ${index}`);
			chatStore.addAssistantMessage(`Assistant ${index}`);
		}

		it('messageCount reflects total messages', () => {
			expect(chatStore.messageCount).toBe(0);
			chatStore.addUserMessage('Hello');
			expect(chatStore.messageCount).toBe(1);
			chatStore.addAssistantMessage('Hi');
			expect(chatStore.messageCount).toBe(2);
		});

		it('isNearLimit is false below 30 messages', () => {
			for (let i = 0; i < 14; i++) addMessagePair(i);
			// 28 messages
			expect(chatStore.messageCount).toBe(28);
			expect(chatStore.isNearLimit).toBe(false);
		});

		it('isNearLimit is true at 30 messages', () => {
			for (let i = 0; i < 15; i++) addMessagePair(i);
			// 30 messages
			expect(chatStore.messageCount).toBe(30);
			expect(chatStore.isNearLimit).toBe(true);
		});

		it('isAtLimit is false below 36 messages', () => {
			for (let i = 0; i < 17; i++) addMessagePair(i);
			// 34 messages
			expect(chatStore.messageCount).toBe(34);
			expect(chatStore.isAtLimit).toBe(false);
		});

		it('isAtLimit is true at 36 messages', () => {
			for (let i = 0; i < 18; i++) addMessagePair(i);
			// 36 messages
			expect(chatStore.messageCount).toBe(36);
			expect(chatStore.isAtLimit).toBe(true);
		});

		it('isNearLimit is also true when isAtLimit', () => {
			for (let i = 0; i < 18; i++) addMessagePair(i);
			expect(chatStore.isNearLimit).toBe(true);
			expect(chatStore.isAtLimit).toBe(true);
		});

		it('reset clears message count and cap flags', () => {
			for (let i = 0; i < 18; i++) addMessagePair(i);
			expect(chatStore.isAtLimit).toBe(true);

			chatStore.reset();

			expect(chatStore.messageCount).toBe(0);
			expect(chatStore.isNearLimit).toBe(false);
			expect(chatStore.isAtLimit).toBe(false);
		});
	});

	describe('reset', () => {
		it('resets all state to defaults', () => {
			// Set everything to non-default values
			chatStore.addUserMessage('Hello');
			chatStore.addAssistantMessage('Hi!');
			chatStore.startChatting();
			chatStore.setStreaming(true);
			chatStore.setSelectedTone('classic');
			chatStore.setAddon('horoscope', true);
			chatStore.setAddon('onThisDay', true);
			chatStore.setAddon('homework', false);
			chatStore.setError('Some error');

			chatStore.reset();

			expect(chatStore.messages).toEqual([]);
			expect(chatStore.phase).toBe('empty');
			expect(chatStore.isStreaming).toBe(false);
			expect(chatStore.selectedTone).toBe('');
			expect(chatStore.generatedEntry).toBe('');
			expect(chatStore.includeHoroscope).toBe(false);
			expect(chatStore.includeOnThisDay).toBe(false);
			expect(chatStore.includeHomework).toBe(true);
			expect(chatStore.error).toBe('');
			expect(chatStore.hasMessages).toBe(false);
			expect(chatStore.isEmpty).toBe(true);
		});

		it('reset after showResult clears generated entry', () => {
			chatStore.startChatting();
			chatStore.finishInterview();
			chatStore.startGenerating();
			chatStore.showResult('My entry');

			chatStore.reset();

			expect(chatStore.generatedEntry).toBe('');
			expect(chatStore.phase).toBe('empty');
		});
	});

	describe('combined scenarios', () => {
		it('streaming conversation flow', () => {
			chatStore.startChatting();
			chatStore.addUserMessage('Berätta om min dag');

			// Simulate streaming response
			chatStore.setStreaming(true);
			chatStore.addAssistantMessage('');
			chatStore.appendToLastAssistantMessage('Hej');
			chatStore.appendToLastAssistantMessage('! Hur');
			chatStore.appendToLastAssistantMessage(' har din dag varit?');
			chatStore.setStreaming(false);

			expect(chatStore.messages).toHaveLength(2);
			expect(chatStore.messages[1].content).toBe('Hej! Hur har din dag varit?');
			expect(chatStore.isStreaming).toBe(false);
		});

		it('error during streaming cleans up partial message', () => {
			chatStore.startChatting();
			chatStore.addUserMessage('Hello');

			chatStore.setStreaming(true);
			chatStore.addAssistantMessage('');
			chatStore.appendToLastAssistantMessage('Partial resp');

			// Simulate error: remove partial message, set error
			chatStore.removeLastAssistantMessage();
			chatStore.setStreaming(false);
			chatStore.setError('Network error');

			expect(chatStore.messages).toHaveLength(1);
			expect(chatStore.messages[0].role).toBe('user');
			expect(chatStore.isStreaming).toBe(false);
			expect(chatStore.error).toBe('Network error');
		});

		it('re-generate with different tone from result', () => {
			chatStore.startChatting();
			chatStore.addUserMessage('My day was great');
			chatStore.addAssistantMessage('Tell me more!');
			chatStore.finishInterview();
			chatStore.setSelectedTone('classic');
			chatStore.startGenerating();
			chatStore.showResult('First entry');

			// Re-generate with different tone
			chatStore.finishInterview();
			chatStore.setSelectedTone('meme');
			chatStore.startGenerating();
			chatStore.showResult('Meme entry');

			expect(chatStore.generatedEntry).toBe('Meme entry');
			expect(chatStore.selectedTone).toBe('meme');
			expect(chatStore.messages).toHaveLength(2); // Messages preserved
		});
	});

	describe('draft persistence', () => {
		it('schedules a debounced save after addUserMessage', async () => {
			chatStore.startChatting();
			chatStore.addUserMessage('Hello');

			expect(Preferences.set).not.toHaveBeenCalled();

			// Advance past debounce timer
			await vi.advanceTimersByTimeAsync(500);

			expect(Preferences.set).toHaveBeenCalledWith({
				key: 'storify-chat-draft',
				value: expect.stringContaining('Hello')
			});
		});

		it('debounces multiple rapid saves', async () => {
			chatStore.startChatting();
			chatStore.addUserMessage('First');
			chatStore.addUserMessage('Second');
			chatStore.addUserMessage('Third');

			await vi.advanceTimersByTimeAsync(500);

			// Should only save once despite 3 messages
			expect(Preferences.set).toHaveBeenCalledTimes(1);
			const savedValue = JSON.parse(
				vi.mocked(Preferences.set).mock.calls[0][0].value
			);
			expect(savedValue.messages).toHaveLength(3);
		});

		it('saves after streaming ends', async () => {
			chatStore.startChatting();
			chatStore.addUserMessage('Hello');
			await vi.advanceTimersByTimeAsync(500);
			vi.mocked(Preferences.set).mockClear();

			chatStore.setStreaming(true);
			chatStore.addAssistantMessage('');
			chatStore.appendToLastAssistantMessage('Hi there');
			chatStore.setStreaming(false);

			await vi.advanceTimersByTimeAsync(500);

			expect(Preferences.set).toHaveBeenCalledTimes(1);
			const savedValue = JSON.parse(
				vi.mocked(Preferences.set).mock.calls[0][0].value
			);
			expect(savedValue.messages).toHaveLength(2);
		});

		it('saves when tone is selected', async () => {
			chatStore.setSelectedTone('classic');

			await vi.advanceTimersByTimeAsync(500);

			expect(Preferences.set).toHaveBeenCalledTimes(1);
			const savedValue = JSON.parse(
				vi.mocked(Preferences.set).mock.calls[0][0].value
			);
			expect(savedValue.selectedTone).toBe('classic');
		});

		it('saves when addon is toggled', async () => {
			chatStore.setAddon('horoscope', true);

			await vi.advanceTimersByTimeAsync(500);

			const savedValue = JSON.parse(
				vi.mocked(Preferences.set).mock.calls[0][0].value
			);
			expect(savedValue.includeHoroscope).toBe(true);
		});

		it('loadDraft restores messages, phase, and settings', async () => {
			const draft = {
				messages: [
					{ id: 'msg-1', role: 'user', content: 'Hello', timestamp: 1000 },
					{ id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: 2000 }
				],
				phase: 'chatting',
				selectedTone: 'meme',
				includeHoroscope: true,
				includeOnThisDay: false,
				includeHomework: false,
				savedAt: Date.now()
			};

			vi.mocked(Preferences.get).mockResolvedValueOnce({
				value: JSON.stringify(draft)
			});

			const loaded = await chatStore.loadDraft();

			expect(loaded).toBe(true);
			expect(chatStore.messages).toHaveLength(2);
			expect(chatStore.messages[0].content).toBe('Hello');
			expect(chatStore.messages[1].content).toBe('Hi!');
			expect(chatStore.phase).toBe('chatting');
			expect(chatStore.selectedTone).toBe('meme');
			expect(chatStore.includeHoroscope).toBe(true);
			expect(chatStore.includeHomework).toBe(false);
		});

		it('loadDraft returns false when no draft exists', async () => {
			vi.mocked(Preferences.get).mockResolvedValueOnce({ value: null });

			const loaded = await chatStore.loadDraft();

			expect(loaded).toBe(false);
			expect(chatStore.messages).toEqual([]);
			expect(chatStore.phase).toBe('empty');
		});

		it('loadDraft discards expired drafts (>24h)', async () => {
			const expiredDraft = {
				messages: [{ id: 'msg-1', role: 'user', content: 'Old', timestamp: 1000 }],
				phase: 'chatting',
				selectedTone: '',
				includeHoroscope: false,
				includeOnThisDay: false,
				includeHomework: true,
				savedAt: Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
			};

			vi.mocked(Preferences.get).mockResolvedValueOnce({
				value: JSON.stringify(expiredDraft)
			});

			const loaded = await chatStore.loadDraft();

			expect(loaded).toBe(false);
			expect(Preferences.remove).toHaveBeenCalledWith({ key: 'storify-chat-draft' });
			expect(chatStore.messages).toEqual([]);
		});

		it('clearDraft removes the draft from Preferences', async () => {
			await chatStore.clearDraft();

			expect(Preferences.remove).toHaveBeenCalledWith({ key: 'storify-chat-draft' });
		});

		it('clearDraft cancels pending debounced saves', async () => {
			chatStore.addUserMessage('Hello');
			// Draft save is scheduled but not yet executed

			await chatStore.clearDraft();
			await vi.advanceTimersByTimeAsync(500);

			// Preferences.set should NOT have been called (debounce was cancelled)
			expect(Preferences.set).not.toHaveBeenCalled();
			expect(Preferences.remove).toHaveBeenCalledWith({ key: 'storify-chat-draft' });
		});

		it('saved draft includes savedAt timestamp', async () => {
			const now = Date.now();
			chatStore.addUserMessage('Test');

			await vi.advanceTimersByTimeAsync(500);

			const savedValue = JSON.parse(
				vi.mocked(Preferences.set).mock.calls[0][0].value
			);
			expect(savedValue.savedAt).toBeGreaterThanOrEqual(now);
		});
	});
});
