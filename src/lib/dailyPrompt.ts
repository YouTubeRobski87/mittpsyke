// Dagliga reflektionsfrågor — roterar deterministiskt per datum
// Alla användare ser samma fråga samma dag (ingen backend behövs)

export const DAILY_PROMPTS = [
	'Vad snurrar i huvudet just nu?',
	'Vad gav dig lite lugn idag?',
	'Vad tog mest energi idag?',
	'Vad behöver du just nu?',
	'Vad var lite lättare idag?',
	'Vad bar du på idag som du vill lägga ner en stund?',
	'Vad skulle du vilja göra mer av?',
	'Vad fick dig att andas ut idag?',
	'Vad är du glad att du klarade av idag?',
	'Hur behandlade du dig själv idag?',
	'Vad ville du egentligen säga men höll inne med?',
	'Vad kändes tungt idag?',
	'Vad gav dig en liten stund av frihet?',
	'Vad är du tacksam för just nu, hur liten det än är?',
	'Vad vill du lämna bakom dig idag?',
	'Vad behöver du höra just nu?',
	'Vad är du nyfiken på i ditt eget liv?',
	'Vad fick dig att stanna upp idag?',
	'Vad bar du på idag som ingen annan visste om?',
	'Vad skulle framtida du tacka dig för idag?',
	'Vad vill du ge dig själv tillåtelse att känna?',
	'Vad är du inte färdig med att bearbeta än?',
	'Vad fick dig att le, om än kort, idag?',
	'Hur mår kroppen just nu — inte tankarna, utan kroppen?'
];

// Deterministisk hash av datumet — alla ser samma prompt varje dag
function hashDate(dateStr: string): number {
	let hash = 0;
	for (let i = 0; i < dateStr.length; i++) {
		hash = (hash * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
	}
	return Math.abs(hash);
}

export function getDailyPrompt(): string {
	const today = new Date().toDateString(); // e.g. "Mon Mar 15 2026"
	const index = hashDate(today) % DAILY_PROMPTS.length;
	return DAILY_PROMPTS[index];
}
