<script lang="ts">
	/**
	 * MarkdownCell - Renders markdown content in notebooks
	 * Uses MarkdownRenderer for consistent styling with DocstringRenderer
	 */
	import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
	import type { MarkdownCellData } from '$lib/notebook/types';

	interface Props {
		cell: MarkdownCellData;
	}

	let { cell }: Props = $props();
</script>

<div class="markdown-cell">
	<MarkdownRenderer markdown={cell.source} />
</div>

<style>
	.markdown-cell {
		padding: var(--space-md) 0;
	}

	/* H1 styling specific to notebooks (title) - override global styles */
	.markdown-cell :global(.markdown-content h1) {
		font-size: var(--font-2xl) !important;
		font-weight: 600 !important;
		color: var(--text) !important;
		text-transform: none !important;
		letter-spacing: -0.02em !important;
		margin-bottom: var(--space-lg) !important;
		padding-bottom: var(--space-sm) !important;
		border-bottom: 1px solid var(--border) !important;
	}
</style>
