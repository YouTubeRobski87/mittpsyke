export type CompanionPoseDaypart = 'day' | 'evening' | 'night';
export type CompanionPoseRole = 'base' | 'overlay';

export type CompanionPoseFrame = {
	src: string;
};

export type CompanionPose = {
	id: string;
	role: CompanionPoseRole;
	dayparts: CompanionPoseDaypart[];
	frames: CompanionPoseFrame[];
	alt: string;
	weight?: number;
	frameMs?: number;
	eventChance?: number;
	durationMs?: number;
};

const FOX_POSE_BASE_PATH = '/images/avatars/presets/fox';

const foxPoseSrc = (fileName: string) => `${FOX_POSE_BASE_PATH}/${fileName}`;

export const FOX_COMPANION_POSES = [
	{
		id: 'idle',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_idle.png') }],
		alt: 'Din följeslagare, räven, står avslappnat.',
		weight: 3
	},
	{
		id: 'look-left',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_look_left.png') }],
		alt: 'Din följeslagare, räven, tittar lugnt åt vänster.',
		weight: 1.1
	},
	{
		id: 'look-right',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_look_right.png') }],
		alt: 'Din följeslagare, räven, tittar lugnt åt höger.',
		weight: 1.1
	},
	{
		id: 'sit',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_sit.png') }],
		alt: 'Din följeslagare, räven, sitter stilla.',
		weight: 2.2
	},
	{
		id: 'sit-look-up',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_sit_look_up.png') }],
		alt: 'Din följeslagare, räven, sitter och tittar upp.',
		weight: 0.9
	},
	{
		id: 'drink',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_drink.png') }],
		alt: 'Din följeslagare, räven, dricker stilla vid sjön.',
		weight: 0.75
	},
	{
		id: 'sniff',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_sniff.png') }],
		alt: 'Din följeslagare, räven, nosar försiktigt på marken.',
		weight: 0.8
	},
	{
		id: 'stretch',
		role: 'base',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_stretch.png') }],
		alt: 'Din följeslagare, räven, sträcker lugnt på sig.',
		weight: 0.65
	},
	{
		id: 'walk',
		role: 'base',
		dayparts: ['day'],
		frames: [
			{ src: foxPoseSrc('fox_walk_1.png') },
			{ src: foxPoseSrc('fox_walk_2.png') },
			{ src: foxPoseSrc('fox_walk_3.png') },
			{ src: foxPoseSrc('fox_walk_4.png') }
		],
		alt: 'Din följeslagare, räven, går långsamt genom platsen.',
		weight: 0.22,
		frameMs: 620
	},
	{
		id: 'evening-lake',
		role: 'base',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox_evening_lake.png') }],
		alt: 'Din följeslagare, räven, sitter och tittar mot sjön i kvällsljus.',
		weight: 2.6
	},
	{
		id: 'rest',
		role: 'base',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox_rest.png') }],
		alt: 'Din följeslagare, räven, ligger och vilar i kvällslugnet.',
		weight: 1.7
	},
	{
		id: 'sleep-curled',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox_sleep.png') }],
		alt: 'Din följeslagare, räven, sover hoprullad.',
		weight: 2.3
	},
	{
		id: 'sleep-side',
		role: 'base',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox_sleep_side.png') }],
		alt: 'Din följeslagare, räven, sover lugnt på sidan.',
		weight: 1.8
	},
	{
		id: 'blink',
		role: 'overlay',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_idle_blink.png') }],
		alt: '',
		eventChance: 0.06,
		durationMs: 1450
	},
	{
		id: 'happy',
		role: 'overlay',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_happy.png') }],
		alt: '',
		eventChance: 0.025,
		durationMs: 5200
	},
	{
		id: 'curious',
		role: 'overlay',
		dayparts: ['day'],
		frames: [{ src: foxPoseSrc('fox_curious.png') }],
		alt: '',
		eventChance: 0.03,
		durationMs: 5600
	},
	{
		id: 'thoughtful',
		role: 'overlay',
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox_thoughtful.png') }],
		alt: '',
		eventChance: 0.02,
		durationMs: 5600
	},
	{
		id: 'listening',
		role: 'overlay',
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox_listening.png') }],
		alt: '',
		eventChance: 0.022,
		durationMs: 5600
	},
	{
		id: 'look-user',
		role: 'overlay',
		dayparts: ['day', 'evening'],
		frames: [{ src: foxPoseSrc('fox_look_user.png') }],
		alt: '',
		eventChance: 0.018,
		durationMs: 5200
	},
	{
		id: 'yawn',
		role: 'overlay',
		dayparts: ['evening'],
		frames: [{ src: foxPoseSrc('fox_yawn.png') }],
		alt: '',
		eventChance: 0.045,
		durationMs: 4300
	},
	{
		id: 'sleep-ear-twitch',
		role: 'overlay',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox_sleep_ear_twitch.png') }],
		alt: '',
		eventChance: 0.035,
		durationMs: 2600
	},
	{
		id: 'sleep-tail-move',
		role: 'overlay',
		dayparts: ['night'],
		frames: [{ src: foxPoseSrc('fox_sleep_tail_move.png') }],
		alt: '',
		eventChance: 0.028,
		durationMs: 3200
	}
] satisfies CompanionPose[];

export const COMPANION_POSES: readonly CompanionPose[] = FOX_COMPANION_POSES;

export const COMPANION_POSE_CHANGE_MIN_MS = 20 * 60 * 1000;
export const COMPANION_POSE_CHANGE_MAX_MS = 40 * 60 * 1000;
