<script lang="ts">
	/**
	 * Notebook - Main container for rendering Jupyter notebooks
	 * Parses .ipynb and renders all cell types with execution support
	 */
	import { onDestroy } from 'svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';
	import MarkdownCell from './MarkdownCell.svelte';
	import CodeCell from './CodeCell.svelte';
	import RawCell from './RawCell.svelte';
	import type { NotebookData, CodeCellData } from '$lib/notebook/types';
	import { isCellHidden } from '$lib/notebook/parser';
	import { notebookStore } from '$lib/stores/notebookStore';
	import { pyodideState } from '$lib/stores/pyodideStore';

	interface Props {
		notebook: NotebookData;
		/** Base path for resolving relative paths (images, etc.) */
		basePath?: string;
		/** Show stored outputs from notebook file */
		showStaticOutputs?: boolean;
	}

	let { notebook, basePath = '', showStaticOutputs = true }: Props = $props();

	// Get list of code cells with their indices
	let codeCells = $derived(
		notebook.cells
			.map((cell, index) => ({ cell, index }))
			.filter((item): item is { cell: CodeCellData; index: number } =>
				item.cell.cell_type === 'code' && !isCellHidden(item.cell)
			)
	);

	// Build prerequisites map: each code cell depends on all previous code cells
	let prerequisitesMap = $derived(
		new Map(
			codeCells.map((item, idx) => [
				item.cell.id,
				codeCells.slice(0, idx).map((prev) => prev.cell.id)
			])
		)
	);

	// Track execution state
	let isRunningAll = $state(false);
	let pyodideLoading = $state(false);
	let pyodideProgress = $state('');

	// Subscribe to pyodide state
	$effect(() => {
		const unsubscribe = pyodideState.subscribe((state) => {
			pyodideLoading = state.status === 'loading';
			pyodideProgress = state.progress;
		});
		return unsubscribe;
	});

	/**
	 * Run all code cells in order
	 */
	async function runAll() {
		if (isRunningAll || codeCells.length === 0) return;

		isRunningAll = true;

		// Run the last cell - it will auto-run all prerequisites
		const lastCell = codeCells[codeCells.length - 1];
		await notebookStore.runWithPrerequisites(lastCell.cell.id);

		isRunningAll = false;
	}

	/**
	 * Reset all cells
	 */
	async function resetAll() {
		notebookStore.resetAllCells();

		// Also reset Pyodide namespace
		try {
			const { reset } = await import('$lib/pyodide');
			await reset();
		} catch {
			// Pyodide might not be loaded yet
		}
	}

	// Clean up on destroy
	onDestroy(() => {
		// Don't reset the store here - other notebooks might be using it
	});
</script>

<article class="notebook">
	<header class="notebook-header">
		<div class="notebook-actions">
			{#if pyodideLoading}
				<div class="pyodide-status">
					<Icon name="loader" size={14} />
					<span>{pyodideProgress || 'Loading Python...'}</span>
				</div>
			{/if}
			<button
				class="notebook-btn"
				onclick={runAll}
				disabled={isRunningAll || codeCells.length === 0}
				use:tooltip={'Run all cells'}
			>
				{#if isRunningAll}
					<Icon name="loader" size={14} />
					<span>Running...</span>
				{:else}
					<Icon name="play" size={14} />
					<span>Run All</span>
				{/if}
			</button>
			<button
				class="notebook-btn ghost"
				onclick={resetAll}
				use:tooltip={'Reset all cells'}
			>
				<Icon name="rotate" size={14} />
				<span>Reset</span>
			</button>
		</div>
	</header>

	<div class="notebook-cells">
		{#each notebook.cells as cell, index (cell.id)}
			{#if !isCellHidden(cell)}
				{#if cell.cell_type === 'markdown'}
					<MarkdownCell {cell} />
				{:else if cell.cell_type === 'code'}
					<CodeCell
						{cell}
						{index}
						prerequisites={prerequisitesMap.get(cell.id) || []}
						{showStaticOutputs}
					/>
				{:else if cell.cell_type === 'raw'}
					<RawCell {cell} {basePath} />
				{/if}
			{/if}
		{/each}
	</div>
</article>

<style>
	.notebook {
		max-width: var(--content-max-width);
		margin: 0 auto;
	}

	.notebook-header {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-lg);
		margin-bottom: var(--space-md);
	}

	.notebook-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.pyodide-status {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-xs);
		color: var(--text-muted);
		padding: var(--space-xs) var(--space-sm);
	}

	.pyodide-status :global(svg) {
		animation: spin 1s linear infinite;
	}

	.notebook-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-sm);
		font-weight: 500;
		background: var(--success);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.notebook-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--success) 85%, white);
	}

	.notebook-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.notebook-btn.ghost {
		background: transparent;
		color: var(--text-muted);
		border: 1px solid var(--border);
	}

	.notebook-btn.ghost:hover:not(:disabled) {
		background: var(--surface-raised);
		color: var(--text);
	}

	.notebook-btn :global(svg) {
		flex-shrink: 0;
	}

	.notebook-btn:not(.ghost) :global(svg) {
		animation: none;
	}

	.notebook-btn:disabled :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.notebook-cells {
		display: flex;
		flex-direction: column;
	}

	/* Responsive */
	@media (max-width: 600px) {
		.notebook-header {
			flex-direction: column;
			align-items: stretch;
		}

		.notebook-actions {
			justify-content: flex-end;
		}

		.notebook-btn span {
			display: none;
		}

		.notebook-btn {
			padding: var(--space-sm);
		}

		.pyodide-status span {
			display: none;
		}
	}
</style>
