export const AVATAR_PRESETS = {
	sol: '/avatars/sol.svg',
	himmel: '/avatars/himmel.svg',
	skog: '/avatars/skog.svg',
	natt: '/avatars/natt.svg',
	gryning: '/avatars/gryning.svg',
	sten: '/avatars/sten.svg'
} as const;

export type AvatarPresetKey = keyof typeof AVATAR_PRESETS;

export function resolveAvatarPresetUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const key = value as AvatarPresetKey;
	return AVATAR_PRESETS[key] ?? null;
}
