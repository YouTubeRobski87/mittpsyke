<script lang="ts">
	export let user: any = null;
	export let greetingName = '';

	function clean(value: unknown): string {
		if (typeof value !== 'string') return '';
		const trimmed = value.trim();
		if (!trimmed) return '';
		if (trimmed.includes('@')) return '';
		return trimmed;
	}

	$: displayName =
		clean(greetingName) ||
		clean(user?.user_metadata?.display_name) ||
		clean(user?.user_metadata?.full_name) ||
		clean(user?.user_metadata?.name) ||
		'igen';
</script>

<section>
	<h2 class="text-xl font-semibold">Hej {displayName}</h2>
	<p class="mt-2 auth-muted">Här är en lugn översikt över dina nästa steg.</p>
</section>
