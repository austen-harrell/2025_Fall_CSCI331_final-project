<script>
  import { enhance } from '$app/forms';

  export let form;
</script>

<div class="signup-container">
  <h1>Create Account</h1>
  
  {#if form?.error}
    <div class="error-message">
      {form.error}
    </div>
  {/if}

  <form method="POST" use:enhance>
    <label>
      Email
      <input 
        name="email" 
        type="email" 
        required 
        value={form?.email || ''}
      />
    </label>
    
    <label>
      Username (optional)
      <input 
        name="username" 
        type="text" 
        value={form?.username || ''}
      />
    </label>
    
    <label>
      Password
      <input 
        name="password" 
        type="password" 
        required 
        minlength="6"
      />
    </label>
    
    <label>
      Confirm Password
      <input 
        name="confirmPassword" 
        type="password" 
        required 
        minlength="6"
      />
    </label>
    
    <button type="submit">Create Account</button>
  </form>

  <div class="login-link">
    <p>Already have an account? <a href="/login">Log in</a></p>
  </div>
</div>

<style>
  .signup-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: white;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  .error-message {
    background-color: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #555;
    font-weight: 500;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }

  button {
    background-color: #007acc;
    color: white;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover {
    background-color: #005a9e;
  }

  .login-link {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  .login-link a {
    color: #007acc;
    text-decoration: none;
  }

  .login-link a:hover {
    text-decoration: underline;
  }
</style>