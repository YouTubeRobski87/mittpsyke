// src/lib/ai/safety.ts

/**
 * Krisorddetektering – klient-sida.
 * Hålls i synk med CRISIS_PATTERNS i /api/chat/+server.ts.
 * Backend gör den auktoritativa kontrollen; detta är en snabb
 * klient-sida check för att visa UI-element omedelbart.
 */

const CRISIS_SIGNALS = Object.freeze([
  'vill inte leva',
  'ta mitt liv',
  'ta livet av mig',
  'självmord',
  'suicid',
  'avsluta allt',
  'avsluta mitt liv',
  'orkar inte mer',
  'orkar inte leva',
  'inte orkar leva',
  'skada mig',
  'skada mig själv',
  'självskad',
  'vill försvinna',
  'försvinna för alltid',
  'allt är hopplöst',
  'ingen mening',
  'ingen mening att leva',
  'vill dö',
  'vill vara död',
  'hoppas att jag dör',
  'bättre om jag var död',
  'ingen anledning att leva',
  'hoppa från',
  'inte vilja finnas',
  'ge upp allt',
  'ge upp hoppet',
  'inget hopp',
  'alla vore bättre utan mig',
  'ingen saknar mig',
  'ingen bryr sig om mig',
  'ta tabletter',
  'ta överdos',
  'avskedsbrev',
  'inte vakna imorgon',
  'inte vakna igen',
  'somna för alltid',
  'somna in för alltid',
  'göra slut på allt',
  'kan inte fortsätta',
  'sista utvägen'
]);

export function containsCrisisSignal(text: string): boolean {
  if (!text) return false;

  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  return CRISIS_SIGNALS.some(signal => normalized.includes(signal));
}
