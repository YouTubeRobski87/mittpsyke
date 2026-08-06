# Agentregler: MittPsyke

Las forst berorda filer, narliggande tester och `AGENTS.md`. Begransa varje andring till minsta sakra omfang, uppdatera relevanta tester och rapportera exakt verifiering respektive kvarvarande osakerheter. Gor aldrig commit eller push utan uttrycklig instruktion.

## Sarskild forsiktighet

- AI-chatt, samtalshistorik, dagbok och AI-genererade sammanfattningar kan innehalla kansliga personuppgifter. Anta aldrig lagring, delning eller samtycke utan att kontrollera implementationen.
- Akut- och sakerhetsfloden ska ha foretrade framfor samtalsbeteende. Andra dem bara med riktade tester och utan att forsamra akuthanvisningar.
- Hall anonym anvandning, inloggade anvandare, sparade samtal och dagbokshistorik tydligt atskilda. Andra inte auth, session eller RLS som en bieffekt av UI- eller promptarbete.
- MittPsyke ar ett stodverktyg, inte vard eller behandling. Anvand ett varmt, tillgangligt och icke-domande sprak utan diagnoser eller garantier.
- Lat inte en UI-kontroll antyda att data raderas, delas eller begransas om implementationen inte faktiskt gor det.
- Ny eller andrad AI-produktlogik ska anvanda det gemensamma serverlagret i `src/lib/server/ai/`; anropa inte en provider-SDK direkt fran en route eller komponent.
- Anvand delade sakerhetsinstruktioner. Krisflodet ska alltid ga fore modellens svar och skyddet mot upprepat bekräftelsesökande ska behallas.
- Logga eller tracka inte kanslig fri text, promptar, samtal eller dagboksinnehall. Testa modell- eller providerbyte med mockad adapter innan produktionsanrop.
- AI-forslag som kan skriva, radera, publicera eller dela data ska folja foresla -> validera -> anvandaren godkanner -> utfor. Godkannandet ar separat och inga destruktiva eller publicerande atgarder far auto-godkannas.
- Granska databehandlingsavtal, region och loggning innan en ny AI-provider far behandla kansligt innehall. Mark AI-genererat innehall tydligt dar det visas.

## Verifiering

Kor `npm run check`, `npm run test` och `npm run build` nar andringen beror applikationskod. For UI: kontrollera relevant mobilbredd, horisontell overflow, tangentbord och fokus. For lankar: kontrollera de interna och externa destinationer som andrats.
