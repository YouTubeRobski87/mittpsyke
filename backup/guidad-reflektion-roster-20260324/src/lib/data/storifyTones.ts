export type StorifyTone = {
	id: string;
	label: string;
	emoji: string;
	description: string;
};

export const storifyTones: StorifyTone[] = [
	{ id: 'classic', label: 'Klassisk dagbok', emoji: '📔', description: 'Ärlig, personlig och tidlös' },
	{ id: 'storytelling', label: 'Berättare', emoji: '📖', description: 'Som ett kapitel i en roman' },
	{ id: 'philosophical', label: 'Filosof', emoji: '🤔', description: 'Djupa reflektioner och frågor' },
	{ id: 'sportscaster', label: 'Sportkommentator', emoji: '🎙️', description: 'Livet som en sändning' },
	{ id: 'cat-perspective', label: 'Kattperspektiv', emoji: '🐱', description: 'Dagen sedd av en katt' },
	{ id: 'cynical', label: 'Cyniker', emoji: '😏', description: 'Ironisk och avmätt' },
	{ id: 'drama-queen', label: 'Dramaqueen', emoji: '👸', description: 'Allt är en katastrof' },
	{ id: 'meme', label: 'Meme-format', emoji: '😂', description: 'Internetkultur och humor' },
	{ id: 'cringe', label: 'Cringe', emoji: '😬', description: 'Pinsamt och självmedveten' },
	{ id: 'british', label: 'Brittisk underdrift', emoji: '🫖', description: 'Torr humor och "quite nice"' },
	{ id: 'quest-log', label: 'Äventyrsdagbok', emoji: '⚔️', description: 'Dagen som ett spel-uppdrag' },
	{ id: 'bored', label: 'Uttråkad', emoji: '😒', description: 'Meh. Ingenting speciellt.' },
	{ id: 'nature-documentary', label: 'Naturdokumentär', emoji: '🌿', description: 'David Attenborough om vardagen' },
	{ id: 'therapist', label: 'Terapeuttonen', emoji: '🛋️', description: 'Genomarbetad självreflektion' },
	{ id: 'ai-robot', label: 'AI-robot', emoji: '🤖', description: 'Beräknande och databeroende' },
	{ id: 'shakespeare', label: 'Shakespeare', emoji: '🎭', description: 'Elizabetansk dramatik' },
	{ id: 'tabloid', label: 'Lösnummer', emoji: '📰', description: 'Kvällstidningens förstasida' },
	{ id: 'formal', label: 'Formell rapport', emoji: '💼', description: 'Professionell och saklig' },
	{ id: 'troubadour', label: 'Troubadour', emoji: '🎵', description: 'Poetisk och sånglig' },
	{ id: 'nerd', label: 'Nörden', emoji: '🤓', description: 'Detaljer, fakta och sidospår' },
	{ id: 'tinfoil-hat', label: 'Konspirationsteoretiker', emoji: '🕵️', description: 'Allt hänger ihop' },
	{ id: 'self-help', label: 'Självhjälpsboken', emoji: '✨', description: 'Positiv och actiondriven' },
	{ id: 'detective', label: 'Detektiv', emoji: '🔍', description: 'Löser gåtan om din dag' },
	{ id: 'passive-aggressive', label: 'Passivt aggressiv', emoji: '🙂', description: 'Fint, allt är helt fint' },
	{ id: 'melodramatic', label: 'Melodramatisk', emoji: '😭', description: 'Allt är episkt viktigt' },
	{ id: 'chaotic', label: 'Kaotisk', emoji: '🌪️', description: 'Associativt och oförutsägbart' },
	{ id: 'bureaucratic', label: 'Byråkratisk', emoji: '📋', description: 'Formulär och protokoll' },
	{ id: 'overthinker', label: 'Övertänkaren', emoji: '💭', description: 'Analyserar varje litet val' }
];
