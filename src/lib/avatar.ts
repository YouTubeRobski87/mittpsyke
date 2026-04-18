export const AVATAR_PRESETS = {
	// Bevarar befintliga nycklar för bakåtkompatibilitet i user_metadata.
	sol: '/images/avatars/presets/avatar-01-short-hair-hoodie.png',
	himmel: '/images/avatars/presets/avatar-02-curly-sweater.png',
	skog: '/images/avatars/presets/avatar-03-shaved-glasses.png',
	natt: '/images/avatars/presets/avatar-04-medium-hair-hoodie.png',
	gryning: '/images/avatars/presets/avatar-05-messy-short-sweater.png',
	sten: '/images/avatars/presets/avatar-06-long-hair-tied.png',
	nord7: '/images/avatars/presets/avatar-07-short-sidepart-sweater.png',
	nord8: '/images/avatars/presets/avatar-08-wavy-bob-hoodie.png',
	nord9: '/images/avatars/presets/avatar-09-very-short-glasses.png',
	nord10: '/images/avatars/presets/avatar-10-medium-straight-hoodie.png',
	nord11: '/images/avatars/presets/avatar-11-messy-short-knit.png',
	nord12: '/images/avatars/presets/avatar-12-long-tied-simple-top.png'
} as const;

export type AvatarPresetKey = keyof typeof AVATAR_PRESETS;

export function resolveAvatarPresetUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const key = value as AvatarPresetKey;
	return AVATAR_PRESETS[key] ?? null;
}
