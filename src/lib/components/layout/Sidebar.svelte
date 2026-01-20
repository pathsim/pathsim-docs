<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/common/Icon.svelte';
	import { getSidebarItems, type PackageId } from '$lib/config/packages';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let items = $derived(getSidebarItems(packageId));

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<aside class="sidebar">
	<nav class="sidebar-nav">
		{#each items as item}
			<a href={item.path} class="sidebar-item" class:active={isActive(item.path)}>
				{#if item.icon}
					<Icon name={item.icon} size={14} />
				{/if}
				<span>{item.title}</span>
			</a>
		{/each}
	</nav>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--border);
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-sm);
		color: var(--text-muted);
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.sidebar-item:hover {
		color: var(--text);
		background: var(--surface-hover);
		text-decoration: none;
	}

	.sidebar-item.active {
		color: var(--accent);
		background: var(--accent-bg);
	}

	.sidebar-item :global(svg) {
		flex-shrink: 0;
	}
</style>
