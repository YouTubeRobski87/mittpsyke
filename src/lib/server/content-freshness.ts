import { execFileSync } from 'node:child_process';

const lastmodCache = new Map<string, string>();

function getGitDate(relativePath: string): string | null {
	try {
		const output = execFileSync('git', ['log', '-1', '--format=%cs', '--', relativePath], {
			cwd: process.cwd(),
			encoding: 'utf-8',
			timeout: 2000,
			stdio: ['ignore', 'pipe', 'ignore']
		}).trim();

		return /^\d{4}-\d{2}-\d{2}$/.test(output) ? output : null;
	} catch {
		return null;
	}
}

// Ger senaste faktiska ändringsdatum (från git-historiken) för filerna som
// styr en sidas innehåll, i stället för ett manuellt underhållet datum som
// lätt blir liggande kvar efter att innehållet faktiskt ändrats. Faller
// tillbaka på ett angivet datum om git-historiken inte går att läsa, t.ex.
// om .git saknas i produktionsmiljön.
export function getContentLastmod(paths: string | string[], fallback: string): string {
	const pathList = Array.isArray(paths) ? paths : [paths];
	const cacheKey = pathList.join('|');
	const cached = lastmodCache.get(cacheKey);
	if (cached) return cached;

	const dates = pathList.map(getGitDate).filter((date): date is string => Boolean(date));
	const result = dates.length > 0 ? dates.sort().at(-1)! : fallback;
	lastmodCache.set(cacheKey, result);
	return result;
}
