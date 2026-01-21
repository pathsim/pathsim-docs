<script lang="ts">
	/**
	 * MarkdownCell - Renders markdown content with KaTeX math support
	 */
	import { onMount } from 'svelte';
	import { renderMarkdown } from '$lib/utils/markdownRenderer';
	import type { MarkdownCellData } from '$lib/notebook/types';

	interface Props {
		cell: MarkdownCellData;
	}

	let { cell }: Props = $props();

	let html = $state('');
	let loading = $state(true);

	onMount(async () => {
		html = await renderMarkdown(cell.source);
		loading = false;
	});

	// Re-render when source changes
	$effect(() => {
		const source = cell.source;
		renderMarkdown(source).then((rendered) => {
			html = rendered;
		});
	});
</script>

<div class="markdown-cell">
	{#if loading}
		<div class="loading">Loading...</div>
	{:else}
		<div class="markdown-content prose">
			{@html html}
		</div>
	{/if}
</div>

<style>
	.markdown-cell {
		padding: var(--space-md) 0;
	}

	.markdown-content {
		/* Remove top margin from first element */
		:global(> *:first-child) {
			margin-top: 0;
		}

		/* Remove bottom margin from last element */
		:global(> *:last-child) {
			margin-bottom: 0;
		}

		/* Style H1 as notebook title */
		:global(h1) {
			font-size: var(--font-2xl);
			margin-bottom: var(--space-lg);
			padding-bottom: var(--space-sm);
			border-bottom: 1px solid var(--border);
		}

		/* Style subsequent headings */
		:global(h2) {
			font-size: var(--font-xl);
			margin-top: var(--space-xl);
			margin-bottom: var(--space-md);
		}

		:global(h3) {
			font-size: var(--font-lg);
			margin-top: var(--space-lg);
			margin-bottom: var(--space-sm);
		}
	}

	.loading {
		color: var(--text-muted);
		font-size: var(--font-sm);
		padding: var(--space-md);
	}
</style>
