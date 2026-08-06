import { describe, expect, it } from 'vitest';
import {
	buildSharedSafetyInstructions,
	buildSupportChatSafetyInstructions,
	buildWeeklySummarySafetyInstructions
} from './safety-instructions';

describe('gemensamma AI-säkerhetsinstruktioner', () => {
	it('prioriterar akut fara och förbjuder garantier', () => {
		const instructions = buildSharedSafetyInstructions().join(' ');
		expect(instructions).toMatch(/akut fara/i);
		expect(instructions).toMatch(/falsk garanti/i);
	});

	it('säger att oskickad historik aldrig får påstås vara läst', () => {
		expect(buildSharedSafetyInstructions().join(' ')).toMatch(/oskickad historik/i);
	});

	it('behåller skyddet mot upprepat bekräftelsesökande i chatten', () => {
		expect(buildSupportChatSafetyInstructions().join(' ')).toMatch(/upprepat bekräftelsesökande/i);
	});

	it('håller dagboksreflektion skild från samtalsstöd och märker AI-innehållet', () => {
		const instructions = buildWeeklySummarySafetyInstructions().join(' ');
		expect(instructions).toMatch(/inte.*psykologisk analys/i);
		expect(instructions).toMatch(/AI-genererad/i);
	});
});
