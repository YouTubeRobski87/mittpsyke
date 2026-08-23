import { beforeEach, describe, expect, it, vi } from 'vitest';

const publicEnv: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));

const { canUseGoogleOAuth, getStableOAuthBaseUrl, getStableOAuthCallbackUrl } = await import(
	'./auth-redirect'
);

describe('Google OAuth redirect origin', () => {
	beforeEach(() => {
		for (const key of Object.keys(publicEnv)) delete publicEnv[key];
	});

	it('uses the apex production origin when no public URL is configured', () => {
		expect(getStableOAuthBaseUrl()).toBe('https://mittpsyke.se');
		expect(canUseGoogleOAuth('https://mittpsyke.se')).toBe(true);
		expect(canUseGoogleOAuth('https://www.mittpsyke.se')).toBe(false);
	});

	it('builds the dashboard callback from the canonical production origin', () => {
		expect(getStableOAuthCallbackUrl('/dashboard')).toBe(
			'https://mittpsyke.se/auth/callback?next=%2Fdashboard'
		);
	});
});
