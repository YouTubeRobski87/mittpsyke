import { describe, expect, it } from 'vitest';
import {
	getCompanionBasePose,
	getCompanionScenePosition,
	getMsUntilNextCompanionPoseCheck
} from './companionPoseState';
import type { CompanionId, CompanionPoseDaypart } from './companionPoseManifest';

// Fasta tidpunkter i juni (sommartid, UTC+2), en per dagpart som
// companionPoseState faktiskt skiljer på (morgon slås ihop med dag där).
const DAYPART_DATES: Record<CompanionPoseDaypart, Date> = {
	day: new Date('2026-06-15T10:00:00Z'), // 12:00 i Stockholm
	evening: new Date('2026-06-15T17:00:00Z'), // 19:00 i Stockholm
	night: new Date('2026-06-15T00:00:00Z') // 02:00 i Stockholm
};

const COMPANION_IDS: CompanionId[] = ['fox', 'bear', 'wolf'];
const DAYPARTS: CompanionPoseDaypart[] = ['day', 'evening', 'night'];

// storage=null i alla anrop nedan så varje getCompanionBasePose-anrop slumpar
// på nytt i stället för att återanvända ett localStorage-cachat val - annars
// skulle testerna bara råka verifiera det första slumpade valet.
describe('getCompanionBasePose', () => {
	it('never returns a pose belonging to a different companion', () => {
		for (const companionId of COMPANION_IDS) {
			for (const date of Object.values(DAYPART_DATES)) {
				// Kör flera gånger per kombination eftersom valet är viktat slump -
				// en bugg som läcker en annan companions pose skulle annars kunna
				// missas av en enstaka slumpad träff.
				for (let i = 0; i < 20; i += 1) {
					const pose = getCompanionBasePose(date, null, companionId);
					expect(pose.companionId ?? 'fox').toBe(companionId);
				}
			}
		}
	});

	it('only returns poses available for the requested daypart', () => {
		for (const companionId of COMPANION_IDS) {
			for (const daypart of DAYPARTS) {
				const pose = getCompanionBasePose(DAYPART_DATES[daypart], null, companionId);
				expect(pose.dayparts).toContain(daypart);
			}
		}
	});

	it('always resolves to a real base pose, even for companions with a single pose (wolf)', () => {
		// Vargen har i dag bara wolf-standing - garanterar att fallback-kedjan
		// (se getFallbackPose) fungerar även när det tillgängliga urvalet är som
		// minst, inte bara när det finns flera alternativ att välja mellan.
		for (const daypart of DAYPARTS) {
			const pose = getCompanionBasePose(DAYPART_DATES[daypart], null, 'wolf');
			expect(pose.id).toBe('wolf-standing');
			expect(pose.role).toBe('base');
		}
	});
});

describe('getCompanionScenePosition', () => {
	it('only returns a position that actually allows the given pose', () => {
		for (const companionId of COMPANION_IDS) {
			for (const date of Object.values(DAYPART_DATES)) {
				for (let i = 0; i < 20; i += 1) {
					const pose = getCompanionBasePose(date, null, companionId);
					const position = getCompanionScenePosition(pose, date, null, companionId);
					// Detta är precis den klassen av bugg som skulle få
					// följeslagaren att stå i en scenposition som inte matchar hur
					// den faktiskt ser ut (fel skala/skugga för posen).
					expect(position.allowedPoseIds).toContain(pose.id);
				}
			}
		}
	});
});

describe('getMsUntilNextCompanionPoseCheck', () => {
	it('clamps to the documented 30s-5min window regardless of stored state', () => {
		const ms = getMsUntilNextCompanionPoseCheck(new Date(), null, 'fox');
		expect(ms).toBeGreaterThanOrEqual(30 * 1000);
		expect(ms).toBeLessThanOrEqual(5 * 60 * 1000);
	});
});
