<script lang="ts">
	import type { Portal } from '$lib/types';

	let { portal, active = false }: { portal: Portal; active?: boolean } = $props();
</script>

<a
	href="/chat/{portal.key}"
	class="flex gap-3.5 p-4.5 rounded-[var(--radius-card)] border transition-transform hover:-translate-y-px text-left no-underline
		{active
		? 'border-black/28 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'
		: 'border-black/12 hover:border-black/22'}
		bg-white/55 dark:bg-white/5 dark:border-white/12 dark:hover:border-white/22"
>
	<span
		class="w-11 h-11 rounded-full flex items-center justify-center bg-black/6 dark:bg-white/10 text-xl shrink-0"
	>
		{portal.icon}
	</span>
	<span>
		<span class="font-semibold block mb-1.5">{portal.title}</span>
		<span class="opacity-80 leading-snug text-sm">{portal.description}</span>
	</span>
</a>
