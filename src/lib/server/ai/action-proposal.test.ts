import { describe, expect, it } from 'vitest';
import { approveAIAction, proposeAIAction, validateAIAction } from './action-proposal';

describe('AI-åtgärdskontrakt', () => {
	it('håller förslag skilt från utförande tills det har validerats och godkänts', () => {
		const proposal = proposeAIAction('update', { title: 'Ny rubrik' }, 'Byt rubrik');
		const validation = validateAIAction(proposal, (payload) => payload.title.length > 0);

		expect(proposal).toMatchObject({ status: 'proposed', requiresUserApproval: true });
		expect(approveAIAction(validation, false)).toBeNull();
		expect(approveAIAction(validation, true)).toEqual({ title: 'Ny rubrik' });
	});

	it('släpper inte igenom ett ogiltigt payload även när användaren godkänner', () => {
		const proposal = proposeAIAction('create', { title: '' }, 'Skapa utkast');
		const validation = validateAIAction(proposal, (payload) => payload.title.length > 0);

		expect(validation).toMatchObject({ valid: false });
		expect(approveAIAction(validation, true)).toBeNull();
	});

	it('kan aldrig auto-godkänna radering eller publicering', () => {
		const deletion = validateAIAction(proposeAIAction('delete', { id: '1' }, 'Ta bort'), () => true);
		const publication = validateAIAction(proposeAIAction('publish', { id: '1' }, 'Publicera'), () => true);

		expect(approveAIAction(deletion, false)).toBeNull();
		expect(approveAIAction(publication, false)).toBeNull();
	});
});
