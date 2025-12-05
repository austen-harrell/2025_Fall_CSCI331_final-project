import type { PageServerLoad } from './$types';
import { statements, type PantryItem } from '$lib/db.js';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) throw redirect(302, '/login');
  const session = JSON.parse(sessionCookie);
  if (session.type !== 'user') throw redirect(302, '/login');
  const pantry = statements.getPantryItemsByUser.all(session.userId) as PantryItem[];
  return { pantry };
};