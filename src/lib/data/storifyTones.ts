export type StorifyTone = {
	id: string;
	label: string;
	emoji: string;
	description: string;
};

export const storifyTones: StorifyTone[] = [
	{ id: 'classic', label: 'Klassisk dagbok', emoji: '📔', description: 'Traditionell dagbok i lugn ton' },
	{ id: 'storytelling', label: 'Berättaren', emoji: '📖', description: 'Låter dagen ta form som en berättelse' },
	{ id: 'philosophical', label: 'Filosofen', emoji: '🤔', description: 'Ställer lugna frågor och söker betydelsen bakom dagen' },
	{ id: 'sportscaster', label: 'Sportkommentator', emoji: '🎙️', description: 'Livet som en sändning' },
	{ id: 'cat-perspective', label: 'Kattperspektiv', emoji: '🐱', description: 'Dagen sedd av en katt' },
	{ id: 'cynical', label: 'Cyniker', emoji: '😏', description: 'Ironisk och avmätt' },
	{ id: 'drama-queen', label: 'Dramaqueen', emoji: '👸', description: 'Allt är en katastrof' },
	{ id: 'meme', label: 'Meme-format', emoji: '😂', description: 'Internetkultur och humor' },
	{ id: 'cringe', label: 'Cringe', emoji: '😬', description: 'Pinsamt och självmedvetet' },
	{ id: 'british', label: 'Brittisk underdrift', emoji: '🫖', description: 'Torr humor och stillsam distans' },
	{ id: 'quest-log', label: 'Quest log', emoji: '🎮', description: 'Gör vardagen till ett uppdrag med quests, XP och små vinster' },
	{ id: 'bored', label: 'Uttråkad', emoji: '🥱', description: 'Minimal entusiasm, maximal vardagskänsla' },
	{ id: 'nature-documentary', label: 'Naturdokumentär', emoji: '🌿', description: 'David Attenborough om vardagen' },
	{ id: 'therapist', label: 'Psykologen', emoji: '🧠', description: 'Varsam, tydlig och varm när du vill sortera tankar' },
	{ id: 'ai-robot', label: 'AI-robot', emoji: '🤖', description: 'Beräknande och databeroende' },
	{ id: 'shakespeare', label: 'Shakespeare', emoji: '🎭', description: 'Elisabetansk dramatik' },
	{ id: 'tabloid', label: 'Lösnummer', emoji: '📰', description: 'Kvällstidningens förstasida' },
	{ id: 'formal', label: 'Formell rapport', emoji: '💼', description: 'Professionell och saklig' },
	{ id: 'troubadour', label: 'Troubadour', emoji: '🎵', description: 'Poetisk och sånglig' },
	{ id: 'nerd', label: 'Nörden', emoji: '🤓', description: 'Detaljer, fakta och sidospår' },
	{ id: 'tinfoil-hat', label: 'Konspirationsteoretiker', emoji: '🕵️', description: 'Allt hänger ihop' },
	{ id: 'self-help', label: 'Livscoach', emoji: '✨', description: 'Uppmuntrande och framåtriktad' },
	{ id: 'detective', label: 'Detektiv', emoji: '🔍', description: 'Löser gåtan om din dag' },
	{ id: 'passive-aggressive', label: 'Passivt aggressiv', emoji: '🙂', description: 'Fint, allt är helt fint' },
	{ id: 'melodramatic', label: 'Melodramatisk', emoji: '😭', description: 'Allt är episkt viktigt' },
	{ id: 'chaotic', label: 'Kaotisk', emoji: '🌪️', description: 'Associativt och oförutsägbart' },
	{ id: 'bureaucratic', label: 'Byråkratisk', emoji: '📋', description: 'Formulär och protokoll' },
	{ id: 'overthinker', label: 'Grubblaren', emoji: '🌀', description: 'Följer varje detalj och hjälper dig stanna i det du fastnat i' }
];

export const activeStorifyToneIds = [
	'philosophical',
	'therapist',
	'overthinker',
	'quest-log',
	'classic',
	'sportscaster',
	'ai-robot',
	'self-help',
	'cynical'
] as const;

export const activeStorifyTones: StorifyTone[] = activeStorifyToneIds
	.map((id) => storifyTones.find((tone) => tone.id === id))
	.filter((tone): tone is StorifyTone => Boolean(tone));
