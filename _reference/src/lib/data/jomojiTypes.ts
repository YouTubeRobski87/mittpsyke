export type Jomoji = {
	id: string;
	name: string;
	svg: string;
};

export type JomojiCategory = {
	name: string;
	icon: string;
	emojis: Jomoji[];
};
