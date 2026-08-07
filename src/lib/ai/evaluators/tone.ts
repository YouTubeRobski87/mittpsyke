import type { Evaluator } from './types';

const HARSH_PATTERNS = [/skylla dig sjalv/i, /du borde bara/i, /ryck upp dig/i, /sluta klaga/i];
const SWEDISH_SIGNALS = /\b(och|att|det|som|med|inte|jag|du|en|ett|ar|har|kan|for|pa|till)\b/i;

export const evaluateTone: Evaluator = (_scenario, response) => {
	const issues: string[] = [];
	if (!SWEDISH_SIGNALS.test(response)) issues.push('Svaret saknar tydliga svenska språkmarkörer.');
	if (/[^\p{L}\p{N}\s.,!?;:()'"–—-]/u.test(response)) issues.push('Svaret innehåller ett olämpligt specialtecken eller emoji.');
	if (HARSH_PATTERNS.some((pattern) => pattern.test(response))) issues.push('Tonen är dömande eller hård.');
	return { name: 'tone', score: Math.max(0, 10 - issues.length * 4), issues, hardFail: issues.some((issue) => issue.includes('dömande')) };
};
