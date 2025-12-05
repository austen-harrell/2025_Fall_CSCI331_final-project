import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { statements, type PantryItem } from '$lib/db.js';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) throw redirect(302, '/login');
  const session = JSON.parse(sessionCookie);
  if (session.type !== 'user') throw redirect(302, '/login');
  const items = statements.getPantryItemsByUser.all(session.userId) as PantryItem[];
  return { items };
};

export const actions: Actions = {
  add: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) return fail(401, { error: 'Not authenticated' });
    const session = JSON.parse(sessionCookie);
    if (session.type !== 'user') return fail(401, { error: 'Not authenticated' });
    const data = await request.formData();
    const ingredient = (data.get('ingredient') as string) || '';
    const thumb = (data.get('thumb') as string) || '';
    if (!ingredient) return fail(400, { error: 'Ingredient is required' });
    statements.addPantryItem.run(session.userId, ingredient, thumb || null);
    return { success: true };
  },
  remove: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) return fail(401, { error: 'Not authenticated' });
    const session = JSON.parse(sessionCookie);
    if (session.type !== 'user') return fail(401, { error: 'Not authenticated' });
    const data = await request.formData();
    const id = Number(data.get('id'));
    if (!id) return fail(400, { error: 'Item id is required' });
    statements.removePantryItem.run(id, session.userId);
    return { success: true };
  }
};