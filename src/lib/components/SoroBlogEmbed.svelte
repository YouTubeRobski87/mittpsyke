<script lang="ts">
	import { onMount } from 'svelte';
	import { SORO_EMBED_SRC } from '$lib/soro';

	type Props = {
		containerId?: string;
		embedSrc?: string;
	};

	let { containerId = 'soro-blog', embedSrc = SORO_EMBED_SRC }: Props = $props();

	onMount(() => {
		const scriptId = `${containerId}-embed-script`;
		const container = document.getElementById(containerId);
		container?.replaceChildren();
		document.getElementById(scriptId)?.remove();

		const script = document.createElement('script');
		script.id = scriptId;
		script.src = embedSrc;
		script.defer = true;
		document.body.appendChild(script);

		return () => {
			script.remove();
		};
	});
</script>

<div id={containerId} class="soro-blog-embed"></div>

<style>
	.soro-blog-embed {
		min-height: 260px;
	}
</style>
