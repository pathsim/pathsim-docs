<script lang="ts">
	/**
	 * CodeCell - Renders code cell with execution capability
	 * Shows static outputs initially, switches to live output after execution
	 */
	import NotebookCell from '$lib/components/common/NotebookCell.svelte';
	import type { CodeCellData } from '$lib/notebook/types';
	import { transformCodeForPyodide } from '$lib/notebook/parser';

	interface Props {
		cell: CodeCellData;
		/** Index in notebook for prerequisite tracking */
		index: number;
		/** IDs of previous code cells (for prerequisites) */
		prerequisites?: string[];
		/** Whether to show static outputs (before any execution) */
		showStaticOutputs?: boolean;
	}

	let {
		cell,
		index,
		prerequisites = [],
		showStaticOutputs = true
	}: Props = $props();

	// Transform code for Pyodide compatibility
	let transformedCode = $derived(transformCodeForPyodide(cell.source));
</script>

<div class="code-cell-wrapper">
	<NotebookCell
		id={cell.id}
		code={transformedCode}
		title="Python"
		editable={true}
		{prerequisites}
		staticOutputs={showStaticOutputs ? cell.outputs : []}
	/>
</div>

<style>
	.code-cell-wrapper {
		/* Spacing handled by parent .notebook-cells gap */
	}
</style>
