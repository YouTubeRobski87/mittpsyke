# Storify - genomförd ändring (redigerbart utkast)

Ni valde "Gör om till redigerbart utkast". Genomfört och skickat till din dator
(`E:\mittpsyke-main`). Inget har committats till git.

## Vad som faktiskt hände innan

Vid granskningen av koden (inte bara rapporten) visade det sig vara värre än
först beskrivet: `generatedEntry` visades som **oredigerbar text** och
`autoSave()` kördes **automatiskt direkt efter generering** - användaren
hann aldrig se eller ändra texten innan den sparades till dagboken. Det är nu
åtgärdat.

## Ändringen

`src/routes/dagars-avtryck/+page.svelte`:

- Generering sparar inte längre automatiskt.
- Resultatet visas i ett redigerbart textfält (`<textarea>`), inte som
  statisk text.
- En rad förklarar tydligt: "Det här är AI:ns tolkning ... det sparas inte
  förrän du själv trycker Spara."
- Ny knapp **"Spara till Mina inlägg"** måste tryckas explicit. Alternativet
  är **"Kasta utkastet och börja om"**.
- Efter sparning blir fältet skrivskyddat (`readonly`) och visar "Sparat ✓"
  som tidigare.
- `docs/AI_GUIDELINES.md` och `docs/ai/inventory.md` uppdaterade så
  Storify-avsnittet beskriver det nya, principenliga beteendet i stället för
  att lista det som en öppen avvikelse.

Inga ändringar i `/api/storify/generate` eller `/api/storify/chat` - de
genererar fortfarande text på samma sätt, bakom samma samtyckesspärr. Bara
vad som händer med texten efter generering är annorlunda.

## Diff: `src/routes/dagars-avtryck/+page.svelte`

```diff
--- /tmp/diffwork/page.orig.svelte	2026-09-18 12:00:47.552808611 +0200
+++ /mnt/user-data/outputs/ai-principle-storify-fix/src/routes/dagars-avtryck/+page.svelte	2026-09-18 11:58:39.497753821 +0200
@@ -78,6 +78,7 @@
 
 	let isSaved = $state(false);
 	let saveError = $state('');
+	let saving = $state(false);
 
 	// --- Inläggslist ---
 
@@ -159,6 +160,7 @@
 		generateError = '';
 		isSaved = false;
 		saveError = '';
+		saving = false;
 	}
 
 	// --- Streaming-chatt ---
@@ -316,19 +318,23 @@
 		generating = false;
 		phase = 'result';
 
-		// Spara automatiskt efter generering
-		await autoSave(token);
+		// Sparas inte automatiskt. Utkastet ska kunna läsas igenom och
+		// redigeras innan användaren själv väljer att spara det - se
+		// docs/AI_GUIDELINES.md ("AI ska inte fylla i dagboken").
 	}
 
-	async function autoSave(existingToken?: string) {
-		const token = existingToken ?? (await getToken());
-		if (!token) {
-			console.error('[autoSave] Ingen token – sessionen har gått ut.');
-			saveError = 'Inlägget genererades men kunde inte sparas eftersom sessionen har gått ut.';
+	async function handleSaveEntry() {
+		saveError = '';
+		if (!generatedEntry.trim()) {
+			saveError = 'Utkastet är tomt – skriv något innan du sparar.';
 			return;
 		}
-		if (!generatedEntry) {
-			console.error('[autoSave] generatedEntry är tomt – inget att spara.');
+
+		saving = true;
+		const token = await getToken();
+		if (!token) {
+			saving = false;
+			saveError = 'Sessionen har gått ut. Ladda om sidan och försök igen.';
 			return;
 		}
 
@@ -347,6 +353,7 @@
 		});
 
 		const resBody = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
+		saving = false;
 
 		if (res.ok) {
 			isSaved = true;
@@ -360,8 +367,8 @@
 			};
 			entries = [newEntry, ...entries];
 		} else {
-			console.error('[autoSave] Misslyckades. Status:', res.status, '| Fel:', resBody.error);
-			saveError = 'Inlägget genererades men kunde inte sparas.';
+			console.error('[handleSaveEntry] Misslyckades. Status:', res.status, '| Fel:', resBody.error);
+			saveError = 'Kunde inte spara inlägget just nu.';
 		}
 	}
 
@@ -614,13 +621,24 @@
 			{:else if phase === 'result'}
 				<section class="auth-panel auth-panel-accent result-panel">
 					<div class="result-header">
-						<p class="entry-kicker">Ditt dagboksinlägg</p>
+						<p class="entry-kicker">AI:ns utkast till dagboksinlägg</p>
 						<span class="tone-badge">{getToneLabel(generatedTone || selectedTone)}</span>
 					</div>
 
-					<div class="entry-text">
-						{generatedEntry}
-					</div>
+					{#if !isSaved}
+						<p class="draft-hint auth-muted">
+							Läs igenom och redigera gärna innan du sparar. Det här är AI:ns tolkning av det
+							du berättade - det sparas inte förrän du själv trycker Spara.
+						</p>
+					{/if}
+
+					<textarea
+						class="entry-textarea"
+						bind:value={generatedEntry}
+						readonly={isSaved}
+						rows={8}
+						aria-label="Utkast till dagboksinlägg, redigerbart innan du sparar"
+					></textarea>
 
 					<div class="result-status">
 						{#if isSaved}
@@ -631,8 +649,17 @@
 					</div>
 
 					<div class="result-actions">
-						<button class="auth-button primary" onclick={resetInterview}>
-							Ny intervju
+						{#if !isSaved}
+							<button
+								class="auth-button primary"
+								onclick={handleSaveEntry}
+								disabled={saving || !generatedEntry.trim()}
+							>
+								{saving ? 'Sparar...' : 'Spara till Mina inlägg'}
+							</button>
+						{/if}
+						<button class="auth-button back-btn" onclick={resetInterview}>
+							{isSaved ? 'Ny intervju' : 'Kasta utkastet och börja om'}
 						</button>
 					</div>
 				</section>
@@ -1051,9 +1078,37 @@
 		color: hsl(var(--muted-foreground));
 	}
 
-	.entry-text {
+	.draft-hint {
+		margin: 0;
+		font-size: 0.85rem;
+		line-height: 1.5;
+	}
+
+	.entry-textarea {
+		width: 100%;
+		min-height: 10rem;
+		padding: 0.75rem 0.9rem;
+		border-radius: var(--radius-input);
+		border: 1px solid hsl(var(--border));
+		background: hsl(var(--surface-muted));
+		color: hsl(var(--foreground));
+		font-family: inherit;
+		font-size: 1rem;
 		line-height: 1.75;
-		white-space: pre-wrap;
+		resize: vertical;
+	}
+
+	.entry-textarea:focus {
+		outline: none;
+		border-color: hsl(var(--muted-foreground) / 0.5);
+	}
+
+	.entry-textarea:read-only {
+		background: transparent;
+		border-color: transparent;
+		padding-left: 0;
+		padding-right: 0;
+		resize: none;
 	}
 
 	.result-status {
```

## Diff: `docs/AI_GUIDELINES.md`

```diff
--- /tmp/diffwork/AI_GUIDELINES.orig.md	2026-09-18 11:59:10.948805025 +0200
+++ /mnt/user-data/outputs/ai-principle-storify-fix/docs/AI_GUIDELINES.md	2026-09-18 11:58:39.500691192 +0200
@@ -112,16 +112,18 @@
 `src/routes/sa-fungerar-mittpsyke/+page.svelte` ("Chatten – ett valfritt
 AI-verktyg"). Ny copy om chatten ska hålla samma linje.
 
-## Känd avvikelse
+## Storify - AI-utkast, inte automatiskt sparat
 
-`src/routes/api/storify/generate` och `src/routes/api/storify/chat`
-(ytan `src/routes/dagars-avtryck/`) låter AI skriva ett fullständigt
-dagboksinlägg åt användaren - antingen direkt från en kort beskrivning, eller
-från en AI-ledd intervju. Det är produktens tydligaste exempel på precis det
-den här principen säger att AI inte ska göra ("fylla i dagboken",
-"generera känslor eller reflektioner åt användaren"). Funktionen är
-konsekvent samtyckesskyddad och väl testad, så det är ett medvetet byggt
-flöde, inte en glidning - men den behöver ett uttryckligt produktbeslut
-(behålla, göra om till ett redigerbart utkast, eller ta bort) innan den kan
-sägas följa principen ovan. Se `docs/ai/inventory.md` för fler tekniska
-detaljer.
+`src/routes/api/storify/generate` och `src/routes/api/storify/chat` (ytan
+`src/routes/dagars-avtryck/`) låter AI skriva ett förslag till
+dagboksinlägg - antingen direkt från en kort beskrivning, eller från en
+AI-ledd intervju. Det var produktens tydligaste exempel på precis det den
+här principen säger att AI inte ska göra, så 2026-09-18 togs ett uttryckligt
+produktbeslut: resultatet visas som ett redigerbart utkast och sparas
+aldrig automatiskt. Användaren läser, redigerar vid behov och trycker själv
+på "Spara till Mina inlägg" innan något hamnar i dagboken - annars går det
+bara att kasta utkastet (`src/routes/dagars-avtryck/+page.svelte`,
+`handleSaveEntry`). Funktionen är fortsatt samtyckesskyddad. Det gör
+Storify till exempel (3) i den tredelade distinktionen ovan - en
+AI-tolkning som användaren själv godkänner - i stället för AI som fyller i
+dagboken åt någon. Se `docs/ai/inventory.md` för tekniska detaljer.
```

## Diff: `docs/ai/inventory.md`

```diff
--- /tmp/diffwork/inventory.orig.md	2026-09-18 11:59:29.980491925 +0200
+++ /mnt/user-data/outputs/ai-principle-storify-fix/docs/ai/inventory.md	2026-09-18 11:58:39.555701679 +0200
@@ -18,7 +18,7 @@
 | Daglig fraga | `src/lib/server/daily-question.ts`, `src/routes/api/daily-question/` | Begransad dagboks- och maendekontext; har eget krisskydd. | Visas i check-in. | Verifierat: krissignal hanteras utan vanlig fraga. |
 | Spegelvattnet | `src/lib/server/spegelvattnet.ts`, `src/routes/api/spegelvattnet/` | Historik for den funktionen. | Funktionsspecifik UI. | Behover separat UX-granskning for AI-markning och radering. |
 | Berattelser | `src/routes/api/stories/submit/+server.ts` | Inskickad berattelsetext. | Anvandaren initierar inskick. | Verifierad AI-anropplats; publicerings-/moderationsflode bor granskas separat. |
-| Storify | `src/routes/api/storify/chat/+server.ts`, `generate/+server.ts` | Funktionsspecifik samtalstext. | Separat flode. | Behover separat produktagarskap innan integritetscopy andras. **Avviker aven fran `docs/AI_GUIDELINES.md`:** AI skriver ett fullstandigt dagboksinlagg at anvandaren (bade i snabblage och efter AI-intervju) - precis det principen sager att AI inte ska gora. Kraver ett produktbeslut, se AI_GUIDELINES.md. |
+| Storify | `src/routes/api/storify/chat/+server.ts`, `generate/+server.ts`, `src/routes/dagars-avtryck/+page.svelte` | Funktionsspecifik samtalstext. | Separat flode. | Behover separat produktagarskap innan integritetscopy andras. Uppdaterad 2026-09-18 for att folja `docs/AI_GUIDELINES.md`: AI-texten sparas inte langre automatiskt efter generering - anvandaren ser ett redigerbart utkast i `dagars-avtryck/+page.svelte` och maste sjalv trycka "Spara till Mina inlagg" (`handleSaveEntry`) innan nagot hamnar i dagboken. |
 | Sok och indexering | `src/routes/api/search/+server.ts`, `api/cron/reindex-search/+server.ts` | Sokfragor respektive publicerat innehall. | Sok ar en tydlig anvandarinitierad funktion. | Inte en personlig AI-yta; embeddings anvands. |
 | Admin- och integrationsfunktioner | `src/routes/admin/+page.server.ts`, `src/lib/server/ai/anthropic.ts`, `api/horoscope/+server.ts` | Varierar per funktion. | Inte fullt inventerade som anvandarytor i denna andring. | Osakerhet tydligt markerad; kravs riktad kartlaggning innan copy eller dataflode andras. |
 
```

## Verifiering

Jag kan fortfarande inte köra kommandon på din dator härifrån. Kör i
E:\mittpsyke-main:

```
npm run check
npm run test
npm run build
git diff --check
git diff --stat
git status
```

Testa också manuellt i utvecklingsläge: gå igenom Storify-flödet
(`/dagars-avtryck`), skapa ett inlägg, kontrollera att det INTE dyker upp i
"Mina inlägg" förrän du trycker "Spara till Mina inlägg", och att du kan
redigera texten i fältet innan du sparar.

Inget har committats eller pushats - det gör ni själva när ni är nöjda.
