// En gemensam beskrivning av vad MittPsyke är, så att sökmotorer och AI-tjänster
// möter samma ord på varje nyckelsida. Texten får bara säga sådant som stämmer i
// koden: inga streaks (vaktas av no-streak-pressure.test.ts), inga poäng och att
// inget nollställs. Den säger med flit ingenting om påminnelser, eftersom
// utskick kan finnas (se /avregistrera), och inget medicinskt.

export const POSITIONING_TERM = 'kravlös digital dagbok';

export const positioningCopy = {
	/** Kärnmeningen. Används nästan ordagrant i "I korthet"-rutorna. */
	core:
		'MittPsyke är en kravlös digital dagbok på svenska. Du skriver i din egen takt, och med tiden visar MittPsyke vad som återkommer i dina egna ord. Det finns inga streaks eller poäng, och ingenting börjar om om du har varit borta.',
	/** Avgränsningen ska alltid stå nära kärnmeningen. */
	boundary:
		'MittPsyke är inte vård eller akuthjälp. Vid akut fara, ring 112. Behöver du prata med någon, ring Självmordslinjen på 90101.',
	/** Kort beskrivning för strukturerad data (Organization, WebApplication). */
	structuredData:
		'Kravlös digital dagbok på svenska för självreflektion: skriv i din egen takt och se vad som återkommer i dina egna ord. Med valfri AI-chatt. Inte vård.'
} as const;
