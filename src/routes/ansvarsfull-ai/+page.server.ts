import { getAIModelConfiguration } from '$lib/server/ai/text-generation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	supportChatModel: getAIModelConfiguration('support-chat').model
});
