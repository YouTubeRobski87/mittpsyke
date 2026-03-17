<script lang="ts">
	export let user: any = null;

	$: displayName = user?.user_metadata?.full_name || user?.email || 'vän';
</script>

<section class="mb-6">
	<h1 class="text-2xl font-semibold">Hej {displayName}</h1>
	<p class="mt-2 text-neutral-600">Här är en lugn översikt över dina nästa steg.</p>
</section>
