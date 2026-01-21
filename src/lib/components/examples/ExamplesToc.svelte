<script lang="ts">
	/**
	 * ExamplesToc - Table of contents for examples page
	 * Shows categories with nested examples (styled like ApiToc)
	 */
	import Icon from '$lib/components/common/Icon.svelte';
	import type { GroupedExamples } from '$lib/stores/examplesContext';

	interface Props {
		groups: GroupedExamples[];
		packageId: string;
	}

	let { groups, packageId }: Props = $props();

	// Track expanded categories (all expanded by default)
	let expandedCategories = $state<Set<string>>(new Set(groups.map((g) => g.category.id)));

	// Track active item from scroll position
	let activeId = $state<string | null>(null);

	function toggleCategory(id: string) {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		expandedCategories = newExpanded;
	}

	function scrollTo(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			activeId = id;
		}
	}

	// Set up intersection observer to track active section
	$effect(() => {
		if (typeof window === 'undefined') return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				}
			},
			{
				rootMargin: '-10% 0px -80% 0px',
				threshold: 0
			}
		);

		// Observe all category headings
		for (const group of groups) {
			const catEl = document.getElementById(group.category.id);
			if (catEl) observer.observe(catEl);
		}

		return () => observer.disconnect();
	});
</script>

<div class="examples-toc">
	<div class="label-uppercase examples-toc-header">On this page</div>
	<nav class="examples-toc-nav">
		{#each groups as group}
			{@const isExpanded = expandedCategories.has(group.category.id)}
			<div class="examples-toc-item">
				<button
					class="examples-toc-node has-children"
					class:active={activeId === group.category.id}
					onclick={() => {
						scrollTo(group.category.id);
						toggleCategory(group.category.id);
					}}
				>
					<span class="examples-toc-icon" class:expanded={isExpanded}>
						<Icon name="chevron-down" size={12} />
					</span>
					<span class="examples-toc-name">{group.category.title}</span>
				</button>

				{#if isExpanded}
					<div class="examples-toc-children">
						{#each group.notebooks as notebook}
							<a
								href="/{packageId}/examples/{notebook.slug}"
								class="examples-toc-example"
							>
								{notebook.title}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</nav>
</div>

<style>
	.examples-toc {
		display: flex;
		flex-direction: column;
		padding: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.examples-toc-header {
		margin-bottom: var(--space-sm);
	}

	.examples-toc-nav {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.examples-toc-item {
		display: flex;
		flex-direction: column;
	}

	.examples-toc-node {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.examples-toc-node:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.examples-toc-node.active {
		color: var(--accent);
		background: var(--accent-bg);
	}

	.examples-toc-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transform: rotate(-90deg);
		transition: transform var(--transition-fast);
	}

	.examples-toc-icon.expanded {
		transform: rotate(0deg);
	}

	.examples-toc-name {
		font-size: var(--font-xs);
	}

	.examples-toc-children {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.examples-toc-example {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		padding-left: calc(var(--space-sm) + 12px + var(--space-xs));
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--font-xs);
		color: var(--text-muted);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.examples-toc-example:hover {
		color: var(--text);
		background: var(--surface-hover);
		text-decoration: none;
	}

	.examples-toc-example.active {
		color: var(--accent);
		background: var(--accent-bg);
	}
</style>
