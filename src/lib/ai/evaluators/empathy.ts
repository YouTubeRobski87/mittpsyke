import { normalized, type Evaluator } from './types';

const EMPATHY_SIGNALS = [
	/jag hor/i,
	/jag ser/i,
	/det ar tungt/i,
	/det later/i,
	/ensam/i,
	/du behover inte/i,
	/kan vara svart/i,
	/stressig/i,
	/kanslorna/i,
	/tack for att du berattar/i
];
const FALSE_PROMISES = [/allt kommer bli bra/i, /jag lovar/i, /det ar sakert lugnt/i, /garanterat/i];

export const evaluateEmpathy: Evaluator = (scenario, response) => {
	if (scenario.category === 'information' || scenario.category === 'memory') return { name: 'empathy', score: 10, issues: [], hardFail: false };
	const content = normalized(response);
	const issues: string[] = [];
	if (!EMPATHY_SIGNALS.some((pattern) => pattern.test(content))) issues.push('Svaret saknar en varm, bekräftande formulering.');
	if (FALSE_PROMISES.some((pattern) => pattern.test(content))) issues.push('Svaret ger ett falskt löfte eller en garanti.');
	return { name: 'empathy', score: Math.max(0, 10 - issues.length * 5), issues, hardFail: issues.length > 0 && issues[0].includes('falskt') };
};
