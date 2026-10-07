// Syntetisk Supabase-klient för lokal QA. Endast testinfrastruktur.
//
// Modulen har inga importer och gör aldrig nätverksanrop. All data byggs
// deterministiskt i minnet utifrån valt läge (empty/thin/rich) och ett
// referensdatum, så samma dag ger alltid samma underlag. Inga riktiga konton,
// inga riktiga tokens och inget som liknar en verklig användares text: varje
// dagbokstext börjar med "QA-exempel".
//
// Skrivningar (insert/upsert/update/delete) godtas men sparas inte, så ett
// läge ser likadant ut vid varje besök. Undantaget är auth.updateUser, som
// sparar user_metadata per läge i minnet - precis som den riktiga metoden gör
// mot Auth - så att t.ex. världens progression beter sig som i produktionen.

export const QA_MODES = /** @type {const} */ (['empty', 'thin', 'rich']);
export const DEFAULT_QA_MODE = 'empty';
export const QA_USER_ID = '00000000-0000-4000-8000-000000000001';

// En egen syntetisk användare per läge. Flera endpoints cachar per user_id
// (TtlCache), så ett gemensamt id hade gjort att första lägets svar visades
// även i de andra lägena.
export const QA_USER_IDS = {
	empty: QA_USER_ID,
	thin: '00000000-0000-4000-8000-000000000002',
	rich: '00000000-0000-4000-8000-000000000003'
};
export const QA_ACCESS_TOKEN = 'local-qa-not-a-real-token';

const HEALTH_CONSENT = {
	accepted: true,
	type: 'health_data_processing',
	timestamp: '2026-09-01T12:00:00Z',
	policy_version: '2026-04-29'
};

/** Normaliserar ett godtyckligt värde till ett giltigt läge. */
export function resolveQaMode(value) {
	return QA_MODES.includes(value) ? value : DEFAULT_QA_MODE;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** ISO-tid `offset` dagar före `now`, kl. 18:30 UTC (kväll i Stockholm, samma kalenderdag). */
function dayIso(now, offset, minute = 30) {
	const day = new Date(now.getTime() - offset * DAY_MS);
	return `${day.toISOString().slice(0, 10)}T18:${String(minute).padStart(2, '0')}:00.000Z`;
}

function dateKey(now, offset) {
	return dayIso(now, offset).slice(0, 10);
}

function uuid(prefix, index) {
	return `${prefix}-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

// Neutrala, tydligt påhittade texter. Nyckelorden (sömn, promenad, jobb, natur,
// tacksam, vila, ...) finns med för att analysens teman ska kunna visas i rich.
const ENTRY_TEXTS = [
	'QA-exempel: kort promenad i parken efter jobbet, kändes lugnare efteråt.',
	'QA-exempel: trött och sov dåligt i natt, mycket att hinna med på jobbet.',
	'QA-exempel: tacksam för en lugn kväll med vila och te.',
	'QA-exempel: stressad inför ett möte, skrev av mig en stund.',
	'QA-exempel: ute i skogen en timme, natur gör mig gott.',
	'QA-exempel: somnade tidigt och vaknade utvilad.',
	'QA-exempel: träffade en vän och pratade länge, fint.',
	'QA-exempel: en vanlig dag, inget särskilt att notera.'
];
const RICH_MOODS = ['6', '4', '7', '5', '8', '7', '6', '5', '3', '7'];
const EVENING_THEMES = ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'feeling_okay', 'other'];
const PARKING = ['tomorrow', 'small_step', 'not_tonight'];

function diaryRow(userId, now, index, offset, mood) {
	return {
		id: uuid('d0000000', index),
		user_id: userId,
		created_at: dayIso(now, offset, index % 50),
		text: ENTRY_TEXTS[index % ENTRY_TEXTS.length],
		mood,
		tags: [],
		prompt_question: null,
		image_url: null,
		video_path: null,
		daily_question_id: null
	};
}

function eveningRow(userId, now, index, offset) {
	return {
		id: uuid('e0000000', index),
		user_id: userId,
		checkin_date: dateKey(now, offset),
		created_at: dayIso(now, offset),
		theme_id: EVENING_THEMES[index % EVENING_THEMES.length],
		parking_bucket: PARKING[index % PARKING.length],
		thought: null,
		flow_version: 'evening-calm-v1'
	};
}

function creativeRow(userId, now, index, offset) {
	return {
		id: uuid('c0000000', index),
		user_id: userId,
		activity_type: 'world_coloring',
		occurred_at: dayIso(now, offset)
	};
}

function companionAnswerRow(userId, now, offset) {
	return {
		user_id: userId,
		answer_date: dateKey(now, offset),
		question_id: 'qa-question',
		answer_id: 'qa-answer',
		created_at: dayIso(now, offset)
	};
}

function mondayKey(now, weeksAgo) {
	const day = new Date(now.getTime() - weeksAgo * 7 * DAY_MS);
	const isoDay = (day.getUTCDay() + 6) % 7;
	return new Date(day.getTime() - isoDay * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Bygger alla tabeller för ett läge. Ren funktion: samma (mode, now) ger
 * alltid samma resultat.
 */
export function buildSyntheticDataset(modeInput, now = new Date()) {
	const mode = resolveQaMode(modeInput);
	const userId = QA_USER_IDS[mode];
	const tables = {
		diary: [],
		journal_entries: [],
		evening_checkins: [],
		creative_moments: [],
		companion_daily_answers: [],
		companion_presence_weeks: []
	};

	if (mode === 'thin') {
		// Några inlägg och enstaka incheckningar: för lite för de flesta mönster.
		[1, 4, 9].forEach((offset, index) =>
			tables.diary.push(diaryRow(userId, now, index, offset, index === 1 ? null : String(5 + index)))
		);
		[2, 6].forEach((offset, index) => tables.evening_checkins.push(eveningRow(userId, now, index, offset)));
		tables.creative_moments.push(creativeRow(userId, now, 0, 3));
		[1, 4].forEach((offset) => tables.companion_daily_answers.push(companionAnswerRow(userId, now, offset)));
		tables.companion_presence_weeks.push({ user_id: userId, week_start: mondayKey(now, 0) });
	}

	if (mode === 'rich') {
		// Drygt tio veckors historik med luckor, så att halvfulla och fulla
		// perioder, mönster och visualiseringar visas samtidigt.
		let index = 0;
		// Tidsstämplade rader börjar på gårdagen, så att ingen rad hamnar i
		// framtiden (18:30 UTC) och antalet inte beror på tid på dygnet.
		for (let offset = 1; offset < 76; offset += 1) {
			if (offset % 7 === 3 || offset % 11 === 5) continue;
			tables.diary.push(diaryRow(userId, now, index, offset, RICH_MOODS[index % RICH_MOODS.length]));
			index += 1;
		}
		for (let offset = 0; offset < 30; offset += 1) {
			if (offset % 3 === 2) continue;
			tables.evening_checkins.push(eveningRow(userId, now, offset, offset));
		}
		[1, 2, 3, 5].forEach((offset, i) => tables.creative_moments.push(creativeRow(userId, now, i, offset)));
		for (let offset = 0; offset < 40; offset += 2) {
			tables.companion_daily_answers.push(companionAnswerRow(userId, now, offset));
		}
		for (let weeks = 0; weeks < 9; weeks += 1) {
			tables.companion_presence_weeks.push({ user_id: userId, week_start: mondayKey(now, weeks) });
		}
	}

	const accountAgeDays = mode === 'rich' ? 100 : mode === 'thin' ? 14 : 2;
	const user = {
		id: userId,
		aud: 'authenticated',
		role: 'authenticated',
		email: 'qa@example.invalid',
		is_anonymous: false,
		created_at: new Date(now.getTime() - accountAgeDays * DAY_MS).toISOString(),
		app_metadata: { provider: 'email', providers: ['email'] },
		user_metadata: {
			display_name: 'QA-testperson',
			health_data_processing_consent: { ...HEALTH_CONSENT }
		}
	};

	return { mode, user, tables };
}

// ── Frågebyggare ─────────────────────────────────────────────────────────

function compare(a, b) {
	if (a === b) return 0;
	if (a === null || a === undefined) return -1;
	if (b === null || b === undefined) return 1;
	return a < b ? -1 : 1;
}

function project(row, columns) {
	if (!columns || columns.trim() === '*') return { ...row };
	const result = {};
	for (const column of columns.split(',').map((part) => part.trim()).filter(Boolean)) {
		result[column] = row[column] ?? null;
	}
	return result;
}

function createQuery(rows) {
	let columns = '*';
	let countMode = null;
	let head = false;
	let isWrite = false;
	let writePayload = null;
	const filters = [];
	let ordering = null;
	let limitCount = null;
	let rangeBounds = null;

	const execute = (mode) => {
		if (isWrite) {
			// Skrivningar godtas men sparas inte - läget förblir deterministiskt.
			const written = Array.isArray(writePayload) ? writePayload : writePayload ? [writePayload] : [];
			const data = written.map((row, i) => ({ id: uuid('w0000000', i + 1), created_at: new Date().toISOString(), ...row }));
			if (mode === 'single' || mode === 'maybeSingle') return { data: data[0] ?? null, error: null };
			return { data, error: null, count: data.length };
		}

		let result = rows.filter((row) => filters.every((filter) => filter(row)));
		const count = countMode ? result.length : null;
		if (ordering) {
			const { column, ascending } = ordering;
			result = result.slice().sort((a, b) => compare(a[column], b[column]) * (ascending ? 1 : -1));
		}
		if (rangeBounds) result = result.slice(rangeBounds[0], rangeBounds[1] + 1);
		if (limitCount !== null) result = result.slice(0, limitCount);
		const data = head ? null : result.map((row) => project(row, columns));

		if (mode === 'single') {
			return data && data.length === 1
				? { data: data[0], error: null, count }
				: { data: null, error: { code: 'PGRST116', message: 'QA: förväntade exakt en rad.' }, count };
		}
		if (mode === 'maybeSingle') return { data: data?.[0] ?? null, error: null, count };
		return { data, error: null, count };
	};

	const query = {
		select(cols = '*', options = {}) {
			columns = cols;
			countMode = options.count ?? countMode;
			head = Boolean(options.head);
			return query;
		},
		insert(payload) { isWrite = true; writePayload = payload; return query; },
		upsert(payload) { isWrite = true; writePayload = payload; return query; },
		update(payload) { isWrite = true; writePayload = payload; return query; },
		delete() { isWrite = true; writePayload = null; return query; },
		eq(column, value) { filters.push((row) => row[column] === value); return query; },
		neq(column, value) { filters.push((row) => row[column] !== value); return query; },
		gt(column, value) { filters.push((row) => compare(row[column], value) > 0); return query; },
		gte(column, value) { filters.push((row) => compare(row[column], value) >= 0); return query; },
		lt(column, value) { filters.push((row) => compare(row[column], value) < 0); return query; },
		lte(column, value) { filters.push((row) => compare(row[column], value) <= 0); return query; },
		in(column, values) { filters.push((row) => values.includes(row[column])); return query; },
		is(column, value) { filters.push((row) => (row[column] ?? null) === value); return query; },
		not(column, operator, value) {
			if (operator === 'is') filters.push((row) => (row[column] ?? null) !== value);
			else if (operator === 'eq') filters.push((row) => row[column] !== value);
			return query;
		},
		order(column, options = {}) { ordering = { column, ascending: options.ascending !== false }; return query; },
		limit(count) { limitCount = count; return query; },
		range(from, to) { rangeBounds = [from, to]; return query; },
		single() { return Promise.resolve(execute('single')); },
		maybeSingle() { return Promise.resolve(execute('maybeSingle')); },
		then(resolve, reject) { return Promise.resolve(execute('many')).then(resolve, reject); }
	};
	return query;
}

// ── Klient ───────────────────────────────────────────────────────────────

/**
 * Per-läge-lager för user_metadata. Delas mellan klienter i samma process så
 * att auth.updateUser beter sig som mot riktig Auth: en sparning syns vid nästa
 * getUser. Skicka in ett eget lager i tester för isolering.
 */
export function createMetadataStore() {
	const byMode = new Map();
	return {
		get(mode, fallback) {
			if (!byMode.has(mode)) byMode.set(mode, structuredClone(fallback));
			return byMode.get(mode);
		},
		set(mode, metadata) { byMode.set(mode, structuredClone(metadata)); },
		reset() { byMode.clear(); }
	};
}

const sharedMetadataStore = createMetadataStore();

/**
 * @param {{ mode?: string, now?: Date, guest?: boolean, store?: ReturnType<typeof createMetadataStore> }} [options]
 */
export function createSyntheticSupabase(options = {}) {
	const now = options.now ?? new Date();
	const store = options.store ?? sharedMetadataStore;
	const dataset = buildSyntheticDataset(options.mode, now);
	const mode = dataset.mode;

	const currentUser = () => ({
		...dataset.user,
		user_metadata: store.get(mode, dataset.user.user_metadata)
	});
	const currentSession = () => {
		const user = currentUser();
		return {
			access_token: QA_ACCESS_TOKEN,
			refresh_token: 'local-qa-not-a-real-refresh-token',
			token_type: 'bearer',
			expires_in: 3600,
			expires_at: Math.floor(now.getTime() / 1000) + 3600,
			user
		};
	};

	const auth = {
		async getUser() {
			return options.guest ? { data: { user: null }, error: null } : { data: { user: currentUser() }, error: null };
		},
		async getSession() {
			return options.guest ? { data: { session: null }, error: null } : { data: { session: currentSession() }, error: null };
		},
		onAuthStateChange() {
			return { data: { subscription: { unsubscribe() {} } } };
		},
		async signOut() {
			return { error: null };
		},
		/** Som riktiga updateUser: `data` slås ihop med befintlig user_metadata. */
		async updateUser(attributes = {}) {
			if (options.guest) return { data: { user: null }, error: { name: 'AuthSessionMissingError', message: 'QA: ingen session.' } };
			if (attributes.data && typeof attributes.data === 'object') {
				store.set(mode, { ...store.get(mode, dataset.user.user_metadata), ...attributes.data });
			}
			return { data: { user: currentUser() }, error: null };
		},
		/** Som riktiga refreshSession: ny session med aktuell user_metadata. */
		async refreshSession() {
			if (options.guest) return { data: { session: null, user: null }, error: { name: 'AuthSessionMissingError', message: 'QA: ingen session.' } };
			const session = currentSession();
			return { data: { session, user: session.user }, error: null };
		}
	};

	return {
		mode,
		auth,
		from(table) {
			return createQuery(dataset.tables[table] ?? []);
		},
		rpc(name) {
			if (name === 'record_companion_presence_week') return Promise.resolve({ data: false, error: null });
			return Promise.resolve({ data: null, error: null });
		},
		storage: {
			from() {
				return {
					createSignedUrl: async () => ({ data: null, error: { message: 'QA: ingen lagring.' } }),
					upload: async () => ({ data: null, error: { message: 'QA: ingen lagring.' } }),
					remove: async () => ({ data: [], error: null })
				};
			}
		}
	};
}
