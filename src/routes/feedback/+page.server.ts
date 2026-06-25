import { fail } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { Actions } from './$types';

const experienceOptions = new Set(['Väldigt bra', 'Bra', 'Okej', 'Inte så bra']);
const useAgainOptions = new Set(['Ja', 'Kanske', 'Nej']);

function getText(formData: FormData, key: string) {
	const value = formData.get(key);
	return typeof value === 'string' ? value.trim() : '';
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const experience = getText(formData, 'experience');
		const whatWorked = getText(formData, 'whatWorked');
		const unclear = getText(formData, 'unclear');
		const missing = getText(formData, 'missing');
		const useAgain = getText(formData, 'useAgain');
		const other = getText(formData, 'other');

		const values = {
			experience,
			whatWorked,
			unclear,
			missing,
			useAgain,
			other
		};

		const fieldErrors: Record<string, string> = {};

		if (!experienceOptions.has(experience)) {
			fieldErrors.experience = 'Välj det alternativ som passar bäst.';
		}

		if (!useAgainOptions.has(useAgain)) {
			fieldErrors.useAgain = 'Välj om du skulle använda MittPsyke igen.';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				success: false,
				message: 'Det verkar saknas ett par svar. Kontrollera formuläret och försök igen.',
				fieldErrors,
				values
			});
		}

		const serviceClient = createServiceClient();
		if (!serviceClient) {
			return fail(500, {
				success: false,
				message: 'Det gick inte att spara feedback just nu. Försök igen om en liten stund.',
				fieldErrors: {},
				values
			});
		}

		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		const { error } = await serviceClient.from('feedback_submissions').insert({
			user_id: user?.id ?? null,
			experience,
			what_worked: whatWorked || null,
			unclear: unclear || null,
			missing: missing || null,
			use_again: useAgain,
			other: other || null
		});

		if (error) {
			console.error('feedback insert failed', error);

			return fail(500, {
				success: false,
				message: 'Det gick inte att spara feedback just nu. Försök igen om en liten stund.',
				fieldErrors: {},
				values
			});
		}

		return {
			success: true,
			message: 'Tack för att du hjälper oss förbättra MittPsyke.'
		};
	}
};
