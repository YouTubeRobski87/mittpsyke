import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();

  if (user) {
    throw redirect(302, '/dashboard');
  }

  return {
    title: "Verktyg mot ångest online – Din personliga dagbok",
    description: "Mittpsyke erbjuder digitala verktyg mot ångest online. Skriv din personliga dagbok och följ ditt mående med en visuell dashboard."
  };
};
