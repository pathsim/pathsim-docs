<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { Header, MobileDrawer } from '$lib/components/layout';
	import { packageOrder, type PackageId } from '$lib/config/links';

	let { children } = $props();

	let theme = $state<'dark' | 'light'>('dark');
	let mobileMenuOpen = $state(false);

	// Determine current package from URL
	let currentPackage = $derived.by(() => {
		const path = $page.url.pathname;
		for (const id of packageOrder) {
			if (path.startsWith(`/${id}`)) {
				return id;
			}
		}
		return null;
	});

	onMount(() => {
		const saved = localStorage.getItem('theme');
		if (saved === 'light' || saved === 'dark') {
			theme = saved;
		} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
			theme = 'light';
		}
		document.documentElement.setAttribute('data-theme', theme);

		const handleKeydown = (e: KeyboardEvent) => {
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

	function openMobileMenu() {
		mobileMenuOpen = true;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Close mobile menu on navigation
	$effect(() => {
		$page.url.pathname;
		mobileMenuOpen = false;
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
</svelte:head>

<Tooltip />

<a href="#main-content" class="skip-link">Skip to main content</a>

<div class="app">
	<Header onMenuClick={openMobileMenu} onThemeToggle={toggleTheme} {theme} />
	<div id="main-content" class="main-content">
		{@render children()}
	</div>
</div>

<MobileDrawer open={mobileMenuOpen} packageId={currentPackage} onClose={closeMobileMenu} />

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
