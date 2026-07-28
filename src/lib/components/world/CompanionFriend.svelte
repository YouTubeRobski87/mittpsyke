<script lang="ts">
	import { FOX_DEER_RELATIONSHIP, type CompanionRelationshipStage } from '$lib/companionRelationship';
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';

	let {
		stage = 0,
		companionId = 'fox',
		class: className = ''
	}: {
		stage?: CompanionRelationshipStage;
		companionId?: string;
		class?: string;
	} = $props();

	const motion = createMotionAwareness();
	const canRenderFriend = $derived(
		companionId === 'fox' && stage >= 2 && FOX_DEER_RELATIONSHIP.assetsAvailable
	);
</script>

{#if canRenderFriend}
	<!-- Tillgångarna är medvetet feature-flaggade tills riktiga, licensierade
	     rådjurspose-bilder har lagts till. Då ska denna figur vara dekorativ,
	     absolut placerad och använda shore-far/shore-near enligt scensteget. -->
	<span
		class={`companion-friend ${className}`.trim()}
		class:is-paused={!motion.isActive || motion.reducedMotion}
		data-stage={stage}
		aria-hidden="true"
	></span>
{/if}
