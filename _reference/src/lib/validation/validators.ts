import { LIMITS, FIELD_LIMITS } from './limits';
import type { WizardData, UserProfile } from '$lib/stores/wizard.svelte';

export interface FieldError {
	field: string;
	message: string;
	code: 'TOO_LONG' | 'TOO_MANY_ITEMS' | 'SUSPICIOUS_CONTENT' | 'INVALID_FORMAT';
}

export interface ValidationResult {
	valid: boolean;
	errors: FieldError[];
}

// Email regex (same as currently used, but centralized)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pattern to detect potential script injection attempts
const SUSPICIOUS_PATTERN = /<script|javascript:|on\w+\s*=/i;

// Pattern to detect prompt injection attempts (instruction-level attacks)
const PROMPT_INJECTION_PATTERN =
	/ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions|prompts|rules)|you\s+are\s+now\s+a|new\s+instructions?:|system\s*prompt:|forget\s+(everything|all|your)\s+(above|previous|prior)|do\s+not\s+follow|override\s+(previous|all|your)|disregard\s+(all|previous|above|prior|the)\s+(instructions|rules|prompts)/i;

export function validateString(
	value: string,
	fieldName: string,
	maxLength?: number
): FieldError | null {
	if (!value) return null;

	const limit = maxLength ?? FIELD_LIMITS[fieldName] ?? LIMITS.SHORT_TEXT;

	if (value.length > limit) {
		return {
			field: fieldName,
			message: `Max ${limit} tecken tillåtna`,
			code: 'TOO_LONG'
		};
	}

	if (SUSPICIOUS_PATTERN.test(value) || PROMPT_INJECTION_PATTERN.test(value)) {
		return {
			field: fieldName,
			message: 'Otillåtet innehåll',
			code: 'SUSPICIOUS_CONTENT'
		};
	}

	return null;
}

export function validateArray(
	items: string[],
	fieldName: string,
	itemLimit?: number
): FieldError | null {
	if (!items || items.length === 0) return null;

	if (items.length > LIMITS.MAX_ARRAY_SIZE) {
		return {
			field: fieldName,
			message: `Max ${LIMITS.MAX_ARRAY_SIZE} val tillåtna`,
			code: 'TOO_MANY_ITEMS'
		};
	}

	const limit = itemLimit ?? FIELD_LIMITS[fieldName] ?? LIMITS.TAG_ITEM;

	for (let i = 0; i < items.length; i++) {
		const error = validateString(items[i], `${fieldName}[${i}]`, limit);
		if (error) {
			return { ...error, field: fieldName };
		}
	}

	return null;
}

export function validateEmail(email: string): FieldError | null {
	if (!email) return null;

	if (email.length > LIMITS.EMAIL) {
		return {
			field: 'email',
			message: 'E-postadressen är för lång',
			code: 'TOO_LONG'
		};
	}

	if (!EMAIL_REGEX.test(email)) {
		return {
			field: 'email',
			message: 'Ogiltig e-postadress',
			code: 'INVALID_FORMAT'
		};
	}

	return null;
}

export function validateWizardData(data: WizardData): ValidationResult {
	const errors: FieldError[] = [];

	// Editor mode: validate free text instead of structured fields
	if (data.editorMode) {
		if (!data.freeText || data.freeText.trim().length === 0) {
			errors.push({
				field: 'freeText',
				message: 'Texten saknas.',
				code: 'INVALID_FORMAT'
			});
		} else if (data.freeText.length > LIMITS.FREE_TEXT) {
			errors.push({
				field: 'freeText',
				message: `Texten överskrider ${LIMITS.FREE_TEXT} tecken.`,
				code: 'TOO_LONG'
			});
		} else if (SUSPICIOUS_PATTERN.test(data.freeText) || PROMPT_INJECTION_PATTERN.test(data.freeText)) {
			errors.push({
				field: 'freeText',
				message: 'Otillåtet innehåll i texten.',
				code: 'SUSPICIOUS_CONTENT'
			});
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	// Chat mode: validate transcript instead of structured fields
	if (data.chatMode) {
		if (!data.chatTranscript || data.chatTranscript.trim().length === 0) {
			errors.push({
				field: 'chatTranscript',
				message: 'Konversationsloggen saknas.',
				code: 'INVALID_FORMAT'
			});
		} else if (data.chatTranscript.length > LIMITS.CHAT_TRANSCRIPT) {
			errors.push({
				field: 'chatTranscript',
				message: `Konversationsloggen överskrider ${LIMITS.CHAT_TRANSCRIPT} tecken.`,
				code: 'TOO_LONG'
			});
		} else if (SUSPICIOUS_PATTERN.test(data.chatTranscript) || PROMPT_INJECTION_PATTERN.test(data.chatTranscript)) {
			errors.push({
				field: 'chatTranscript',
				message: 'Otillåtet innehåll i konversationsloggen.',
				code: 'SUSPICIOUS_CONTENT'
			});
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	// Profile validation
	const profile = data.profile;
	if (profile) {
		const stringFields: (keyof UserProfile)[] = ['name', 'hometown'];
		for (const field of stringFields) {
			const value = profile[field];
			if (typeof value === 'string') {
				const error = validateString(value, field);
				if (error) errors.push(error);
			}
		}

		// Profile arrays
		const arrayFields: (keyof UserProfile)[] = [
			'family',
			'pets',
			'occupationDetail',
			'interests'
		];
		for (const field of arrayFields) {
			const value = profile[field];
			if (Array.isArray(value)) {
				const error = validateArray(value as string[], field);
				if (error) errors.push(error);
			}
		}
	}

	// Step 3 arrays
	const step3Arrays: (keyof WizardData)[] = [
		'locations',
		'customLocations',
		'activities',
		'customActivities',
		'people'
	];
	for (const field of step3Arrays) {
		const value = data[field];
		if (Array.isArray(value)) {
			const error = validateArray(value as string[], field);
			if (error) errors.push(error);
		}
	}

	// Step 4 arrays (wins/frustrations)
	const step4Arrays: (keyof WizardData)[] = ['wins', 'frustrations'];
	for (const field of step4Arrays) {
		const value = data[field];
		if (Array.isArray(value)) {
			const error = validateArray(value as string[], field);
			if (error) errors.push(error);
		}
	}

	// Step 5 textareas
	const step5Fields: (keyof WizardData)[] = ['almostHappened', 'unnecessaryThing', 'wouldRedo'];
	for (const field of step5Fields) {
		const value = data[field];
		if (typeof value === 'string' && value) {
			const error = validateString(value, field);
			if (error) errors.push(error);
		}
	}

	// Step 6 arrays
	const step6Arrays: (keyof WizardData)[] = [
		'meals',
		'customMeals',
		'soundtracks',
		'customSoundtracks'
	];
	for (const field of step6Arrays) {
		const value = data[field];
		if (Array.isArray(value)) {
			const error = validateArray(value as string[], field);
			if (error) errors.push(error);
		}
	}

	// Quick mode text
	if (typeof data.quickText === 'string' && data.quickText) {
		const error = validateString(data.quickText, 'quickText');
		if (error) errors.push(error);
	}

	// Step 7 textareas
	const step7Fields: (keyof WizardData)[] = ['memoryFor10Years', 'messageToFutureSelf'];
	for (const field of step7Fields) {
		const value = data[field];
		if (typeof value === 'string' && value) {
			const error = validateString(value, field);
			if (error) errors.push(error);
		}
	}

	// Emojis
	if (data.emojis && data.emojis.length > LIMITS.MAX_EMOJIS) {
		errors.push({
			field: 'emojis',
			message: `Max ${LIMITS.MAX_EMOJIS} emojis tillåtna`,
			code: 'TOO_MANY_ITEMS'
		});
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

export interface ChatMessagePayload {
	role: 'user' | 'assistant';
	content: string;
}

export interface ChatValidationResult {
	valid: boolean;
	error?: string;
}

export function validateChatMessages(messages: ChatMessagePayload[]): ChatValidationResult {
	if (!Array.isArray(messages) || messages.length === 0) {
		return { valid: false, error: 'Inga meddelanden skickade.' };
	}

	if (messages.length > LIMITS.CHAT_MAX_MESSAGES) {
		return { valid: false, error: 'Konversationen har nått maxgränsen.' };
	}

	for (let i = 0; i < messages.length; i++) {
		const msg = messages[i];

		if (!msg || typeof msg.content !== 'string' || !['user', 'assistant'].includes(msg.role)) {
			return { valid: false, error: 'Ogiltigt meddelandeformat.' };
		}

		if (msg.role === 'user') {
			if (msg.content.trim().length === 0) {
				return { valid: false, error: 'Tomt meddelande.' };
			}

			if (msg.content.length > LIMITS.CHAT_MESSAGE) {
				return { valid: false, error: `Meddelandet överskrider ${LIMITS.CHAT_MESSAGE} tecken.` };
			}

			if (SUSPICIOUS_PATTERN.test(msg.content)) {
				return { valid: false, error: 'Otillåtet innehåll.' };
			}

			if (PROMPT_INJECTION_PATTERN.test(msg.content)) {
				return { valid: false, error: 'Otillåtet innehåll.' };
			}
		}
	}

	return { valid: true };
}

export function validatePayloadSize(data: unknown): boolean {
	const size = new TextEncoder().encode(JSON.stringify(data)).length;
	return size <= LIMITS.MAX_PAYLOAD_BYTES;
}
