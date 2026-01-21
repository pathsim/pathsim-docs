<script lang="ts">
	/**
	 * CodeCell - Renders code cell with execution capability
	 * Shows static outputs initially, switches to live output after execution
	 */
	import NotebookCell from '$lib/components/common/NotebookCell.svelte';
	import CellOutput from './CellOutput.svelte';
	import type { CodeCellData } from '$lib/notebook/types';
	import { transformCodeForPyodide } from '$lib/notebook/parser';
	import { notebookStore } from '$lib/stores/notebookStore';

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

	// Track if this cell has been executed in this session
	let hasExecuted = $state(false);

	// Subscribe to cell status from store
	let cellStatus = $state<'idle' | 'pending' | 'running' | 'success' | 'error'>('idle');

	$effect(() => {
		const unsubscribe = notebookStore.subscribe((state) => {
			const cellState = state.cells.get(cell.id);
			if (cellState) {
				cellStatus = cellState.status;
				if (cellState.status === 'success' || cellState.status === 'error') {
					hasExecuted = true;
				}
			}
		});
		return unsubscribe;
	});

	// Show static outputs only if:
	// 1. showStaticOutputs is true
	// 2. Cell hasn't been executed yet
	// 3. Cell has static outputs
	let shouldShowStaticOutputs = $derived(
		showStaticOutputs && !hasExecuted && cell.outputs.length > 0
	);

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
	/>

	{#if shouldShowStaticOutputs}
		<div class="static-outputs">
			<div class="static-outputs-label">Stored output:</div>
			<CellOutput outputs={cell.outputs} />
		</div>
	{/if}
</div>

<style>
	.code-cell-wrapper {
		margin-bottom: var(--space-lg);
	}

	.static-outputs {
		margin-top: -1px; /* Overlap with NotebookCell border */
		border: 1px solid var(--border);
		border-top: none;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		overflow: hidden;
	}

	.static-outputs-label {
		padding: var(--space-xs) var(--space-md);
		background: var(--surface-raised);
		font-size: var(--font-xs);
		color: var(--text-disabled);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--border);
	}
</style>
