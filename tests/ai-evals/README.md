# AI Evaluation Suite

Alla scenarier är syntetiska och anonymiserade. De innehåller aldrig användares fria text, identiteter eller produktionsdata.

Kör hela sviten lokalt:

```sh
npm run ai:eval
```

Kör ett enskilt scenario:

```sh
npx vitest run tests/ai-evals/eval-suite.test.ts --testNamePattern="crisis-cannot-cope"
```

CI använder golden responses för en deterministisk regression-kontroll och skapar alltid `artifacts/ai-evaluation-report.md`. Vid modell- eller promptutvärdering ska samma `runAiEvaluations` anropas med en explicit, mockad adapter som returnerar kandidatens svar. Ingen testkörning får skicka känslig fritext till en provider. Ett svar under 90 %, en säkerhetsspärr eller en försämring jämfört med golden response ger FAIL.

Nya scenarier läggs som objekt i någon av JSON-filerna. Runnern och bedömarna behöver inte ändras.
