<script lang="ts">
	/**
	 * NotebookCell - Executable code cell for documentation notebooks
	 * Wraps CodeBlock with Pyodide execution, output display, and plot rendering
	 */
	import { onMount, onDestroy } from 'svelte';
	import CodeBlock from './CodeBlock.svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from './Tooltip.svelte';
	import { notebookStore, type CellStatus } from '$lib/stores/notebookStore';

	interface Props {
		/** Unique cell ID (required for prerequisite tracking) */
		id: string;
		/** The code to execute */
		code: string;
		/** Title shown in header */
		title?: string;
		/** Whether code can be edited */
		editable?: boolean;
		/** IDs of cells that must execute first (will auto-run) */
		prerequisites?: string[];
	}

	let {
		id,
		code,
		title = 'Code',
		editable = false,
		prerequisites = []
	}: Props = $props();

	// Reference to CodeBlock for getting current code
	let codeBlockRef = $state<{ getCurrentCode: () => string } | undefined>(undefined);

	// Execution output state
	let stdout = $state('');
	let stderr = $state('');
	let plots = $state<string[]>([]);
	let error = $state<{ message: string; traceback?: string } | null>(null);
	let duration = $state<number | null>(null);

	// Subscribe to cell state from store
	let cellState = $state<{ status: CellStatus; executionCount: number }>({
		status: 'idle',
		executionCount: 0
	});

	// Computed states
	let isRunning = $derived(cellState.status === 'running');
	let isPending = $derived(cellState.status === 'pending');
	let hasOutput = $derived(stdout || stderr || plots.length > 0 || error);

	/**
	 * Execute this cell's code (called by store during prerequisite chain)
	 */
	async function executeCell(): Promise<void> {
		const codeToRun = codeBlockRef?.getCurrentCode() ?? code;

		// Clear previous output
		stdout = '';
		stderr = '';
		plots = [];
		error = null;
		duration = null;

		try {
			// Dynamically import pyodide
			const { execute, initPyodide } = await import('$lib/pyodide');

			// Ensure Pyodide is initialized
			notebookStore.setPyodideState(true, 'Initializing Python...');
			await initPyodide();
			notebookStore.setPyodideState(false, '', true);

			// Execute the code
			const result = await execute(codeToRun);

			stdout = result.stdout;
			stderr = result.stderr;
			plots = result.plots;
			duration = result.duration;

			if (result.error) {
				error = result.error;
				notebookStore.setCellStatus(id, 'error');
			} else {
				notebookStore.setCellStatus(id, 'success');
				notebookStore.incrementExecutionCount(id);
			}
		} catch (err) {
			error = {
				message: err instanceof Error ? err.message : String(err)
			};
			notebookStore.setCellStatus(id, 'error');
			throw err; // Re-throw to stop prerequisite chain
		}
	}

	/**
	 * Handle run button click - triggers prerequisite chain
	 */
	async function handleRun() {
		if (isRunning || isPending) return;

		const result = await notebookStore.runWithPrerequisites(id);

		if (!result.success && result.error) {
			// Show error if it's a chain-level error (like circular deps)
			if (result.error.includes('Circular dependency')) {
				error = { message: result.error };
			}
		}
	}

	function clearOutput() {
		stdout = '';
		stderr = '';
		plots = [];
		error = null;
		duration = null;
	}

	// Register cell with store on mount
	onMount(() => {
		notebookStore.registerCell(id, executeCell, prerequisites);

		// Subscribe to cell state changes
		const unsubscribe = notebookStore.subscribe((state) => {
			const cell = state.cells.get(id);
			if (cell) {
				cellState = {
					status: cell.status,
					executionCount: cell.executionCount
				};
			}
		});

		return () => {
			unsubscribe();
		};
	});

	onDestroy(() => {
		notebookStore.unregisterCell(id);
	});
</script>

<div class="notebook-cell" class:running={isRunning} class:pending={isPending} class:has-output={hasOutput}>
	<CodeBlock
		bind:this={codeBlockRef}
		{code}
		{title}
		{editable}
	>
		{#snippet headerActions()}
			{#if isRunning}
				<button class="icon-btn" disabled use:tooltip={'Running...'}>
					<Icon name="loader" size={14} />
				</button>
			{:else if isPending}
				<button class="icon-btn" disabled use:tooltip={'Waiting...'}>
					<Icon name="loader" size={14} />
				</button>
			{:else}
				<button class="icon-btn" onclick={handleRun} use:tooltip={'Run cell'}>
					<Icon name="play" size={14} />
				</button>
			{/if}
		{/snippet}
	</CodeBlock>

	{#if hasOutput}
		<div class="output-section">
			{#if error}
				<div class="output-panel error">
					<div class="panel-header">
						<span>Error</span>
						<div class="header-actions">
							<button class="icon-btn" onclick={clearOutput} use:tooltip={'Clear'}>
								<Icon name="x" size={14} />
							</button>
						</div>
					</div>
					<div class="panel-body">
						<pre class="error-message">{error.message}</pre>
						{#if error.traceback}
							<pre class="error-traceback">{error.traceback}</pre>
						{/if}
					</div>
				</div>
			{/if}

			{#if stdout}
				<div class="output-panel">
					<div class="panel-header">
						<span>Output</span>
						<div class="header-actions">
							{#if duration !== null}
								<span class="duration">{duration}ms</span>
							{/if}
							<button class="icon-btn" onclick={clearOutput} use:tooltip={'Clear'}>
								<Icon name="x" size={14} />
							</button>
						</div>
					</div>
					<div class="panel-body">
						<pre>{stdout}</pre>
					</div>
				</div>
			{/if}

			{#if stderr && !error}
				<div class="output-panel warning">
					<div class="panel-header">
						<span>Stderr</span>
						<div class="header-actions">
							<button class="icon-btn" onclick={clearOutput} use:tooltip={'Clear'}>
								<Icon name="x" size={14} />
							</button>
						</div>
					</div>
					<div class="panel-body">
						<pre>{stderr}</pre>
					</div>
				</div>
			{/if}

			{#if plots.length > 0}
				<div class="output-panel">
					<div class="panel-header">
						<span>Plot</span>
						<div class="header-actions">
							<button class="icon-btn" onclick={clearOutput} use:tooltip={'Clear'}>
								<Icon name="x" size={14} />
							</button>
						</div>
					</div>
					<div class="panel-body plots-body">
						{#each plots as plot, i}
							<img src="data:image/png;base64,{plot}" alt="Plot {i + 1}" class="plot-image" />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.notebook-cell {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: border-color var(--transition-fast);
	}

	.notebook-cell.running {
		border-color: var(--accent);
	}

	.notebook-cell.pending {
		border-color: var(--text-muted);
		opacity: 0.8;
	}

	.notebook-cell :global(.code-panel) {
		border: none;
		border-radius: 0;
	}

	/* Spinning loader for running/pending states */
	.notebook-cell .icon-btn:disabled :global(svg) {
		animation: spin 1s linear infinite;
	}

	.notebook-cell.pending .icon-btn:disabled {
		opacity: 0.5;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Output section */
	.output-section {
		border-top: 1px solid var(--border);
	}

	/* Output panels use global panel-header/panel-body styles */
	.output-panel {
		border-top: 1px solid var(--border);
	}

	.output-panel:first-child {
		border-top: none;
	}

	.output-panel .panel-header {
		padding: var(--space-xs) var(--space-md);
	}

	.output-panel .panel-body {
		padding: 0;
	}

	.output-panel .panel-body pre {
		margin: 0;
		padding: var(--space-md);
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		line-height: 1.5;
		color: var(--text);
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
		background: transparent;
		border: none;
		border-radius: 0;
	}

	/* Duration in header */
	.output-panel .duration {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		text-transform: none;
		color: var(--text-disabled);
	}

	/* Error panel */
	.output-panel.error {
		background: var(--error-bg);
	}

	.output-panel.error .panel-header {
		background: transparent;
		color: var(--error);
	}

	.output-panel.error .error-message {
		color: var(--error);
	}

	.output-panel.error .error-traceback {
		color: var(--text-muted);
		font-size: var(--font-xs);
		border-top: 1px solid var(--border);
	}

	/* Warning panel (stderr) */
	.output-panel.warning {
		background: var(--warning-bg);
	}

	.output-panel.warning .panel-header {
		background: transparent;
		color: var(--warning);
	}

	.output-panel.warning pre {
		color: var(--warning);
	}

	/* Plots */
	.plots-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
	}

	.plot-image {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-sm);
		background: white;
	}
</style>
