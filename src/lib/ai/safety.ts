// src/lib/ai/safety.ts

const CRISIS_SIGNALS = Object.freeze([
  'vill inte leva',
  'ta mitt liv',
  'självmord',
  'avsluta allt',
  'orkar inte mer',
  'inte orka mer',
  'skada mig',
  'skada mig själv',
  'vill försvinna',
  'försvinna för alltid',
  'allt är hopplöst',
  'ingen mening',
  'vill dö'
]);

export function containsCrisisSignal(text: string): boolean {
  if (!text) return false;

  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return CRISIS_SIGNALS.some(signal => normalized.includes(signal));
}
