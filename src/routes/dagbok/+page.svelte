<script lang="ts">
	import DiaryPage from '../dagars-avtryck/+page.svelte';

	let { data } = $props();
</script>

<DiaryPage {data} />
