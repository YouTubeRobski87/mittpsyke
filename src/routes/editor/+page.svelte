<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
</script>

<SEO canonical="https://mittpsyke.se/editor" />

<svelte:head>

<title>Editor | MittPsyke</title>
</svelte:head>

<section class="editor-placeholder">

<div class="editor-placeholder__inner">


<p class="editor-placeholder__eyebrow">Tillfälligt avstängd</p>


<h1>Den här sidan är inte aktiv i MittPsyke</h1>


<p class="editor-placeholder__text">



Den importerade editor-vyn är avstängd så att projektet kan bygga rent igen.


</p>


<a class="editor-placeholder__link" href="/dagbok">Gå till dagbok</a>

</div>
</section>

<style>

.editor-placeholder {


min-height: 70vh;


display: grid;


place-items: center;


padding: 2rem;

}


.editor-placeholder__inner {


width: min(100%, 42rem);


padding: 2rem;


border: 1px solid hsl(var(--border));


border-radius: var(--radius-card);


background: hsl(var(--surface));


text-align: center;


display: grid;


gap: 0.9rem;

}


.editor-placeholder__eyebrow {


margin: 0;


font-size: 0.78rem;


font-weight: 700;


letter-spacing: 0.12em;


text-transform: uppercase;


color: hsl(var(--muted-foreground));

}


h1 {


margin: 0;


font-size: clamp(1.6rem, 1.2rem + 1vw, 2.2rem);

}


.editor-placeholder__text {


margin: 0;


color: hsl(var(--muted-foreground));


line-height: 1.7;

}


.editor-placeholder__link {


justify-self: center;


padding: 0.8rem 1.1rem;


border-radius: var(--radius-pill);


background: hsl(var(--primary));


color: hsl(var(--primary-foreground));


text-decoration: none;


font-weight: 600;

}
</style>
