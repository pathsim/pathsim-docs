<script lang="ts">
	/**
	 * Notebook - Main container for rendering Jupyter notebooks
	 * Parses .ipynb and renders all cell types with execution support
	 */
	import Icon from '$lib/components/common/Icon.svelte';
	import MarkdownCell from './MarkdownCell.svelte';
	import CodeCell from './CodeCell.svelte';
	import RawCell from './RawCell.svelte';
	import type { NotebookData, CodeCellData } from '$lib/notebook/types';
	import { isCellHidden } from '$lib/notebook/parser';
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

	// Track pyodide loading state
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
</script>

<article class="notebook">
	{#if pyodideLoading}
		<div class="pyodide-status">
			<Icon name="loader" size={14} />
			<span>{pyodideProgress || 'Loading Python...'}</span>
		</div>
	{/if}

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

	.pyodide-status {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-xs);
		color: var(--text-muted);
		padding: var(--space-xs) var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.pyodide-status :global(svg) {
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
</style>
