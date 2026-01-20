<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';

	let { children } = $props();

	let theme = $state<'dark' | 'light'>('dark');

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
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />
</svelte:head>

<Tooltip />

<a href="#main-content" class="skip-link">Skip to main content</a>

<div class="app">
	<header>
		<div class="header-content">
			<a href="https://pathsim.org" class="logo" use:tooltip={'Home'}>
				<img src="/favicon.png" alt="PathSim" />
			</a>
			<nav class="nav-links">
				<a href="/pathsim" class="icon-btn" use:tooltip={'PathSim Core'}>
					<Icon name="box" size={20} />
				</a>
				<a href="/chem" class="icon-btn" use:tooltip={'PathSim-Chem'}>
					<Icon name="flask" size={20} />
				</a>
				<a href="/vehicle" class="icon-btn" use:tooltip={'PathSim-Vehicle'}>
					<Icon name="car" size={20} />
				</a>
			</nav>
			<div class="nav-actions">
				<a href="https://view.pathsim.org" class="icon-btn" use:tooltip={'Editor'}>
					<Icon name="play" size={20} />
				</a>
				<a href="https://github.com/milanofthe/pathsim" class="icon-btn" use:tooltip={'GitHub'}>
					<Icon name="github" size={20} />
				</a>
				<button class="icon-btn" onclick={toggleTheme} use:tooltip={'Toggle theme'}>
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
		background: var(--surface-raised);
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
		gap: var(--space-xs);
		flex: 1;
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
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
