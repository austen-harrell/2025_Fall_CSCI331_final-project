import { redirect } from '@sveltejs/kit';
import { statements } from '$lib/db.js';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ cookies }) => {
    const sessionCookie = cookies.get('session');
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        
        // If it's a guest session, delete it from the database
        if (session.type === 'guest' && session.sessionId) {
          statements.deleteGuestSession.run(session.sessionId);
          const isProd = process.env.NODE_ENV === 'production';
          cookies.delete('guest_pantry', { path: '/', secure: isProd });
          cookies.delete('guest_favorites', { path: '/', secure: isProd });
        }
      } catch {
        // Invalid session format, just continue with logout
      }
    }
    
    // Clear the session cookie
    const isProd = process.env.NODE_ENV === 'production';
    cookies.delete('session', { path: '/', secure: isProd });
    
    // Redirect to login page
    throw redirect(302, '/login');
  }
};