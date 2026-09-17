import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { CompanionDailyState } from '$lib/companionDailyQuestion';

// Se diary-shortcut.test.ts: $lib/supabase bygger sin klient vid import och
// kastar utan PUBLIC_SUPABASE_*. Sidan drar in den via EveningCheckinFlow.
vi.mock('$lib/supabase', () => ({
	supabase: {
		auth: {
			getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
			updateUser: vi.fn(async () => ({ data: { user: null }, error: null })),
			refreshSession: vi.fn(async () => ({ data: { session: null }, error: null }))
		}
	}
}));

const { default: Page } = await import('./+page.svelte');

const route = readFileSync(join(process.cwd(), 'src/routes/dashboard/kvallsstugan/+page.svelte'), 'utf8');

const baseData = (companionDaily: CompanionDailyState | null) => ({
	companionDaily,
	interiorMemory: { hasBook: true, hasRug: true, hasBlanket: true, hasVeranda: true }
});

const pendingQuestion: CompanionDailyState = {
	dateKey: '2026-01-01',
	questionId: 'daily-lighten-day',
	status: 'pending',
	answerId: null,
	answeredDayCount: 3
};

// Flyttad hit från gamla /dashboard: Kvällstugan laddade redan companionDaily
// server-side (för bond-nivån), men kunde tidigare inte visa eller besvara
// frågan - det gick bara på Mitt Hem. Se companionDailyQuestionState.svelte.ts
// för själva svarslogiken; det här testet gäller bara att den faktiskt är
// kopplad in på sidan.
describe('Dagens fråga i Kvällstugan', () => {
	it('återanvänder samma komponent och delade tillståndsmodul som Mitt Hem gjorde', () => {
		expect(route).toContain(
			"import CompanionDailyCard from '$lib/components/world/CompanionDailyCard.svelte'"
		);
		expect(route).toContain(
			"import { createCompanionDailyQuestionState } from '$lib/companionDailyQuestionState.svelte'"
		);
		expect(route).toContain('createCompanionDailyQuestionState(() => data.companionDaily)');
	});

	it('renderar kortet när dagens fråga väntar på svar', () => {
		const { body } = render(Page, { props: { data: baseData(pendingQuestion) } });

		expect(body).toContain('companion-daily-question');
		expect(body).toContain('Vad skulle göra idag lite lättare?');
		expect(body).toContain('Hoppa över');
	});

	it('renderar inget kort utan en väntande fråga', () => {
		const { body: noQuestion } = render(Page, { props: { data: baseData(null) } });
		expect(noQuestion).not.toContain('companion-daily-question');

		const { body: alreadyAnswered } = render(
			Page,
			{ props: { data: baseData({ ...pendingQuestion, status: 'answered', answerId: 'calm' }) } }
		);
		expect(alreadyAnswered).not.toContain('companion-daily-question');
	});

	it('kopplar svaren till samma /api/companion/daily-question som förut, inte en ny endpoint', () => {
		expect(route).toContain('onanswer={(answerId) => respondToDailyQuestion(answerId)}');
		expect(route).toContain('onskip={() => respondToDailyQuestion(null)}');
		expect(route).toContain("await dailyQuestion.respond(answerId);");
	});

	it('låter följeslagaren reagera på svaret genom samma greetingReaction-spår som checkin-flödet, ingen ny signal', () => {
		expect(route).toContain('completionSignal += 1;');
		expect(route).toContain('greetingReaction={completionSignal}');
	});

	it('återanvänder det kosmetiska världssvaret utan egen kopia av triggerlogiken', () => {
		expect(route).toContain(
			'<CompanionWorldResponse class="evening-world-response" signal={dailyQuestion.worldResponseSignal} />'
		);
	});
});
