/**
 * Användarsynlig, verifierad information om var innehåll finns i MittPsyke.
 *
 * Håll denna liten och använd den där samma uppgift upprepas. Den beskriver
 * bara appens egen lagring och överföring; en extern leverantörs retention
 * konfigureras inte här.
 */
export const dataflowCopy = {
	anonymousDiary: {
		storage:
			'När lokal lagring är tillgänglig sparas texten som ett lokalt utkast i den här webbläsaren tills du rensar det eller lagringen töms.',
		transfer:
			'Medan du skriver skickas den inte till MittPsyke, Supabase eller OpenAI.',
		short:
			'Texten du skriver stannar i den här webbläsaren och skickas inte till MittPsyke eller OpenAI. Inget konto krävs.'
	},
	guestChat: {
		retention:
			'MittPsyke sparar inte gästchattens text i Supabase eller i webbläsarens lokala lagring. Den finns bara i den öppna chattvyn och försvinner när du laddar om sidan eller lämnar chatten.',
		aiTransfer:
			'När du skickar ett meddelande skickas det och den begränsade samtalskontexten till OpenAI för att ett svar ska kunna skapas.'
	},
	accountChat: {
		storage:
			'När du är inloggad sparas chattmeddelanden i Supabase. En kortare återupptagningshistorik kan också finnas lokalt i din webbläsare.',
		retention:
			'Databasinnehållet tas bort när du raderar kontot. Rensa historik rensar bara återupptagningshistoriken, inte den sparade konversationen.'
	},
	savedDiary: {
		storage:
			'Sparade dagbokstexter lagras i Supabase tills du raderar inlägget eller kontot.',
		aiTransfer:
			'Din sparade dagbokstext skickas till en namngiven AI-leverantör först när du aktivt använder en AI-funktion och har gett samtycke för den behandlingen.'
	},
	providerRetention:
		'MittPsyke sätter ingen egen lagringstid hos OpenAI. Hur länge leverantören behåller det som skickas via deras API styrs av OpenAI:s egna villkor.'
} as const;
