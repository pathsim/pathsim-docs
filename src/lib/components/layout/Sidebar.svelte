<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/common/Icon.svelte';
	import { sidebars, type PackageId, type SidebarSection } from '$lib/config/links';

	interface Props {
		packageId: PackageId;
	}

	let { packageId }: Props = $props();

	let sections = $derived(sidebars[packageId] || []);
	let expandedSections = $state<Record<string, boolean>>({});

	// Initialize expanded state from config
	$effect(() => {
		const initial: Record<string, boolean> = {};
		for (const section of sections) {
			initial[section.title] = section.expanded ?? true;
		}
		expandedSections = initial;
	});

	function toggleSection(title: string) {
		expandedSections[title] = !expandedSections[title];
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path;
	}

	function isInSection(sectionPath: string): boolean {
		return $page.url.pathname.startsWith(sectionPath);
	}
</script>

<aside class="sidebar">
	<nav>
		{#each sections as section}
			<div class="sidebar-section">
				<button
					class="section-header"
					onclick={() => toggleSection(section.title)}
					aria-expanded={expandedSections[section.title]}
				>
					<span class="section-title">{section.title}</span>
					<Icon
						name="chevron-down"
						size={12}
						class={expandedSections[section.title] ? 'expanded' : ''}
					/>
				</button>
				{#if expandedSections[section.title]}
					<ul class="section-items">
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
	</nav>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width, 260px);
		height: 100%;
		overflow-y: auto;
		padding: var(--space-lg);
		background: var(--surface);
		border-right: 1px solid var(--border);
	}

	.sidebar-section {
		margin-bottom: var(--space-lg);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-xs) 0;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}

	.section-header :global(svg) {
		color: var(--text-muted);
		transition: transform var(--transition-fast);
	}

	.section-header :global(svg.expanded) {
		transform: rotate(180deg);
	}

	.section-items {
		list-style: none;
		margin: var(--space-sm) 0 0 0;
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
