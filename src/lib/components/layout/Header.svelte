<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { packages, packageOrder, nav, type PackageId } from '$lib/config/links';

	interface Props {
		onMenuClick?: () => void;
		onThemeToggle: () => void;
		theme: 'dark' | 'light';
	}

	let { onMenuClick, onThemeToggle, theme }: Props = $props();

	// Determine active package from current path
	let activePackage = $derived.by(() => {
		const path = $page.url.pathname;
		for (const id of packageOrder) {
			if (path.startsWith(`/${id}`)) {
				return id;
			}
		}
		return null;
	});
</script>

<header>
	<div class="header-content">
		<div class="header-left">
			{#if onMenuClick}
				<button class="icon-btn menu-btn" onclick={onMenuClick} use:tooltip={'Menu'}>
					<Icon name="menu" size={14} />
				</button>
			{/if}
			<a href="/" class="logo" use:tooltip={'Docs Home'}>
				<img src="/favicon.png" alt="PathSim" />
			</a>
			<nav class="package-tabs">
				{#each packageOrder as id}
					{@const pkg = packages[id]}
					<a
						href={pkg.docs}
						class="package-tab"
						class:active={activePackage === id}
						use:tooltip={pkg.name}
					>
						{pkg.shortName}
					</a>
				{/each}
			</nav>
		</div>
		<div class="header-right header-actions">
			<a href={nav.home} class="icon-btn" use:tooltip={'Home'}>
				<Icon name="home" size={14} />
			</a>
			<a href={nav.tryOnline} class="icon-btn" use:tooltip={'Editor'}>
				<Icon name="play" size={14} />
			</a>
			<a href={nav.github} class="icon-btn" use:tooltip={'GitHub'}>
				<Icon name="github" size={14} />
			</a>
			<button class="icon-btn" onclick={onThemeToggle} use:tooltip={'Toggle theme'}>
				<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
			</button>
		</div>
	</div>
</header>

<style>
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
		padding: var(--space-sm) var(--space-lg);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.menu-btn {
		display: none;
	}

	@media (max-width: 768px) {
		.menu-btn {
			display: flex;
		}
	}

	.logo {
		display: flex;
		align-items: center;
	}

	.logo img {
		height: 24px;
		width: auto;
	}

	.package-tabs {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	@media (max-width: 600px) {
		.package-tabs {
			display: none;
		}
	}

	.package-tab {
		padding: var(--space-xs) var(--space-md);
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.package-tab:hover {
		color: var(--text);
		background: var(--surface-hover);
		text-decoration: none;
	}

	.package-tab.active {
		color: var(--accent);
		background: var(--accent-bg);
	}
</style>
