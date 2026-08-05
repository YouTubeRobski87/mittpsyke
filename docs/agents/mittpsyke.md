# Agentregler: MittPsyke

Las forst berorda filer, narliggande tester och `AGENTS.md`. Begransa varje andring till minsta sakra omfang, uppdatera relevanta tester och rapportera exakt verifiering respektive kvarvarande osakerheter. Gor aldrig commit eller push utan uttrycklig instruktion.

## Sarskild forsiktighet

- AI-chatt, samtalshistorik, dagbok och AI-genererade sammanfattningar kan innehalla kansliga personuppgifter. Anta aldrig lagring, delning eller samtycke utan att kontrollera implementationen.
- Akut- och sakerhetsfloden ska ha foretrade framfor samtalsbeteende. Andra dem bara med riktade tester och utan att forsamra akuthanvisningar.
- Hall anonym anvandning, inloggade anvandare, sparade samtal och dagbokshistorik tydligt atskilda. Andra inte auth, session eller RLS som en bieffekt av UI- eller promptarbete.
- MittPsyke ar ett stodverktyg, inte vard eller behandling. Anvand ett varmt, tillgangligt och icke-domande sprak utan diagnoser eller garantier.
- Lat inte en UI-kontroll antyda att data raderas, delas eller begransas om implementationen inte faktiskt gor det.

## Verifiering

Kor `npm run check`, `npm run test` och `npm run build` nar andringen beror applikationskod. For UI: kontrollera relevant mobilbredd, horisontell overflow, tangentbord och fokus. For lankar: kontrollera de interna och externa destinationer som andrats.
