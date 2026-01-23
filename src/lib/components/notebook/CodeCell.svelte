<script lang="ts">
	/**
	 * CodeCell - Renders code cell with execution capability
	 * Shows static outputs initially, switches to live output after execution
	 */
	import NotebookCell from '$lib/components/common/NotebookCell.svelte';
	import type { CodeCellData } from '$lib/notebook/types';
	import type { CellOutputData } from '$lib/notebook/loader';
	import { transformCodeForPyodide } from '$lib/notebook/parser';

	interface Props {
		cell: CodeCellData;
		/** Index in notebook for prerequisite tracking */
		index: number;
		/** IDs of previous code cells (for prerequisites) */
		prerequisites?: string[];
		/** Whether to show static outputs (before any execution) */
		showStaticOutputs?: boolean;
		/** Pre-computed output from build */
		precomputedOutput?: CellOutputData | null;
		/** Figure URLs from pre-computed output */
		figureUrls?: string[];
		/** Callback to advance to next cell after execution */
		onadvance?: () => void;
	}

	let {
		cell,
		index,
		prerequisites = [],
		showStaticOutputs = true,
		precomputedOutput = null,
		figureUrls = [],
		onadvance = undefined
	}: Props = $props();

	// Reference to NotebookCell for focusing
	let notebookCellRef = $state<{ focus: () => void } | undefined>(undefined);

	/** Focus this cell's editor */
	export function focus() {
		notebookCellRef?.focus();
	}

	// Transform code for Pyodide compatibility
	let transformedCode = $derived(transformCodeForPyodide(cell.source));

	// Use pre-computed outputs if available, otherwise fall back to inline notebook outputs
	let hasPrecomputedOutput = $derived(
		precomputedOutput?.stdout || precomputedOutput?.stderr || figureUrls.length > 0
	);
</script>

<div class="code-cell-wrapper">
	<NotebookCell
		bind:this={notebookCellRef}
		id={cell.id}
		code={transformedCode}
		title="Python"
		editable={true}
		{prerequisites}
		staticOutputs={showStaticOutputs && !hasPrecomputedOutput ? cell.outputs : []}
		precomputedStdout={showStaticOutputs ? precomputedOutput?.stdout : null}
		precomputedStderr={showStaticOutputs ? precomputedOutput?.stderr : null}
		{figureUrls}
		{onadvance}
	/>
</div>

<style>
	.code-cell-wrapper {
		margin: var(--space-md) 0;
		min-width: 0;
	}
</style>
