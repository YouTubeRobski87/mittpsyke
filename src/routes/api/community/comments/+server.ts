import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createServiceClient as createAdminServiceClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';
import type {
	CreateCommunityCommentErrorResponse,
	CreateCommunityCommentRequestBody,
	CreateCommunityCommentSuccessResponse
} from '$lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMENT_MAX_LENGTH = 280;

function errorResponse(message: string, status: number) {
	const body: CreateCommunityCommentErrorResponse = {
		success: false,
		error: message
	};
	return json(body, { status });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;

	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
		return null;
	}

	return token.trim();
}

function isMissingTableError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

function validateBody(
	input: unknown
): { ok: true; data: CreateCommunityCommentRequestBody } | { ok: false; error: string } {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return { ok: false, error: 'Invalid request body.' };
	}

	const body = input as Partial<CreateCommunityCommentRequestBody>;
	const postId = typeof body.postId === 'string' ? body.postId.trim() : '';
	const commentBody = typeof body.body === 'string' ? body.body.trim() : '';

	if (!postId || !UUID_REGEX.test(postId)) {
		return { ok: false, error: 'Field "postId" is required and must be a valid UUID.' };
	}

	if (!commentBody) {
		return { ok: false, error: 'Kommentaren kan inte vara tom.' };
	}

	if (commentBody.length > COMMENT_MAX_LENGTH) {
		return { ok: false, error: `Kommentaren får vara högst ${COMMENT_MAX_LENGTH} tecken.` };
	}

	return {
		ok: true,
		data: {
			postId,
			body: commentBody
		}
	};
}

export const POST: RequestHandler = async ({ request }) => {
	let parsedBody: unknown;
	try {
		parsedBody = await request.json();
	} catch {
		return errorResponse('Invalid JSON body.', 400);
	}

	const validated = validateBody(parsedBody);
	if (!validated.ok) {
		return errorResponse(validated.error, 400);
	}

	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return errorResponse('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
		return errorResponse('Server configuration error.', 500);
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return errorResponse('Unauthorized.', 401);
	}

	const { data: post, error: postError } = await supabase
		.from('community_posts')
		.select('id, user_id')
		.eq('id', validated.data.postId)
		.is('deleted_at', null)
		.maybeSingle();

	if (isMissingTableError(postError, 'community_posts')) {
		return errorResponse(
			'Gemenskapstabellen saknas. Kör supabase/community_posts.sql i Supabase innan du fortsätter.',
			500
		);
	}

	if (postError) {
		console.error('Failed to load community post for comment:', postError);
		return errorResponse(postError.message ?? 'Kunde inte läsa inlägget just nu.', 500);
	}

	if (!post) {
		return errorResponse('Inlägget kunde inte hittas.', 404);
	}

	if (post.user_id === user.id) {
		return errorResponse('Du kan inte svara på ditt eget inlägg i den här versionen.', 403);
	}

	const { data: insertedComment, error: insertError } = await supabase
		.from('community_comments')
		.insert({
			post_id: validated.data.postId,
			user_id: user.id,
			body: validated.data.body
		})
		.select('id, post_id, body, created_at')
		.single();

	if (isMissingTableError(insertError, 'community_comments')) {
		return errorResponse(
			'Kommentarstabellen saknas. Kör supabase/community_comments.sql i Supabase innan du fortsätter.',
			500
		);
	}

	if (insertError) {
		if (insertError.code === '42501') {
			return errorResponse('Du har inte behörighet att kommentera just nu.', 403);
		}
		console.error('Failed to create community comment:', insertError);
		return errorResponse(insertError.message ?? 'Kunde inte spara kommentaren just nu.', 500);
	}

	const response: CreateCommunityCommentSuccessResponse = {
		success: true,
		comment: {
			id: insertedComment.id,
			post_id: insertedComment.post_id,
			body: insertedComment.body,
			created_at: insertedComment.created_at
		}
	};

	// Lågmäld notis till ägaren av inlägget.
	// Notis är extra funktionalitet: kommentaren ska ändå lyckas om notis-insert fallerar.
	if (post.user_id && post.user_id !== user.id) {
		const serviceClient = createAdminServiceClient();
		if (serviceClient) {
			const { error: notificationError } = await serviceClient.from('notifications').insert({
				user_id: post.user_id,
				type: 'community_reply',
				title: 'Du har fått ett svar i Gemenskapen',
				body: 'Någon har svarat på ditt inlägg.',
				link: `/dashboard/gemenskap#post-${validated.data.postId}`,
				is_read: false,
				actor_user_id: user.id
			});

			if (notificationError) {
				if (isMissingTableError(notificationError, 'notifications')) {
					console.error('Notifications table missing while creating community reply notification.');
				}
				console.error('Failed to create community reply notification:', notificationError);
			}
		} else {
			console.error(
				'Skipped community reply notification: missing SUPABASE_SERVICE_ROLE_KEY/SERVICE_ROLE_KEY or Supabase URL.'
			);
		}
	}

	return json(response, { status: 200 });
};

export const GET: RequestHandler = async ({ url, request, locals }) => {
	const postId = url.searchParams.get('postId')?.trim() ?? '';
	if (!postId || !UUID_REGEX.test(postId)) {
		return json({ success: false, error: 'Ogiltigt postId.' }, { status: 400 });
	}

	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return json({ success: false, error: 'Saknar giltig inloggning.' }, { status: 401 });
	}

	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser(token);

	if (userError || !user) {
		return json({ success: false, error: 'Saknar giltig inloggning.' }, { status: 401 });
	}

	const { data: commentsData, error: commentsError } = await locals.supabase
		.from('community_comments')
		.select('id, post_id, body, created_at')
		.eq('post_id', postId)
		.is('deleted_at', null)
		.order('created_at', { ascending: true })
		.limit(200);

	if (isMissingTableError(commentsError, 'community_comments')) {
		return json({ success: true, comments: [] }, { status: 200 });
	}

	if (commentsError) {
		console.error('Failed to load community comments:', commentsError);
		return json({ success: false, error: 'Kunde inte läsa svar just nu.' }, { status: 500 });
	}

	const comments = (commentsData ?? [])
		.map((row) => ({
			id: typeof row.id === 'string' ? row.id : '',
			post_id: typeof row.post_id === 'string' ? row.post_id : '',
			body: typeof row.body === 'string' ? row.body.trim() : '',
			created_at: typeof row.created_at === 'string' ? row.created_at : null
		}))
		.filter((row) => row.id && row.post_id && row.body);

	return json({ success: true, comments }, { status: 200 });
};
