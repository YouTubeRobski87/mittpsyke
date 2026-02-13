<script lang="ts">
	import { goto } from '$app/navigation';
	import DiaryPreviewSidebar from '$lib/components/DiaryPreviewSidebar.svelte';
	import PortalCard from '$lib/components/PortalCard.svelte';
	import { portals } from '$lib/data/portals';
	import { getDiaryEntries, loadDiaryEntries, type DiaryEntry } from '$lib/state/diary';
	import { supabase } from '$lib/supabase';

	let user = $state<{ email?: string; id?: string } | null>(null);
	let loading = $state(true);
	let diaryLoading = $state(false);
	let diaryError = $state('');
	let diaryEntries = $state<DiaryEntry[]>([]);

	$effect(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (!data.session) {
				goto('/login');
				return;
			}

			user = data.session.user;
			void initDiaryPreview(data.session.user.id);
			loading = false;
		});
	});

	async function initDiaryPreview(userId: string) {
		diaryError = '';

		const cachedEntries = getDiaryEntries(userId);
		if (cachedEntries) {
			diaryEntries = cachedEntries;
			return;
		}

		diaryLoading = true;
		try {
			diaryEntries = await loadDiaryEntries(userId);
		} catch (loadError) {
			diaryEntries = [];
			diaryError =
				loadError instanceof Error ? loadError.message : 'Kunde inte hämta dagboksinlägg just nu.';
		} finally {
			diaryLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Min portal – MittPsyke</title>
</svelte:head>

{#if loading}
	<div class="container py-16 text-center opacity-60">Laddar...</div>
{:else if user}
	<section class="container py-12">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
			<div class="lg:col-span-2 text-center">
				<img
					src="/assets/MittPsykeLogo1.png"
					alt="MittPsyke logotyp"
					class="portal-logo"
				/>
				<h1 class="text-3xl font-bold mb-2">
					Välkommen{user.email ? `, ${user.email}` : ''}
				</h1>
				<p class="max-w-xl mx-auto opacity-75 leading-relaxed mb-10">
					MittPsyke möter dig utan dömande, utan krav och utan brådska.
					Här finns inget rätt eller fel sätt att känna, tänka eller uttrycka sig.
				</p>

				<h2 class="text-lg opacity-85 mb-5">Vad vill du fokusera på idag?</h2>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
					{#each portals as portal, i}
						<PortalCard {portal} active={i === 0} />
					{/each}
				</div>

				<div class="mt-6">
					<a
						href="/chat/a"
						class="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-black/12 dark:border-white/12
							bg-white/55 dark:bg-white/5 hover:border-black/22 dark:hover:border-white/22 transition-colors text-sm"
					>
						Eller börja en fri reflektion
					</a>
				</div>

				<div
					class="mt-10 border border-black/10 dark:border-white/10 rounded-2xl p-5 bg-white/45 dark:bg-white/5 text-left"
				>
					<h3 class="font-semibold mb-2.5">Hur MittPsyke ser på psyket</h3>
					<ul class="list-disc pl-5 space-y-2 opacity-85 text-sm">
						<li>Psyket är inte trasigt – det är ofta överbelastat</li>
						<li>Ångest, depression och stress är signaler, inte fel</li>
						<li>Tankar, känslor och kropp hänger samman</li>
						<li>Trygghet och förståelse är ofta första steget mot förändring</li>
					</ul>
				</div>
			</div>

			<DiaryPreviewSidebar entries={diaryEntries} loading={diaryLoading} error={diaryError} />
		</div>
	</section>
{/if}

<style>
	.portal-logo {
		display: block;
		max-width: 160px;
		width: 100%;
		margin: 0 auto 1.25rem;
		opacity: 0.8;
		animation: fadeIn 1.1s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 0.8;
			transform: translateY(0);
		}
	}
</style>
