import { redirect } from '@sveltejs/kit';
import { statements } from '$lib/db.js';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ cookies }) => {
    const sessionCookie = cookies.get('session');
    
    // If there's a session, try to clean it up
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        
        // If it's a guest session, delete it from the database
        if (session.type === 'guest' && session.sessionId) {
          statements.deleteGuestSession.run(session.sessionId);
        }
      } catch {
        // Invalid session format, just continue with logout
      }
    }
    
    // Clear the session cookie
    cookies.delete('session', { path: '/' });
    
    // Redirect to login page
    throw redirect(302, '/login');
  }
};