import type { RequestHandler } from './$types';
import { statements } from '$lib/db.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  const session = JSON.parse(sessionCookie);

  const body = await request.json().catch(() => null);
  if (!body || !body.recipe_id || typeof body.favorite !== 'boolean') {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
  }

  try {
    if (session.type === 'user') {
      if (body.favorite) {
        statements.addFavorite.run(session.userId, body.recipe_id, body.recipe_name ?? null, body.thumb ?? null);
      } else {
        statements.removeFavorite.run(session.userId, body.recipe_id);
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (session.type === 'guest') {
      const raw = cookies.get('guest_favorites');
      let favs: Array<{ recipe_id: string; recipe_name?: string; thumb?: string }> = [];
      if (raw) { try { favs = JSON.parse(raw); } catch { favs = []; } }
      if (body.favorite) {
        if (!favs.some((f) => f.recipe_id === body.recipe_id)) {
          favs.push({ recipe_id: body.recipe_id, recipe_name: body.recipe_name ?? null, thumb: body.thumb ?? null });
        }
      } else {
        favs = favs.filter((f) => f.recipe_id !== body.recipe_id);
      }
      cookies.set('guest_favorites', JSON.stringify(favs), { path: '/', httpOnly: false, sameSite: 'strict' });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'db_error' }), { status: 500 });
  }
};

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  const session = JSON.parse(sessionCookie);
  if (session.type === 'user') {
    const rows = statements.getFavoritesByUser.all(session.userId);
    return new Response(JSON.stringify({ favorites: rows }), { status: 200 });
  }
  if (session.type === 'guest') {
    const raw = cookies.get('guest_favorites');
    let rows: Array<{ recipe_id: string; recipe_name?: string; thumb?: string }> = [];
    if (raw) { try { rows = JSON.parse(raw); } catch { rows = []; } }
    return new Response(JSON.stringify({ favorites: rows }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
};