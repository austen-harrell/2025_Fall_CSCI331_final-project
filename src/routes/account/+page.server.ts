import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { statements, type User } from '$lib/db.js';
import { authenticateUser, hashPassword } from '$lib/auth.js';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  if (!sessionCookie) throw redirect(302, '/login');
  const session = JSON.parse(sessionCookie);
  if (session.type !== 'user') throw redirect(302, '/login');
  const user = statements.getUserById.get(session.userId) as User;
  if (!user) throw redirect(302, '/login');
  return { username: user.username ?? '' };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = (data.get('username') as string) || '';
    const currentPassword = (data.get('currentPassword') as string) || '';
    const newPassword = (data.get('newPassword') as string) || '';
    const confirmNewPassword = (data.get('confirmNewPassword') as string) || '';

    const sessionCookie = cookies.get('session');
    if (!sessionCookie) return fail(401, { error: 'Not authenticated' });
    const session = JSON.parse(sessionCookie);
    if (session.type !== 'user') return fail(401, { error: 'Not authenticated' });

    // Update username if provided
    try {
      const user = statements.getUserById.get(session.userId) as User;
      if (!user) return fail(401, { error: 'Not authenticated' });

      if (username && username !== user.username) {
        statements.updateUser.run(user.email, username, user.id);
      }

      // Handle password change if fields are provided
      const wantsPasswordChange = newPassword || confirmNewPassword || currentPassword;
      if (wantsPasswordChange) {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
          return fail(400, { error: 'Please fill all password fields', username });
        }
        if (newPassword.length < 6) {
          return fail(400, { error: 'New password must be at least 6 characters', username });
        }
        if (newPassword !== confirmNewPassword) {
          return fail(400, { error: 'New passwords do not match', username });
        }

        // Verify current password
        const authed = await authenticateUser(user.email, currentPassword);
        if (!authed) {
          return fail(401, { error: 'Current password is incorrect', username });
        }

        // Update password
        const hash = await hashPassword(newPassword);
        statements.updatePassword.run(hash, user.id);
      }

      // Refresh session cookie with updated username
      const updated = statements.getUserById.get(session.userId) as User;
      cookies.set('session', JSON.stringify({ userId: updated.id, email: updated.email, type: 'user' }), {
        path: '/', httpOnly: true, secure: false, sameSite: 'strict', maxAge: 60 * 60 * 24 * 7
      });

      return { success: 'Account updated successfully', username: updated.username };
    } catch (error: unknown) {
      console.error('Account update error:', error);
      return fail(500, { error: 'Failed to update account', username });
    }
  }
};