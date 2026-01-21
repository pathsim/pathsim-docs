<script lang="ts">
	/**
	 * ExamplesToc - Table of contents for examples page
	 * Shows categories for quick navigation
	 */
	import type { Category } from '$lib/notebook/manifest';

	interface Props {
		categories: Category[];
	}

	let { categories }: Props = $props();

	// Track active category from scroll position
	let activeId = $state<string | null>(null);

	function scrollToCategory(id: string) {
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
		for (const category of categories) {
			const el = document.getElementById(category.id);
			if (el) observer.observe(el);
		}

		return () => observer.disconnect();
	});
</script>

<div class="examples-toc">
	<div class="label-uppercase toc-header">On this page</div>
	<nav class="toc-nav">
		{#each categories as category}
			<button
				class="toc-item"
				class:active={activeId === category.id}
				onclick={() => scrollToCategory(category.id)}
			>
				{category.title}
			</button>
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
		gap: 2px;
	}

	.toc-item {
		display: flex;
		align-items: center;
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

	.toc-item:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.toc-item.active {
		color: var(--accent);
		background: var(--accent-bg);
	}
</style>
