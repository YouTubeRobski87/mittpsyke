import { browser, dev } from '$app/environment';

if (browser) {
	const consent = localStorage.getItem('cookie-consent');
	if (consent === 'accepted') {
		Promise.all([
			import('@vercel/speed-insights/sveltekit'),
			import('@vercel/analytics/sveltekit')
		]).then(([si, analytics]) => {
			si.injectSpeedInsights();
			analytics.injectAnalytics({ mode: dev ? 'development' : 'production' });
		});
	}
}
