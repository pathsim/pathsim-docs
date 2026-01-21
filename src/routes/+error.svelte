<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>PathSim Docs - Error</title>
</svelte:head>

<main class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message || 'Something went wrong'}</p>
	<a href="/">Go back home</a>
</main>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: var(--space-xl);
	}

	h1 {
		font-size: 96px;
		color: var(--text-muted);
		margin-bottom: var(--space-md);
	}

	p {
		font-size: var(--font-md);
		color: var(--text-muted);
		margin-bottom: var(--space-xl);
	}

	a {
		padding: var(--space-sm) var(--space-xl);
		background: var(--accent);
		color: white;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 500;
	}

	a:hover {
		background: var(--accent-hover);
		text-decoration: none;
	}
</style>
