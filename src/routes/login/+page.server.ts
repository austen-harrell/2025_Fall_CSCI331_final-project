import { fail, redirect } from '@sveltejs/kit';
import { authenticateUser, createGuestSession } from '$lib/auth.js';
import type { Actions } from './$types';

export const actions: Actions = {
  // Named login action
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    // Validate input
    if (!email || !password) {
      return fail(400, {
        error: 'Email and password are required'
      });
    }

    try {
      // Authenticate user
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return fail(401, {
          error: 'Invalid email or password'
        });
      }

      // Set session cookie
      cookies.set('session', JSON.stringify({ 
        userId: user.id, 
        email: user.email,
        type: 'user'
      }), {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS or behind a proxy that terminates TLS
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      // Redirect to dashboard or home page
      throw redirect(302, '/dashboard');
      
    } catch (error: unknown) {
      // Re-throw SvelteKit redirects
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 300 && status < 400) {
          throw error as { status: number };
        }
      }
      return fail(500, { error: 'An error occurred during login' });
    }
  },

  // Guest login action
  guest: async ({ cookies }) => {
    try {
      // Create guest session
      const sessionId = createGuestSession();
      
      // Set guest session cookie
      cookies.set('session', JSON.stringify({
        sessionId,
        type: 'guest'
      }), {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS or behind a proxy that terminates TLS
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      // Redirect to dashboard or home page
      throw redirect(302, '/dashboard');
      
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 300 && status < 400) {
          throw error as { status: number };
        }
      }
      return fail(500, { error: 'An error occurred during guest login' });
    }
  }
};