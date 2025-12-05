import { fail, redirect } from '@sveltejs/kit';
import { createUser } from '$lib/auth.js';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const username = data.get('username') as string;
    const password = data.get('password') as string;
    const confirmPassword = data.get('confirmPassword') as string;

    // Validate input
    if (!email || !password || !confirmPassword) {
      return fail(400, {
        error: 'Email, password, and password confirmation are required',
        email,
        username
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        error: 'Please enter a valid email address',
        email,
        username
      });
    }

    // Password validation
    if (password.length < 3) {
      return fail(400, {
        error: 'Password must be at least 6 characters long',
        email,
        username
      });
    }

    // Password confirmation
    if (password !== confirmPassword) {
      return fail(400, {
        error: 'Passwords do not match',
        email,
        username
      });
    }

    try {
      // Create user
      const user = await createUser(email, password, username || undefined);

      // Set session cookie
      cookies.set('session', JSON.stringify({
        userId: user.id,
        email: user.email,
        type: 'user'
      }), {
        path: '/',
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      // Redirect to dashboard
      throw redirect(302, '/dashboard');

    } catch (error: unknown) {
      // If SvelteKit redirect was thrown, rethrow it (don't treat as an error)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 300 && status < 400) {
          throw error as { status: number };
        }
      }

      if (error instanceof Error && error.message.includes('already exists')) {
        return fail(400, {
          error: 'An account with this email already exists',
          email,
          username
        });
      }

      // Log unexpected errors
      console.error('Signup error:', error);
      return fail(500, {
        error: 'An error occurred while creating your account',
        email,
        username
      });
    }
  }
};