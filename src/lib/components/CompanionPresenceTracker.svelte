<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	let { enabled = false }: { enabled?: boolean } = $props();

	const SESSION_KEY = 'mittpsyke-companion-presence-week';
	const ACTIVE_DELAY_MS = 15_000;

	function stockholmIsoWeekKey(date = new Date()) {
		const parts = new Intl.DateTimeFormat('sv-SE', {
			timeZone: 'Europe/Stockholm',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
			.formatToParts(date)
			.reduce<Record<string, string>>((result, part) => {
				if (part.type !== 'literal') result[part.type] = part.value;
				return result;
			}, {});
		const stockholmMidday = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
		const weekday = stockholmMidday.getUTCDay() || 7;
		stockholmMidday.setUTCDate(stockholmMidday.getUTCDate() - weekday + 1);
		return stockholmMidday.toISOString().slice(0, 10);
	}

	onMount(() => {
		if (!enabled) return;

		let timer: number | null = null;
		let disposed = false;
		const weekKey = stockholmIsoWeekKey();

		const isActive = () => document.visibilityState === 'visible' && document.hasFocus();
		const clearTimer = () => {
			if (timer !== null) window.clearTimeout(timer);
			timer = null;
		};

		const record = async () => {
			try {
				const {
					data: { session }
				} = await supabase.auth.getSession();
				if (!session?.access_token || disposed || !isActive()) return;

				const response = await fetch('/api/companion/presence', {
					method: 'POST',
					headers: { Authorization: `Bearer ${session.access_token}` }
				});
				if (response.ok) sessionStorage.setItem(SESSION_KEY, weekKey);
			} catch {
				// Närvaro är frivillig och ska aldrig störa användarens besök.
			}
		};

		const schedule = () => {
			clearTimer();
			if (disposed || !isActive() || sessionStorage.getItem(SESSION_KEY) === weekKey) return;
			timer = window.setTimeout(() => {
				timer = null;
				void record();
			}, ACTIVE_DELAY_MS);
		};

		const onVisibilityChange = () => schedule();
		window.addEventListener('focus', schedule);
		window.addEventListener('blur', clearTimer);
		document.addEventListener('visibilitychange', onVisibilityChange);
		schedule();

		return () => {
			disposed = true;
			clearTimer();
			window.removeEventListener('focus', schedule);
			window.removeEventListener('blur', clearTimer);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});
</script>
