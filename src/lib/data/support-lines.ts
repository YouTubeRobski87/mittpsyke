export type SupportLine = {
	slug: string;
	title: string;
	description: string;
	url: string;
};

// Håll medvetet i synk med CRISIS_RESPONSE i src/routes/api/chat/+server.ts -
// samma fyra, redan vetta stödlinjer, inte en egen källa att hålla uppdaterad separat.
export const supportLines: SupportLine[] = [
	{
		slug: '112',
		title: '112 – SOS Alarm',
		description:
			'Ring 112 om du eller någon annan befinner sig i omedelbar fara eller akut kris.',
		url: 'tel:112'
	},
	{
		slug: 'mind-sjalvmordslinjen',
		title: 'Mind Självmordslinjen',
		description:
			'Ring 90101, öppen dygnet runt, för dig som har tankar på självmord eller är orolig för någon annan.',
		url: 'tel:90101'
	},
	{
		slug: '1177',
		title: '1177 Vårdguiden',
		description:
			'Råd och vägledning om psykisk hälsa och vård, och hjälp att hitta rätt vårdinstans.',
		url: 'https://www.1177.se/'
	},
	{
		slug: 'stodlinjer-se',
		title: 'Stödlinjer.se',
		description: 'Samlad lista över fler stödlinjer och chattar för olika typer av psykisk ohälsa.',
		url: 'https://stodlinjer.se/'
	}
];
