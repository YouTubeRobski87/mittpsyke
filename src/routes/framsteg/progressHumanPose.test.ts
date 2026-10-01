import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	PROGRESS_HUMAN_POSES,
	PROGRESS_HUMAN_POSE_STORAGE_KEY,
	getProgressHumanPose,
	getProgressHumanPosePlacementStyle,
	getProgressInitialHumanPose
} from './progressHumanPose';

function memoryStorage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key) => values.get(key) ?? null,
		key: (index) => [...values.keys()][index] ?? null,
		removeItem: (key) => values.delete(key),
		setItem: (key, value) => values.set(key, value)
	};
}

afterEach(() => vi.restoreAllMocks());

describe('Framstegs mänskliga pose', () => {
	it('börjar alltid sittande och faller tillbaka sittande utan fungerande lagring', () => {
		expect(getProgressInitialHumanPose().id).toBe('sitting');
		expect(getProgressHumanPose(null)).toBe(PROGRESS_HUMAN_POSES.sitting);
		expect(getProgressHumanPose('day', new Date(), null)).toBe(PROGRESS_HUMAN_POSES.sitting);

		const malformed = memoryStorage();
		malformed.setItem(PROGRESS_HUMAN_POSE_STORAGE_KEY, '{inte-json');
		expect(getProgressHumanPose('day', new Date(), malformed)).toBe(PROGRESS_HUMAN_POSES.sitting);

		const throwing = {
			getItem: () => {
				throw new Error('storage blocked');
			}
		} as unknown as Storage;
		expect(getProgressHumanPose('day', new Date(), throwing)).toBe(PROGRESS_HUMAN_POSES.sitting);
	});

	it('behåller samma pose under det gemensamma 20–40-minutersfönstret', () => {
		const storage = memoryStorage();
		const start = new Date('2026-10-01T10:00:00.000Z');
		const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);

		const first = getProgressHumanPose('day', start, storage);
		random.mockReturnValue(0);
		const second = getProgressHumanPose('day', new Date(start.getTime() + 19 * 60 * 1000), storage);

		expect(first.id).toBe('fishing');
		expect(second).toBe(first);
		const stored = JSON.parse(storage.getItem(PROGRESS_HUMAN_POSE_STORAGE_KEY) ?? '{}') as {
			expiresAt?: number;
		};
		expect(stored.expiresAt).toBeGreaterThanOrEqual(start.getTime() + 20 * 60 * 1000);
		expect(stored.expiresAt).toBeLessThanOrEqual(start.getTime() + 40 * 60 * 1000);
	});

	it('viktar fiske högre på morgon/dag och vattensidan högre på kvällen', () => {
		const dayStorage = memoryStorage();
		vi.spyOn(Math, 'random').mockReturnValueOnce(0.45).mockReturnValueOnce(0.5);
		expect(getProgressHumanPose('morning', new Date('2026-10-01T08:00:00Z'), dayStorage).id).toBe(
			'fishing'
		);

		const eveningStorage = memoryStorage();
		vi.spyOn(Math, 'random').mockReturnValueOnce(0.7).mockReturnValueOnce(0.5);
		expect(
			getProgressHumanPose('evening', new Date('2026-10-01T20:00:00Z'), eveningStorage).id
		).toBe('waterside');
	});

	it('använder sittande för eftermiddag och natt', () => {
		for (const band of ['afternoon', 'night'] as const) {
			expect(getProgressHumanPose(band, new Date(), memoryStorage()).id).toBe('sitting');
		}
	});

	it('placerar varje pose i originalscenens procentkoordinater', () => {
		for (const pose of Object.values(PROGRESS_HUMAN_POSES)) {
			const style = getProgressHumanPosePlacementStyle(pose);
			expect(style).toContain('--progress-human-left:');
			expect(style).toContain('--progress-human-top:');
			expect(style).toContain('--progress-human-height:');
			expect(style).toContain(`--progress-human-anchor-x: ${pose.anchorXPercent}%`);
		}
	});
});
