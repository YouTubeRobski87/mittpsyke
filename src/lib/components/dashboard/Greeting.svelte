<script lang="ts">
	export let user: any = null;

	function clean(value: unknown): string {
		return typeof value === 'string' ? value.trim() : '';
	}

	$: displayName =
		clean(user?.user_metadata?.display_name) ||
		clean(user?.user_metadata?.full_name) ||
		clean(user?.user_metadata?.name) ||
		'igen';
</script>

<section>
	<h2 class="text-xl font-semibold">Hej {displayName}</h2>
	<p class="mt-2 auth-muted">Här är en lugn översikt över dina nästa steg.</p>
</section>
