import { redirect } from '@sveltejs/kit';
import { getUserById, validateGuestSession } from '$lib/auth.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  
  if (!sessionCookie) {
    throw redirect(302, '/login');
  }

  try {
    const session = JSON.parse(sessionCookie);
    
    if (session.type === 'user') {
      const user = getUserById(session.userId);
      if (!user) {
        cookies.delete('session', { path: '/' });
        throw redirect(302, '/login');
      }
      
      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          type: 'user'
        }
      };
    } else if (session.type === 'guest') {
      const isValidGuestSession = validateGuestSession(session.sessionId);
      if (!isValidGuestSession) {
        cookies.delete('session', { path: '/' });
        throw redirect(302, '/login');
      }
      
      return {
        user: {
          id: 'guest',
          email: 'guest',
          username: 'Guest User',
          type: 'guest'
        }
      };
    }
  } catch {
    cookies.delete('session', { path: '/' });
    throw redirect(302, '/login');
  }
  
  throw redirect(302, '/login');
};