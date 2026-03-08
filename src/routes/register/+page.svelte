<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Registrera – MittPsyke</title>
</svelte:head>

<section class="container max-w-sm py-16">
	<h1 class="text-2xl font-bold text-center mb-6">Skapa konto</h1>

	<form method="POST" class="space-y-4">
		<input
			type="email"
			name="email"
			placeholder="E-post"
			required
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
		/>
		<input
			type="password"
			name="password"
			placeholder="Lösenord"
			required
			minlength={6}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
		/>

		{#if form?.error}
			<p class="text-red-500 text-sm">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium transition-opacity"
		>
			Registrera
		</button>
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Har du redan ett konto? <a href="/login" class="underline">Logga in</a>
	</p>
</section>
