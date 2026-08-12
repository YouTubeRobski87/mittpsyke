// Säkerhetssvaren som visas i stället för ett AI-svar när krisord upptäcks.
//
// Ligger bredvid crisis-keywords som delad källa, och separat från
// +server.ts så att de går att regressionstesta.
//
// VIKTIGT: ren text, aldrig markdown.
// ChatWindow renderar meddelanden med `{line}` per rad utan markdown-parser,
// så `**Ring 112**` visas bokstavligt med asterisker. Det inträffade i den här
// texten, alltså den viktigaste texten i hela produkten, i det ögonblick
// användaren har det som sämst. Formatering hör hemma i gränssnittet, inte i
// strängen. Se crisis-responses.test.ts.

export const CRISIS_RESPONSE = `Det du skriver rör mig, och jag vill att du vet att du inte är ensam just nu.

Det här är inte rätt plats för akut hjälp – men det finns människor som kan vara där för dig:

Ring 112 om du befinner dig i omedelbar fara.

Mind Självmordslinjen – ring 90101, öppen dygnet runt.

1177 – för råd och vägledning om psykisk hälsa och vård.

Stödlinjer.se – lista över fler stödlinjer och chattar.

Jag finns kvar här om du vill prata vidare, men vid akut kris är en riktig människa viktigast just nu.`;

export const THIRD_PARTY_RISK_RESPONSE = `Det du skriver är viktigt och behöver tas på allvar. Du ska inte behöva vara ensam i det. Om du eller någon annan är i fara just nu är rätt hjälp direkt viktigast.

Ring 112 om faran är omedelbar.

Om det känns svårt att hålla kontrollen kan det hjälpa att genast prata med en människa utanför situationen – en vän, anhörig eller vården via 1177.

Stödlinjer.se – lista över fler stödlinjer och chattar.

Jag finns kvar här om du vill prata vidare, men vid risk för någons säkerhet är 112 och professionell hjälp viktigast just nu.`;
