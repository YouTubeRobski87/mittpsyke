import { containsAcuteCrisisPhrase, containsThirdPartyRiskPhrase } from './crisis-keywords';
import { CRISIS_RESPONSE, THIRD_PARTY_RISK_RESPONSE } from './crisis-responses';

export type DeterministicRiskGuardResult = {
	reply: string;
	crisis: true;
	kind: 'self-risk' | 'third-party-risk';
};

/** Runs before storage, rate limiting and every AI provider request. */
export function resolveDeterministicRiskGuard(message: string): DeterministicRiskGuardResult | null {
	if (containsAcuteCrisisPhrase(message)) {
		return { reply: CRISIS_RESPONSE, crisis: true, kind: 'self-risk' };
	}
	if (containsThirdPartyRiskPhrase(message)) {
		return { reply: THIRD_PARTY_RISK_RESPONSE, crisis: true, kind: 'third-party-risk' };
	}
	return null;
}
