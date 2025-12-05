<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	onMount(async () => {
		// Check if user has a session by trying to load dashboard
		try {
			const response = await fetch('/dashboard');
			if (response.ok) {
				goto('/dashboard');
			} else {
				goto('/login');
			}
		} catch {
			goto('/login');
		}
	});
</script>