<script>
	import { enhance } from '$app/forms';
	export let form;
</script>

<div class="auth-card">
	<h1 class="auth-title">Log in</h1>
	{#if form?.error}
		<div class="form-error">{form.error}</div>
	{/if}
	<form method="POST" action="?/login" class="auth-form" use:enhance>
		<label class="auth-label">
			<span>Email</span>
			<input name="email" type="email" class="auth-input" required />
		</label>
		<label class="auth-label">
			<span>Password</span>
			<input name="password" type="password" class="auth-input" required />
		</label>
		<button class="primary-btn" type="submit">Log in</button>
	</form>
</div>

<div class="account-options">
	<p>Don't have an account?</p>
	<div class="button-group">
		<a href="/signup" class="create-account-btn">Create Account</a>
		<form method="POST" action="?/guest" style="display: inline;" use:enhance>
			<button type="submit" class="guest-btn">Continue as Guest</button>
		</form>
	</div>
</div>

<style>
	/* Container */
	.auth-card {
		max-width: 420px;
		margin: 2rem auto 1rem;
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #fff;
		box-shadow: 0 1px 2px rgba(0,0,0,0.04);
	}

	.auth-title {
		margin: 0 0 1rem 0;
		text-align: center;
		color: #333;
		font-size: 1.5rem;
		font-weight: 600;
	}

	/* Form elements */
	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-label {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		color: #555;
		font-weight: 500;
	}

	.auth-input {
		padding: 0.625rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		background: #fff;
	}

	.auth-input:focus {
		outline: none;
		border-color: #007acc;
		box-shadow: 0 0 0 2px rgba(0,122,204,0.15);
	}

	/* Buttons */
	.primary-btn {
		background-color: #007acc;
		color: #fff;
		padding: 0.6rem 1rem;
		border: 1px solid #007acc;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: background-color 0.2s ease, box-shadow 0.2s ease;
	}

	.primary-btn:hover {
		background-color: #005a9e;
		box-shadow: 0 2px 6px rgba(0,90,158,0.25);
	}

	.form-error {
		background-color: #fee;
		color: #c33;
		padding: 0.5rem;
		border: 1px solid #fcc;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.account-options {
		margin-top: 1rem;
		text-align: center;
		padding: 1rem;
		border-top: 1px solid #e0e0e0;
	}
	
	.account-options p {
		margin-bottom: 1rem;
		color: #666;
	}
	
	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		align-items: center;
	}
	
	.create-account-btn {
		background-color: #007acc;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		text-decoration: none;
		cursor: pointer;
		transition: background-color 0.2s;
		border: 1px solid #007acc;
	}
	
	.create-account-btn:hover {
		background-color: #005a9e;
	}
	
	.guest-btn {
		background-color: #f5f5f5;
		border: 1px solid #ddd;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.guest-btn:hover {
		background-color: #e9e9e9;
	}
</style>
