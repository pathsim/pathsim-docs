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
		/* Spacing handled by parent .notebook-cells gap */
	}
</style>
