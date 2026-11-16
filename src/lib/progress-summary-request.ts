import type { LighterDaysView } from './progress-lighter-days-types';

export async function getSummarySnapshotId(view: LighterDaysView): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(view));
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createSummaryRequests() {
	let active: AbortController | undefined;

	function cancel() {
		active?.abort();
		active = undefined;
	}

	return {
		cancel,
		start(view: LighterDaysView) {
			cancel();
			const controller = new AbortController();
			active = controller;
			return {
				signal: controller.signal,
				isCurrent: (current: LighterDaysView | null) => active === controller && current === view,
				finish() {
					if (active === controller) active = undefined;
				}
			};
		}
	};
}
