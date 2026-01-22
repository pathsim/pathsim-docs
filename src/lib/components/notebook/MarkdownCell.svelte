<script lang="ts">
	/**
	 * MarkdownCell - Renders markdown content in notebooks
	 * Uses MarkdownRenderer for consistent styling with DocstringRenderer
	 */
	import MarkdownRenderer from '$lib/components/common/MarkdownRenderer.svelte';
	import type { MarkdownCellData } from '$lib/notebook/types';

	interface Props {
		cell: MarkdownCellData;
		/** Base path for resolving relative image URLs */
		basePath?: string;
	}

	let { cell, basePath = '' }: Props = $props();
</script>

<div class="markdown-cell">
	<MarkdownRenderer markdown={cell.source} {basePath} />
</div>

