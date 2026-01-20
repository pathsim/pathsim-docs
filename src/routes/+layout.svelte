<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/common/Icon.svelte';

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
	<header>
		<div class="header-content">
			<a href="https://pathsim.org" class="logo">
				<img src="/favicon.png" alt="PathSim" />
			</a>
			<nav class="nav-links">
				<a href="/pathsim" class="nav-link">PathSim</a>
				<a href="/chem" class="nav-link">Chem</a>
				<a href="/vehicle" class="nav-link">Vehicle</a>
			</nav>
			<div class="nav-actions">
				<a href="https://view.pathsim.org" class="nav-link">
					<Icon name="play" size={16} />
					Editor
				</a>
				<a href="https://github.com/milanofthe/pathsim" class="icon-btn">
					<Icon name="github" size={20} />
				</a>
				<button class="icon-btn" onclick={toggleTheme} aria-label="Toggle theme">
					<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
				</button>
			</div>
		</div>
	</header>
	<div id="main-content">
		{@render children()}
	</div>
</div>

<style>
	.skip-link {
		position: absolute;
		top: -100px;
		left: 0;
		background: var(--accent);
		color: white;
		padding: var(--space-sm) var(--space-md);
		z-index: 1000;
	}

	.skip-link:focus {
		top: 0;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: var(--space-md) var(--space-lg);
		display: flex;
		align-items: center;
		gap: var(--space-xl);
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo img {
		height: 32px;
		width: auto;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		flex: 1;
	}

	.nav-link {
		color: var(--text-muted);
		font-size: var(--font-sm);
		font-weight: 500;
		transition: color var(--transition-fast);
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.nav-link:hover {
		color: var(--text);
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.icon-btn {
		padding: var(--space-sm);
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-btn:hover {
		color: var(--text);
		background: var(--surface-raised);
	}

	#main-content {
		flex: 1;
	}

	@media (max-width: 768px) {
		.nav-links {
			display: none;
		}
	}
</style>
