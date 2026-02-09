export interface Portal {
	key: string;
	title: string;
	description: string;
	icon: string;
	category: string;
}

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}
