<script lang="ts">
	/**
	 * RawCell - Renders raw cell content (RST)
	 * Uses RstRenderer for consistent styling with DocstringRenderer
	 */
	import RstRenderer from '$lib/components/common/RstRenderer.svelte';
	import type { RawCellData } from '$lib/notebook/types';

	interface Props {
		cell: RawCellData;
		/** Base path for resolving relative image paths */
		basePath?: string;
	}

	let { cell, basePath = '' }: Props = $props();

	// Check if content is empty or just whitespace
	let isEmpty = $derived(!cell.source.trim());
</script>

{#if !isEmpty}
	<div class="raw-cell">
		<RstRenderer content={cell.source} {basePath} />
	</div>
{/if}

