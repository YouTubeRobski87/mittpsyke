<script lang="ts">
    import { goto } from '$app/navigation';
    import { getCachedTheme, THEMES } from '$lib/theme';
    
    let answer1 = '';
    let answer2 = '';
    let answer3 = '';
    
    const questions = [
        'Hur känns dagen just nu?',
        'Vad tog mest energi?',
        'Finns något litet som gav lugn?'
    ];
    
    let profileTheme = getCachedTheme();
    $: themeColor = THEMES[profileTheme]?.accent || '#6b8f71';
    
    function submit() {
        const parts = [
            '📝 Snabb check-in',
            '',
            `${questions[0]}`,
            answer1.trim() || '–',
            '',
            `${questions[1]}`,
            answer2.trim() || '–',
            '',
            `${questions[2]}`,
            answer3.trim() || '–'
        ];
        const combined = parts.join('\n');
        goto('/dagbok?prefill=' + encodeURIComponent(combined));
    }
    
    $: canSubmit = answer1.trim() || answer2.trim() || answer3.trim();
</script>

<svelte:head>
    <title>Snabb check-in – MittPsyke</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<main class="checkin-container">
    <h1>Snabb check-in</h1>
    <p class="intro">Tre korta frågor. Det räcker med några ord.</p>
    
    <div class="questions">
        {#each questions as q, i}
            <div class="question-block">
                <label for="q{i}">{q}</label>
                {#if i === 0}
                    <input id="q{i}" type="text" bind:value={answer1} placeholder="Några ord räcker..." />
                {:else if i === 1}
                    <input id="q{i}" type="text" bind:value={answer2} placeholder="Några ord räcker..." />
                {:else}
                    <input id="q{i}" type="text" bind:value={answer3} placeholder="Några ord räcker..." />
                {/if}
            </div>
        {/each}
    </div>
    
    <button class="submit-btn" on:click={submit} disabled={!canSubmit} style="background-color: {themeColor}">
        Spara check-in
    </button>
</main>

<style>
    .checkin-container {
        max-width: 840px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
    }
    h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #1a1a1a;
    }
    .intro {
        color: #666;
        font-size: 0.95rem;
        margin-bottom: 2rem;
    }
    .questions {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .question-block label {
        display: block;
        font-size: 0.95rem;
        font-weight: 500;
        color: #333;
        margin-bottom: 0.4rem;
    }
    .question-block input {
        width: 100%;
        padding: 0.6rem 0;
        border: none;
        border-bottom: 1.5px solid #ddd;
        background: transparent;
        font-size: 1rem;
        color: #1a1a1a;
        outline: none;
        transition: border-color 0.2s;
    }
    .question-block input:focus {
        border-bottom-color: #6b8f71;
    }
    .question-block input::placeholder {
        color: #bbb;
    }
    .submit-btn {
        display: block;
        width: 100%;
        padding: 0.85rem;
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
    }
    .submit-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
    .submit-btn:not(:disabled):hover {
        opacity: 0.9;
    }
    
    @media (prefers-color-scheme: dark) {
        h1 { color: #f0f0f0; }
        .intro { color: #aaa; }
        .question-block label { color: #ddd; }
        .question-block input {
            color: #f0f0f0;
            border-bottom-color: #444;
        }
        .question-block input:focus {
            border-bottom-color: #8fb996;
        }
        .question-block input::placeholder {
            color: #666;
        }
    }
</style>
