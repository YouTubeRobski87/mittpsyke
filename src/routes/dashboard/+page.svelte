<script lang="ts">
	import { onMount } from 'svelte';
	import { trackHoroscopeCTAClick } from '$lib/analytics';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import Greeting from '$lib/components/dashboard/Greeting.svelte';
	import MoodChart from '$lib/components/MoodChart.svelte';
	import QuickActions from '$lib/components/dashboard/QuickActions.svelte';
	import { supabase } from '$lib/supabase';
	import type { User } from '@supabase/supabase-js';

	type MoodPoint = {
		date: string;
		mood: number;
	};

	let { data } = $props<{ data: { moodSeries: MoodPoint[] } }>();

	let user = $state<User | null>(null);
	let loading = $state(true);
	let zodiacSign = $state('');
	let horoscopeText = $state('');
	let horoscopeLoading = $state(false);
	let horoscopeUnavailable = $state(false);
	let greetingName = $state('igen');
	const moodSeries = $derived(data?.moodSeries ?? []);

	function cleanName(value: unknown): string {
		if (typeof value !== 'string') return '';
		const trimmed = value.trim();
		if (!trimmed) return '';
		// Never show email-like values in greeting.
		if (trimmed.includes('@')) return '';
		return trimmed;
	}

	function getZodiacSign(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (Number.isNaN(d.getTime())) return '';
		const m = d.getMonth() + 1;
		const day = d.getDate();
		if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Väduren';
		if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Oxen';
		if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Tvillingarna';
		if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Kräftan';
		if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Lejonet';
		if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Jungfrun';
		if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Vågen';
		if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Skorpionen';
		if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Skytten';
		if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Stenbocken';
		if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Vattumannen';
		if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 'Fiskarna';
		return '';
	}

	async function loadDashboard() {
		try {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			const { data: userData } = await supabase.auth.getUser();
			user = userData.user ?? session?.user ?? null;

			const profileDisplayName = user?.id
				? await supabase
						.from('profiles')
						.select('display_name')
						.eq('id', user.id)
						.maybeSingle()
						.then(({ data }) => cleanName(data?.display_name))
				: '';

			const metadataDisplayName = cleanName(user?.user_metadata?.display_name);
			const metadataFullName = cleanName(user?.user_metadata?.full_name);
			const metadataName = cleanName(user?.user_metadata?.name);

			greetingName =
				metadataDisplayName ||
				profileDisplayName ||
				metadataFullName ||
				metadataName ||
				'igen';

			const birthday =
				typeof user?.user_metadata?.birthday === 'string'
					? user.user_metadata.birthday
					: '';

			zodiacSign = getZodiacSign(birthday);
			horoscopeUnavailable = false;

			if (zodiacSign) {
				horoscopeLoading = true;
				const response = await fetch('/api/horoscope', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sign: zodiacSign })
				});
				const payload = await response.json().catch(() => null);
				horoscopeText = typeof payload?.text === 'string' ? payload.text : '';
				horoscopeUnavailable = horoscopeText.length === 0;
			}
		} finally {
			horoscopeLoading = false;
			loading = false;
		}
	}

	onMount(async () => {
		await loadDashboard();
	});
</script>

<main class="auth-page">
	<PortalSubnav
		active="dashboard"
		title="Min portal"
		description="En lugn startsida med dina viktigaste vägar vidare."
	/>

	<div class="auth-shell">
		{#if loading}
			<section class="auth-panel">
				<p class="auth-muted">Laddar...</p>
			</section>
		{:else}
			<section class="auth-panel">
				<Greeting {user} {greetingName} />
			</section>

			<section class="auth-panel auth-panel-accent">
				<p class="horoscope-kicker">Dagens tanke</p>
				{#if horoscopeLoading}
					<p class="auth-muted">Hämtar horoskop...</p>
				{:else if zodiacSign && horoscopeText}
					<p class="horoscope-sign">🔮 {zodiacSign}</p>
					<p class="horoscope-text">{horoscopeText}</p>
				{:else if zodiacSign && horoscopeUnavailable}
					<p class="auth-muted">Dagens horoskop kunde inte hämtas just nu. Du kan ändå skriva några ord.</p>
				{:else}
					<p class="auth-muted">Lägg till födelsedag i inställningar om du vill få en daglig horoskoprad här.</p>
				{/if}
				<a
					href="/dagbok?from=horoscope"
					class="auth-button primary mt-3"
					onclick={trackHoroscopeCTAClick}
				>
					Vill du skriva några ord om det här?
				</a>
			</section>

			<section class="auth-panel auth-panel-accent">
				<h2 class="mood-title">Ditt humör – senaste 7 dagarna</h2>
				<MoodChart data={moodSeries} />
			</section>

			<QuickActions />
		{/if}
	</div>
</main>

<style>
	.horoscope-kicker {
		margin: 0;
		font-size: 0.76rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.horoscope-sign {
		margin: 0.45rem 0 0;
		font-size: 0.9rem;
		font-family: var(--font-heading);
	}

	.horoscope-text {
		margin: 0.4rem 0 0;
		line-height: 1.6;
	}

	.mood-title {
		margin: 0 0 0.6rem;
		font-size: 1rem;
		font-weight: 600;
	}
</style>
