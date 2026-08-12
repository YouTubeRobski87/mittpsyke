export const COMPANION_GREETING_DURATION_MS = 3_200;
export const COMPANION_GREETING_COOLDOWN_MS = 7_000;

const GREETINGS = ['Fint att se dig.', 'Jag är här.', 'Hej igen.'] as const;

function getFirstName(displayName: string | null | undefined) {
	const firstName = displayName?.trim().split(/\s+/)[0] ?? '';
	return firstName || null;
}

export function getCompanionGreeting(displayName: string | null | undefined, reactionNumber: number) {
	const firstName = getFirstName(displayName);
	if (firstName) return `Hej, ${firstName}.`;
	return GREETINGS[reactionNumber % GREETINGS.length];
}

export function canTriggerCompanionGreeting(lastTriggeredAt: number, now = Date.now()) {
	return now - lastTriggeredAt >= COMPANION_GREETING_COOLDOWN_MS;
}
