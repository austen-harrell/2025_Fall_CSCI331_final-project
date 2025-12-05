<script>
  import { enhance } from '$app/forms';
  export let form;
</script>

<section class="account">
  <h1>Account Settings</h1>

  {#if form?.success}
    <div class="success">{form.success}</div>
  {/if}
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  <form method="POST" use:enhance class="settings-form">
    <fieldset>
      <legend>Profile</legend>
      <label>
        <span>Username</span>
        <input name="username" type="text" value={form?.username ?? ''} />
      </label>
    </fieldset>

    <fieldset>
      <legend>Change Password</legend>
      <label>
        <span>Current Password</span>
        <input name="currentPassword" type="password" autocomplete="current-password" />
      </label>
      <label>
        <span>New Password</span>
        <input name="newPassword" type="password" autocomplete="new-password" />
      </label>
      <label>
        <span>Confirm New Password</span>
        <input name="confirmNewPassword" type="password" autocomplete="new-password" />
      </label>
    </fieldset>

    <div class="actions">
      <button type="submit" class="primary">Save Changes</button>
    </div>
  </form>
</section>

<style>
  .account { max-width: 640px; margin: 2rem auto; }
  h1 { margin-bottom: 1rem; }
  .success { background:#e6ffed; color:#1f7a3b; border:1px solid #b3f0c3; padding:.75rem; border-radius:6px; margin-bottom:1rem; }
  .error { background:#fee; color:#c33; border:1px solid #fcc; padding:.75rem; border-radius:6px; margin-bottom:1rem; }
  .settings-form { display:flex; flex-direction:column; gap:1rem; }
  fieldset { border:1px solid #e0e0e0; border-radius:8px; padding:1rem; }
  legend { padding:0 .5rem; color:#333; font-weight:600; }
  label { display:flex; flex-direction:column; gap:.375rem; margin-top:.5rem; }
  input { padding:.625rem .75rem; border:1px solid #ddd; border-radius:6px; }
  input:focus { outline:none; border-color:#007acc; box-shadow:0 0 0 2px rgba(0,122,204,.15); }
  .actions { display:flex; justify-content:flex-end; }
  .primary { background:#007acc; color:#fff; border:1px solid #007acc; border-radius:6px; padding:.6rem 1rem; cursor:pointer; }
  .primary:hover { background:#005a9e; }
</style>