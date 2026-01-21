<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import { Header, MobileDrawer } from '$lib/components/layout';
	import { packageOrder, footer, type PackageId } from '$lib/config/packages';
	import { initExamplesSearch } from '$lib/utils/search';

	let { children } = $props();

	let theme = $state<'dark' | 'light'>('dark');
	let mobileMenuOpen = $state(false);

	// Determine current package from URL
	let currentPackage = $derived.by(() => {
		const path = $page.url.pathname;
		for (const id of packageOrder) {
			if (path.startsWith(`${base}/${id}`)) {
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

		// Initialize examples in search index
		initExamplesSearch(base);

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
	<footer>
		<div class="footer-content">
			<a href={footer.home} class="footer-link">
				<Icon name="home" size={14} />
				<span>Home</span>
			</a>
			<a href={footer.github} class="footer-link">
				<Icon name="github" size={14} />
				<span>GitHub</span>
			</a>
			<span class="footer-text">MIT License</span>
		</div>
	</footer>
</div>

<MobileDrawer open={mobileMenuOpen} packageId={currentPackage} onClose={closeMobileMenu} />

<style>
	.app {
		height: 100vh;
		min-width: var(--app-min-width);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
		min-width: 0;
	}

	footer {
		flex-shrink: 0;
		background: var(--surface-raised);
		border-top: 1px solid var(--border);
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-sm) var(--space-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
	}

	.footer-link {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-muted);
		font-size: var(--font-base);
		font-weight: 500;
		text-decoration: none;
	}

	.footer-link:hover {
		color: var(--text);
		text-decoration: none;
	}

	.footer-text {
		color: var(--text-muted);
		font-size: var(--font-base);
		font-weight: 500;
	}
</style>
