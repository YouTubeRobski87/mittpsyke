import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const BUCKET = 'diary-images';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function logUploadDebug(message: string, details?: unknown) {
	if (!dev) return;
	console.debug(`[diary/upload] ${message}`, details ?? '');
}

function getAccessToken(header: string | null): string | null {
	if (!header) return null;
	const [scheme, token] = header.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

export const POST: RequestHandler = async ({ request }) => {
	// 1. Verifiera Bearer-token
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return json({ error: 'Authorization saknas.' }, { status: 401 });
	}

	const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
		console.error('[diary/upload] Saknar Supabase-miljövariabler.');
		return json({ error: 'Serverkonfigurationsfel.' }, { status: 500 });
	}

	// 2. Verifiera att token tillhör en inloggad användare (anon-klient + auth-header)
	const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: authError
	} = await anonClient.auth.getUser();

	if (authError || !user) {
		logUploadDebug('Auth fel.', authError?.message ?? 'ingen user');
		return json({ error: 'Obehörig.' }, { status: 401 });
	}

	// 3. Läs multipart-formuläret
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch (err) {
		logUploadDebug('Kunde inte läsa formdata.', err);
		return json({ error: 'Ogiltig request – skicka multipart/form-data.' }, { status: 400 });
	}

	const file = formData.get('file');
	if (!(file instanceof File)) {
		return json({ error: 'Fältet "file" saknas eller är inte en fil.' }, { status: 400 });
	}

	// 4. Validera filtyp och storlek
	if (!ALLOWED_MIME.has(file.type)) {
		return json(
			{ error: `Filtypen "${file.type}" stöds inte. Använd JPEG, PNG, WebP eller GIF.` },
			{ status: 400 }
		);
	}

	if (file.size > MAX_BYTES) {
		return json({ error: 'Bilden är för stor (max 5 MB).' }, { status: 400 });
	}

	// 5. Ladda upp via service role – kringgår RLS (användaren är verifierad i steg 2)
	const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	const timestamp = Date.now();
	const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
	const storagePath = `${user.id}/${timestamp}-${safeFilename}`;

	const arrayBuffer = await file.arrayBuffer();
	const uint8 = new Uint8Array(arrayBuffer);

	const { error: uploadError } = await serviceClient.storage
		.from(BUCKET)
		.upload(storagePath, uint8, {
			contentType: file.type,
			upsert: false
		});

	if (uploadError) {
		logUploadDebug('Storage-fel.', {
			message: uploadError.message,
			status: (uploadError as { statusCode?: string }).statusCode ?? null,
			userId: user.id,
			path: storagePath
		});
		return json(
			{ error: 'Bilden kunde inte sparas just nu. Försök igen om en stund.' },
			{ status: 500 }
		);
	}

	// getPublicUrl är synkron i supabase-js v2
	const { data: urlData } = serviceClient.storage.from(BUCKET).getPublicUrl(storagePath);

	return json({ url: urlData.publicUrl });
};
