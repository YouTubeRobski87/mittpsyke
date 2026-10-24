// Felkoder som chattens API skickar och klienten känner igen.
//
// Ett 403 utan någon av de här koderna tolkas alltid som saknat samtycke, så
// att ett okänt fall låser chatten (fail-closed). Koden nedan används bara för
// 403-svar som gäller själva samtalet, aldrig för samtyckeskontrollerna.
export const CONVERSATION_UNAVAILABLE_CODE = 'CONVERSATION_UNAVAILABLE';
