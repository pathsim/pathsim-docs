<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Theme state
	let theme = $state<'dark' | 'light'>('dark');

	onMount(() => {
		// Check for saved preference or system preference
		const saved = localStorage.getItem('theme');
		if (saved === 'light' || saved === 'dark') {
			theme = saved;
		} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
			theme = 'light';
		}
		document.documentElement.setAttribute('data-theme', theme);

		// Handle keyboard shortcuts
		const handleKeydown = (e: KeyboardEvent) => {
			// Cmd/Ctrl+K for search
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				// TODO: Open search dialog
			}
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
</svelte:head>

<a href="#main-content" class="skip-link">Skip to main content</a>

<div class="app">
	{@render children()}
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
