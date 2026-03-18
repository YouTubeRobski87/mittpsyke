<script lang="ts">
	export let user: any = null;

	$: displayName = user?.user_metadata?.full_name || user?.email || 'vän';
</script>

<section>
	<h2 class="text-xl font-semibold">Hej {displayName}</h2>
	<p class="mt-2 auth-muted">Här är en lugn översikt över dina nästa steg.</p>
</section>
