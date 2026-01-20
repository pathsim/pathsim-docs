<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/common/Icon.svelte';
	import { sidebars, type PackageId } from '$lib/config/links';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let sections = $derived(sidebars[packageId] || []);
	let collapsedSections = $state<Set<string>>(new Set());

	function toggleSection(title: string) {
		collapsedSections = new Set(collapsedSections);
		if (collapsedSections.has(title)) {
			collapsedSections.delete(title);
		} else {
			collapsedSections.add(title);
		}
	}

	function isExpanded(title: string): boolean {
		return !collapsedSections.has(title);
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}
</script>

<aside class="sidebar">
	<div class="sidebar-content">
		{#each sections as section}
			<div class="category">
				<button class="category-header" onclick={() => toggleSection(section.title)}>
					<span class="chevron" class:expanded={isExpanded(section.title)}>
						<Icon name="chevron-right" size={12} />
					</span>
					<span class="category-name">{section.title}</span>
				</button>
				{#if isExpanded(section.title)}
					<ul class="category-items">
						{#each section.items as item}
							<li>
								<a href={item.path} class="sidebar-item" class:active={isActive(item.path)}>
									{#if item.icon}
										<Icon name={item.icon} size={14} />
									{/if}
									<span>{item.title}</span>
								</a>
								{#if item.children && item.children.length > 0}
									<ul class="sidebar-children">
										{#each item.children as child}
											<li>
												<a
													href={child.path}
													class="sidebar-item child"
													class:active={isActive(child.path)}
												>
													<span>{child.title}</span>
												</a>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--surface-raised);
		border-right: 1px solid var(--border);
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-md);
		background: var(--surface);
	}

	.category {
		margin-bottom: var(--space-lg);
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-xs) 0;
		margin-bottom: var(--space-sm);
		font-size: 10px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.category-header:hover {
		color: var(--text);
	}

	.category-header .chevron {
		display: flex;
		transition: transform var(--transition-fast);
		flex-shrink: 0;
	}

	.category-header .chevron.expanded {
		transform: rotate(90deg);
	}

	.category-header .category-name {
		flex: 1;
	}

	.category-items {
		list-style: none;
		margin: 0;
		padding: 0;
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

	.sidebar-children {
		list-style: none;
		margin: 0;
		padding: 0 0 0 var(--space-xl);
	}

	.sidebar-item.child {
		font-size: var(--font-xs);
		padding: var(--space-xs) var(--space-md);
	}
</style>
