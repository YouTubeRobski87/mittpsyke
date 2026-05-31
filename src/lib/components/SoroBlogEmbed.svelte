<script lang="ts">
	import { onMount } from 'svelte';
	import { SORO_EMBED_SRC } from '$lib/soro';

	const containerId = 'soro-blog';
	const scriptId = 'soro-blog-embed-script';

	onMount(() => {
		const container = document.getElementById(containerId);
		container?.replaceChildren();
		document.getElementById(scriptId)?.remove();

		const script = document.createElement('script');
		script.id = scriptId;
		script.src = SORO_EMBED_SRC;
		script.defer = true;
		document.body.appendChild(script);

		return () => {
			script.remove();
		};
	});
</script>

<div id={containerId} class="soro-blog-embed">
	<p>Artiklarna laddas.</p>
</div>

<style>
	.soro-blog-embed {
		min-height: 320px;
	}

	.soro-blog-embed p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.78;
	}
</style>
