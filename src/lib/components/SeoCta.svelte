<script lang="ts">
	let { chatPath, toneLabel = 'Stod' } = $props<{ chatPath: string; toneLabel?: string }>();

	const hasDiary = true;
	const hasLogin = true;

	const diaryHref = hasLogin ? '/login' : '/dagbok';
	const diaryLabel = hasLogin ? 'Logga in for dagboken' : 'Skriv i dagboken';
</script>

<aside class="mt-8 rounded-[14px] border border-black/10 bg-teal-50/60 p-5 dark:border-white/10 dark:bg-teal-950/20">
	<h2 class="text-xl font-semibold leading-tight">Vill du reda ut tankarna i lugn och ro?</h2>
	<p class="mt-2 text-sm opacity-80">
		Du kan prata anonymt och fa hjalp att sortera det som kanns svart.
	</p>
	<p class="mt-1 text-xs opacity-65">Inriktning: {toneLabel}</p>
	<nav aria-label="Stodval" class="mt-4 flex flex-wrap gap-3 text-sm">
		<a
			class="rounded-full border border-teal-700/25 bg-white px-4 py-2 font-medium text-teal-800 transition-opacity hover:opacity-90 dark:border-teal-300/30 dark:bg-transparent dark:text-teal-200"
			href={chatPath}
		>
			Starta ett samtal &rarr;
		</a>
		{#if hasDiary}
			<a class="rounded-full border border-black/15 px-4 py-2 hover:underline dark:border-white/20" href={diaryHref}>
				{diaryLabel}
			</a>
		{/if}
	</nav>
</aside>
