import type { LayoutServerLoad } from './$types';
import { getUserById, validateGuestSession } from '$lib/auth.js';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) return { user: null };

  try {
    const session = JSON.parse(sessionCookie);
    if (session.type === 'user' && typeof session.userId === 'number') {
      const user = getUserById(session.userId);
      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            type: 'user'
          }
        };
      }
    }
    if (session.type === 'guest' && typeof session.sessionId === 'string') {
      const isValid = validateGuestSession(session.sessionId);
      if (isValid) {
        return {
          user: {
            id: 'guest',
            email: 'guest',
            username: 'Guest User',
            type: 'guest'
          }
        };
      }
    }
  } catch {
    // ignore malformed cookies
  }
  // fallback: clear invalid session
  cookies.delete('session', { path: '/' });
  return { user: null };
};