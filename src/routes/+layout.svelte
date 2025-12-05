<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();

	// no JS needed for logout; form can submit directly

	// Hide global layout on auth routes (login/signup)
	const hideLayout = $derived(($page.url.pathname.startsWith('/login')) || ($page.url.pathname.startsWith('/signup')));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !hideLayout}
<header class="app-header">
	<nav class="nav-ribbon">
		<a href="/dashboard" class="nav-link">Home</a>
		<a href="/recipes" class="nav-link">Browse Recipes</a>
		<a href="/pantry" class="nav-link">My Pantry</a>
	</nav>
	<div class="user-controls">
		<div class="profile">
			<span class="avatar" aria-hidden="true">👤</span>
			<a href="/account" class="username-link">{($page.data?.user?.username) ?? ($page.data?.user?.email ?? 'Guest')}</a>
		</div>
		<form method="POST" action="/logout">
			<button type="submit" class="logout-btn">Logout</button>
		</form>
	</div>
</header>
<main class="app-main">
	{@render children()}
</main>
{:else}
{@render children()}
{/if}

<style>
	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e0e0e0;
		background: #fff;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.nav-ribbon { display: flex; gap: 1rem; }
	.nav-link {
		color: #007acc;
		text-decoration: none;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}
	.nav-link:hover { text-decoration: underline; }

	.user-controls { display: flex; align-items: center; gap: 0.75rem; }
	.profile { display: flex; align-items: center; gap: 0.5rem; color: #333; }
	.avatar { font-size: 1.1rem; }
	.username-link { color:#007acc; text-decoration:none; font-weight:600; }
	.username-link:hover { text-decoration: underline; }
	.logout-btn {
		background-color: #dc3545;
		color: #fff;
		border: none;
		padding: 0.4rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
	}
	.logout-btn:hover { background-color: #c82333; }

	.app-main { padding: 1rem; }
</style>
