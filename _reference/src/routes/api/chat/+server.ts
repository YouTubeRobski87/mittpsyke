import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import type { UserProfile } from '$lib/stores/wizard.svelte';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { buildInterviewerPrompt } from '$lib/data/chatbotPrompt';
import { validateChatMessages, type ChatMessagePayload } from '$lib/validation';
import { sanitizeString } from '$lib/validation/sanitizers';
import { checkChatRateLimit, getClientIdentifier } from '$lib/validation/ratelimit';

// CORS headers for Capacitor native app
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders });
};

const client = new Anthropic({
	apiKey: ANTHROPIC_API_KEY
});

const MODEL = 'claude-sonnet-4-5-20250929';

interface ChatRequestBody {
	messages: ChatMessagePayload[];
	profile: UserProfile;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// 1. Rate limiting
		const clientId = getClientIdentifier(request);
		const rateLimitResult = await checkChatRateLimit(`chat:${clientId}`);

		if (!rateLimitResult.success) {
			return new Response(
				JSON.stringify({
					error: 'Du har nått gränsen för antal meddelanden. Försök igen senare.'
				}),
				{
					status: 429,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
						'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
					}
				}
			);
		}

		// 2. Parse request body
		let body: ChatRequestBody;
		try {
			body = await request.json();
		} catch {
			return new Response(JSON.stringify({ error: 'Ogiltig JSON.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const { messages, profile } = body;

		if (!messages || !profile) {
			return new Response(JSON.stringify({ error: 'Meddelanden och profil krävs.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// 3. Sanitize user messages
		const sanitizedMessages: ChatMessagePayload[] = messages.map((msg) => ({
			role: msg.role,
			content: msg.role === 'user' ? sanitizeString(msg.content) : msg.content
		}));

		// 4. Validate messages
		const validation = validateChatMessages(sanitizedMessages);
		if (!validation.valid) {
			return new Response(JSON.stringify({ error: validation.error }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// 5. Build system prompt (with wrap-up instruction near limit)
		let systemPrompt = buildInterviewerPrompt(profile);

		if (sanitizedMessages.length >= 34) {
			// Very close to limit (2-3 messages left) - explicit wrap-up
			systemPrompt += `\n\nVIKTIGT — SAMTALET NÄRMAR SIG SLUTET:
Ni har bara några meddelanden kvar. Ställ en naturlig avslutande fråga som "Finns det något mer du vill ha med?" eller "Något du inte vill glömma från idag?" och förberedd användaren på att det snart är dags att runda av och skapa dagboken.`;
		} else if (sanitizedMessages.length >= 30) {
			// Approaching limit (6-7 messages left) - gentle nudge toward wrapping up
			systemPrompt += `\n\nVIKTIGT — SAMTALET BÖRJAR NÄRMA SIG SLUTET:
Intervjun har pågått ett tag. Börja sakta styra mot en naturlig avrundning. Du kan nämna detta subtilt, t.ex. "Vi börjar närma oss slutet — finns det något mer från idag du vill ta med?" Fortsätt vara nyfiken, men fokusera på att fånga de sista viktiga detaljerna.`;
		}

		// 6. Format messages for Anthropic API
		const anthropicMessages = sanitizedMessages.map((msg) => ({
			role: msg.role as 'user' | 'assistant',
			content: msg.content
		}));

		// 7. Stream response via SSE
		const stream = client.messages.stream({
			model: MODEL,
			max_tokens: 512,
			system: systemPrompt,
			messages: anthropicMessages
		});

		const encoder = new TextEncoder();

		const readable = new ReadableStream({
			async start(controller) {
				try {
					for await (const event of stream) {
						if (
							event.type === 'content_block_delta' &&
							event.delta.type === 'text_delta'
						) {
							const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
							controller.enqueue(encoder.encode(data));
						}
					}

					// Signal stream completion
					controller.enqueue(encoder.encode('data: [DONE]\n\n'));
					controller.close();
				} catch (error) {
					console.error('Stream error:', error);
					const errorData = `data: ${JSON.stringify({ error: 'Strömningen avbröts.' })}\n\n`;
					controller.enqueue(encoder.encode(errorData));
					controller.close();
				}
			}
		});

		return new Response(readable, {
			headers: {
				...corsHeaders,
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Chat endpoint error:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Ett oväntat fel uppstod.'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
};
