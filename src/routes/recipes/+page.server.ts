import type { PageServerLoad } from './$types';
import { statements, type PantryItem } from '$lib/db.js';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) throw redirect(302, '/login');
  const session = JSON.parse(sessionCookie);
  if (session.type === 'user') {
    const pantry = statements.getPantryItemsByUser.all(session.userId) as PantryItem[];
    const favorites = statements.getFavoritesByUser.all(session.userId);
    return { pantry, favorites };
  } else if (session.type === 'guest') {
    let pantry: PantryItem[] = [];
    let favorites: Array<{ recipe_id: string; recipe_name?: string; thumb?: string }> = [];
    const pRaw = cookies.get('guest_pantry');
    const fRaw = cookies.get('guest_favorites');
    if (pRaw) { try { pantry = JSON.parse(pRaw); } catch { pantry = []; } }
    if (fRaw) { try { favorites = JSON.parse(fRaw); } catch { favorites = []; } }
    return { pantry, favorites };
  }
  throw redirect(302, '/login');
};