<script lang="ts">
	let { chatPath } = $props<{ chatPath: '/chat/a' | '/chat/b' | '/chat/e' }>();
</script>

<aside class="seo-cta">
	<h2>Vill du prata vidare?</h2>
	<p>Du kan starta en chatt direkt for fortsatt stod.</p>
	<a href={chatPath}>Starta chatt</a>
</aside>

<style>
	.seo-cta {
		margin-top: 2rem;
		padding: 1rem;
		border: 1px solid #d0d7de;
		border-radius: 0.75rem;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	p {
		margin: 0.5rem 0 0;
	}

	a {
		display: inline-block;
		margin-top: 0.75rem;
		font-weight: 600;
		text-decoration: underline;
	}
</style>
