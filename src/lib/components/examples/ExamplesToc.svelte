<script lang="ts">
	/**
	 * ExamplesToc - Table of contents for examples page
	 * Shows categories with nested examples
	 */
	import Icon from '$lib/components/common/Icon.svelte';
	import type { GroupedExamples } from '$lib/stores/examplesContext';

	interface Props {
		groups: GroupedExamples[];
		packageId: string;
	}

	let { groups, packageId }: Props = $props();

	// Track expanded categories
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

		// Observe all category headings and example tiles
		for (const group of groups) {
			const catEl = document.getElementById(group.category.id);
			if (catEl) observer.observe(catEl);
		}

		return () => observer.disconnect();
	});
</script>

<div class="examples-toc">
	<div class="label-uppercase toc-header">On this page</div>
	<nav class="toc-nav">
		{#each groups as group}
			{@const isExpanded = expandedCategories.has(group.category.id)}
			<div class="toc-group">
				<button
					class="toc-category"
					class:active={activeId === group.category.id}
					onclick={() => {
						scrollTo(group.category.id);
						toggleCategory(group.category.id);
					}}
				>
					<span class="toc-icon" class:expanded={isExpanded}>
						<Icon name="chevron-down" size={12} />
					</span>
					<span>{group.category.title}</span>
				</button>

				{#if isExpanded}
					<div class="toc-examples">
						{#each group.notebooks as notebook}
							<a
								href="/{packageId}/examples/{notebook.slug}"
								class="toc-example"
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

	.toc-header {
		margin-bottom: var(--space-sm);
	}

	.toc-nav {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.toc-group {
		display: flex;
		flex-direction: column;
	}

	.toc-category {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-xs) 0;
		background: none;
		border: none;
		font-size: var(--font-sm);
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.toc-category:hover {
		color: var(--text);
	}

	.toc-category.active {
		color: var(--accent);
	}

	.toc-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transform: rotate(-90deg);
		transition: transform var(--transition-fast);
	}

	.toc-icon.expanded {
		transform: rotate(0deg);
	}

	.toc-examples {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding-left: calc(12px + var(--space-xs));
	}

	.toc-example {
		display: block;
		padding: var(--space-xs) 0;
		font-size: var(--font-xs);
		color: var(--text-muted);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.toc-example:hover {
		color: var(--text);
		text-decoration: none;
	}
</style>
