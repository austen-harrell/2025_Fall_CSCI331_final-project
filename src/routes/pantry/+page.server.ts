import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { statements, type PantryItem } from '$lib/db.js';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) throw redirect(302, '/login');
  const session = JSON.parse(sessionCookie);
  if (session.type === 'user') {
    const items = statements.getPantryItemsByUser.all(session.userId) as PantryItem[];
    return { items };
  } else if (session.type === 'guest') {
    const raw = cookies.get('guest_pantry');
    let items: PantryItem[] = [];
    if (raw) {
      try { items = JSON.parse(raw); } catch { items = []; }
    }
    return { items };
  }
  throw redirect(302, '/login');
};

export const actions: Actions = {
  add: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) return fail(401, { error: 'Not authenticated' });
    const session = JSON.parse(sessionCookie);
    const data = await request.formData();
    const ingredient = (data.get('ingredient') as string) || '';
    const thumb = (data.get('thumb') as string) || '';
    if (!ingredient) return fail(400, { error: 'Ingredient is required' });
    if (session.type === 'user') {
      statements.addPantryItem.run(session.userId, ingredient, thumb || null);
      return { success: true };
    }
    if (session.type === 'guest') {
      const raw = cookies.get('guest_pantry');
      let arr: PantryItem[] = [];
      if (raw) { try { arr = JSON.parse(raw); } catch { arr = []; } }
      const item = { id: Date.now(), ingredient, thumb: thumb || null, created_at: new Date().toISOString() } as PantryItem;
      arr.push(item);
      cookies.set('guest_pantry', JSON.stringify(arr), { path: '/', httpOnly: false, sameSite: 'strict' });
      return { success: true };
    }
    return fail(401, { error: 'Not authenticated' });
  },
  remove: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    if (!sessionCookie) return fail(401, { error: 'Not authenticated' });
    const session = JSON.parse(sessionCookie);
    const data = await request.formData();
    const id = Number(data.get('id'));
    if (!id) return fail(400, { error: 'Item id is required' });
    if (session.type === 'user') {
      statements.removePantryItem.run(id, session.userId);
      return { success: true };
    }
    if (session.type === 'guest') {
      const raw = cookies.get('guest_pantry');
      let arr: PantryItem[] = [];
      if (raw) { try { arr = JSON.parse(raw); } catch { arr = []; } }
      arr = arr.filter((x) => Number(x.id) !== id);
      cookies.set('guest_pantry', JSON.stringify(arr), { path: '/', httpOnly: false, sameSite: 'strict' });
      return { success: true };
    }
    return fail(401, { error: 'Not authenticated' });
  }
};