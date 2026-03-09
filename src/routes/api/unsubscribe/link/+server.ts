import { json } from '@sveltejs/kit';
import { buildUnsubscribeUrl, createUnsubscribeToken } from '$lib/server/unsubscribe';
import type { RequestHandler } from './$types';

type LinkRequestBody = {
	emailType?: string;
};

function parseBody(input: unknown): LinkRequestBody {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return {};
	}

	const candidate = input as Partial<LinkRequestBody>;
	return {
		emailType: typeof candidate.emailType === 'string' ? candidate.emailType : undefined
	};
}

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		return json({ success: false, error: 'Unauthorized.' }, { status: 401 });
	}

	let parsedBody: unknown = null;
	try {
		parsedBody = await request.json();
	} catch {
		parsedBody = null;
	}
	const { emailType } = parseBody(parsedBody);

	try {
		const token = createUnsubscribeToken({
			userId: user.id,
			emailType
		});

		return json(
			{
				success: true,
				unsubscribeUrl: buildUnsubscribeUrl(url.origin, token)
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Failed to create unsubscribe link', error);
		return json({ success: false, error: 'Server configuration error.' }, { status: 500 });
	}
};
