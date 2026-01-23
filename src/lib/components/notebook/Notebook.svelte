<script lang="ts">
	/**
	 * Notebook - Main container for rendering Jupyter notebooks
	 * Parses .ipynb and renders all cell types with execution support
	 */
	import { onMount } from 'svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import MarkdownCell from './MarkdownCell.svelte';
	import CodeCell from './CodeCell.svelte';
	import RawCell from './RawCell.svelte';
	import type { NotebookData, CodeCellData } from '$lib/notebook/types';
	import type { NotebookOutputs } from '$lib/notebook/loader';
	import { isCellHidden } from '$lib/notebook/parser';
	import { pyodideState } from '$lib/stores/pyodideStore';

	interface Props {
		notebook: NotebookData;
		/** Base path for resolving relative paths (images, etc.) */
		basePath?: string;
		/** Pre-computed outputs from build (cell index -> outputs) */
		precomputedOutputs?: NotebookOutputs | null;
		/** Base path for figure URLs */
		figuresBasePath?: string;
		/** Show stored outputs from notebook file */
		showStaticOutputs?: boolean;
	}

	let {
		notebook,
		basePath = '',
		precomputedOutputs = null,
		figuresBasePath = '',
		showStaticOutputs = true
	}: Props = $props();

	// Get list of code cells with their indices
	let codeCells = $derived(
		notebook.cells
			.map((cell, index) => ({ cell, index }))
			.filter((item): item is { cell: CodeCellData; index: number } =>
				item.cell.cell_type === 'code' && !isCellHidden(item.cell)
			)
	);

	// Track references to code cells for advancing focus
	let codeCellRefs: Record<string, { focus: () => void } | undefined> = {};

	function createAdvanceCallback(cellId: string) {
		return () => {
			// Find index of current cell in codeCells
			const currentIndex = codeCells.findIndex(item => item.cell.id === cellId);
			if (currentIndex >= 0 && currentIndex < codeCells.length - 1) {
				// Focus the next code cell
				const nextCellId = codeCells[currentIndex + 1].cell.id;
				const nextCellRef = codeCellRefs[nextCellId];
				nextCellRef?.focus();
			}
		};
	}

	// Reference to notebook container for checking focus
	let notebookRef = $state<HTMLElement | undefined>(undefined);

	// Check if any code cell editor is currently focused
	function isCodeCellFocused(): boolean {
		const activeElement = document.activeElement;
		if (!activeElement || !notebookRef) return false;
		// Check if active element is inside a CodeMirror editor within the notebook
		return notebookRef.contains(activeElement) &&
			activeElement.closest('.cm-editor') !== null;
	}

	// Global keyboard handler to focus first cell when none is selected
	function handleGlobalKeydown(event: KeyboardEvent) {
		// Only handle Ctrl+Enter or Ctrl+Shift+Enter
		if (!event.ctrlKey || event.key !== 'Enter') return;

		// If a code cell is already focused, let it handle the event
		if (isCodeCellFocused()) return;

		// Focus the first code cell
		if (codeCells.length > 0) {
			const firstCellId = codeCells[0].cell.id;
			const firstCellRef = codeCellRefs[firstCellId];
			firstCellRef?.focus();
			event.preventDefault();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeydown);
		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
		};
	});

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

	// Helper to get pre-computed output for a cell by index
	function getCellOutput(index: number) {
		if (!precomputedOutputs?.cells) return null;
		return precomputedOutputs.cells[String(index)] || null;
	}

	// Helper to get figure URLs for a cell
	function getCellFigureUrls(index: number): string[] {
		const cellOutput = getCellOutput(index);
		if (!cellOutput?.figures) return [];
		return cellOutput.figures.map((filename: string) =>
			figuresBasePath ? `${figuresBasePath}/${filename}` : filename
		);
	}
</script>

<article class="notebook" bind:this={notebookRef}>
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
					<MarkdownCell {cell} {basePath} />
				{:else if cell.cell_type === 'code'}
					<CodeCell
						bind:this={codeCellRefs[cell.id]}
						{cell}
						{index}
						prerequisites={prerequisitesMap.get(cell.id) || []}
						{showStaticOutputs}
						precomputedOutput={getCellOutput(index)}
						figureUrls={getCellFigureUrls(index)}
						onadvance={createAdvanceCallback(cell.id)}
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
		min-width: 0;
	}

	.pyodide-status {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-base);
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
		min-width: 0;
	}
</style>
