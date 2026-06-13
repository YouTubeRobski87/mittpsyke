export const AVATAR_PRESETS = {
	// Befintliga nycklar behålls för bakåtkompatibilitet i user_metadata.
	sol: {
		label: 'Lugn 1',
		bg: '#dfeee8',
		skin: '#e8b68f',
		hair: '#4c372c',
		shirt: '#6f9c9a',
		hairStyle: 'short',
		accessory: 'none'
	},
	himmel: {
		label: 'Lugn 2',
		bg: '#e2ebf4',
		skin: '#f0c8a5',
		hair: '#6d4b34',
		shirt: '#6d8fb4',
		hairStyle: 'curly',
		accessory: 'none'
	},
	skog: {
		label: 'Lugn 3',
		bg: '#e8eadf',
		skin: '#b97c55',
		hair: '#2f2d2b',
		shirt: '#758d73',
		hairStyle: 'shaved',
		accessory: 'glasses'
	},
	natt: {
		label: 'Lugn 4',
		bg: '#e7e5f0',
		skin: '#d39b72',
		hair: '#342a2a',
		shirt: '#7d7898',
		hairStyle: 'medium',
		accessory: 'none'
	},
	gryning: {
		label: 'Lugn 5',
		bg: '#f1e4dc',
		skin: '#f1d2b6',
		hair: '#8b5f39',
		shirt: '#b48276',
		hairStyle: 'messy',
		accessory: 'none'
	},
	sten: {
		label: 'Lugn 6',
		bg: '#e6e8e8',
		skin: '#c88a61',
		hair: '#4a3227',
		shirt: '#7f8c97',
		hairStyle: 'long',
		accessory: 'none'
	},
	nord7: {
		label: 'Lugn 7',
		bg: '#e3eee9',
		skin: '#a96f4a',
		hair: '#2f2723',
		shirt: '#5f8a82',
		hairStyle: 'sidepart',
		accessory: 'beard'
	},
	nord8: {
		label: 'Lugn 8',
		bg: '#eee8df',
		skin: '#e0a77d',
		hair: '#5a4034',
		shirt: '#a9886f',
		hairStyle: 'bob',
		accessory: 'none'
	},
	nord9: {
		label: 'Lugn 9',
		bg: '#e2e8ef',
		skin: '#7f523b',
		hair: '#211f20',
		shirt: '#6b7f9b',
		hairStyle: 'shaved',
		accessory: 'glasses'
	},
	nord10: {
		label: 'Lugn 10',
		bg: '#e8e5ef',
		skin: '#eac1a2',
		hair: '#756059',
		shirt: '#8d7cab',
		hairStyle: 'straight',
		accessory: 'none'
	},
	nord11: {
		label: 'Lugn 11',
		bg: '#edf0e4',
		skin: '#c98f67',
		hair: '#7d4c31',
		shirt: '#8a986a',
		hairStyle: 'messy',
		accessory: 'beard'
	},
	nord12: {
		label: 'Lugn 12',
		bg: '#e7ece7',
		skin: '#f2c7a3',
		hair: '#3d3330',
		shirt: '#75907c',
		hairStyle: 'tied',
		accessory: 'none'
	},
	nord13: {
		label: 'Lugn 13',
		bg: '#eee4e8',
		skin: '#9a6246',
		hair: '#2d2523',
		shirt: '#9d7482',
		hairStyle: 'long',
		accessory: 'glasses'
	},
	nord14: {
		label: 'Lugn 14',
		bg: '#e5ecef',
		skin: '#d8a07a',
		hair: '#a88968',
		shirt: '#6f8c9b',
		hairStyle: 'curly',
		accessory: 'none'
	},
	nord15: {
		label: 'Lugn 15',
		bg: '#eee9df',
		skin: '#b47753',
		hair: '#3d2a22',
		shirt: '#9a8765',
		hairStyle: 'short',
		accessory: 'beard'
	},
	nord16: {
		label: 'Lugn 16',
		bg: '#e4ebe6',
		skin: '#efcfb4',
		hair: '#5d5651',
		shirt: '#668d7a',
		hairStyle: 'bob',
		accessory: 'glasses'
	}
} as const;

export type AvatarPresetKey = keyof typeof AVATAR_PRESETS;
export type AvatarPreset = (typeof AVATAR_PRESETS)[AvatarPresetKey];

const AVATAR_KEYS = Object.keys(AVATAR_PRESETS) as AvatarPresetKey[];
export const AVATAR_OPTIONS = AVATAR_KEYS.map((value) => ({
	value,
	label: AVATAR_PRESETS[value].label
}));

export function isAvatarPresetKey(value: unknown): value is AvatarPresetKey {
	return typeof value === 'string' && value in AVATAR_PRESETS;
}

export function getStableAvatarKey(seed: unknown, offset = 0): AvatarPresetKey {
	const text = typeof seed === 'string' && seed.trim().length > 0 ? seed : 'mittpsyke-standard';
	let hash = 5381;
	for (let i = 0; i < text.length; i += 1) {
		hash = (((hash << 5) + hash) ^ text.charCodeAt(i)) >>> 0;
	}
	return AVATAR_KEYS[(hash + offset) % AVATAR_KEYS.length];
}

export function resolveAvatarPresetKey(value: unknown, fallbackSeed?: unknown): AvatarPresetKey {
	return isAvatarPresetKey(value) ? value : getStableAvatarKey(fallbackSeed);
}

export function resolveAvatarPreset(value: unknown, fallbackSeed?: unknown): AvatarPreset {
	return AVATAR_PRESETS[resolveAvatarPresetKey(value, fallbackSeed)];
}
