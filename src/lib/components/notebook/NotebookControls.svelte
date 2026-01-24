<script lang="ts">
	/**
	 * NotebookControls - Control panel for interactive notebook execution
	 * Provides Run All button and execution settings
	 */
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { notebookStore } from '$lib/stores/notebookStore';
	import { notebookSettingsStore } from '$lib/stores/notebookSettingsStore';

	// Subscribe to settings
	let forcePrerequisites = $derived($notebookSettingsStore.forcePrerequisites);

	// Track if currently executing
	let isExecuting = $state(false);

	async function handleRunAll() {
		if (isExecuting) return;

		isExecuting = true;
		try {
			await notebookStore.runAll();
		} finally {
			isExecuting = false;
		}
	}

	function toggleForcePrerequisites() {
		notebookSettingsStore.toggleForcePrerequisites();
	}
</script>

<div class="notebook-controls">
	<p class="controls-info">
		This example is interactive. Click the play button on any cell to execute it,
		or use <strong>Run All</strong> to execute all cells in order.
	</p>

	<div class="controls-actions">
		<button
			class="run-all-btn"
			class:running={isExecuting}
			onclick={handleRunAll}
			disabled={isExecuting}
		>
			{#if isExecuting}
				<span class="spinner"><Icon name="loader" size={16} /></span>
				<span>Running...</span>
			{:else}
				<Icon name="play" size={16} />
				<span>Run All</span>
			{/if}
		</button>

		<label class="toggle-label">
			<input
				type="checkbox"
				checked={forcePrerequisites}
				onchange={toggleForcePrerequisites}
			/>
			<span class="toggle-text">Force execution order</span>
			<button
				class="info-btn"
				use:tooltip={'When enabled, prerequisite cells are always re-executed, even if they ran successfully before'}
			>
				<Icon name="info" size={14} />
			</button>
		</label>
	</div>
</div>

<style>
	.notebook-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--border);
		margin-bottom: var(--space-lg);
	}

	.controls-info {
		margin: 0;
		font-size: var(--font-sm);
		color: var(--text-muted);
		line-height: 1.5;
	}

	.controls-info strong {
		color: var(--text);
		font-weight: 600;
	}

	.controls-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-lg);
		align-items: center;
	}

	/* Run All button */
	.run-all-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-sm);
		font-weight: 600;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		background: var(--accent);
		color: white;
	}

	.run-all-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.run-all-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.run-all-btn.running {
		background: var(--surface-raised);
		color: var(--text-muted);
	}

	/* Spinner */
	.spinner {
		display: flex;
		align-items: center;
	}

	.spinner :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Toggle */
	.toggle-label {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		cursor: pointer;
		font-size: var(--font-sm);
		color: var(--text-muted);
		user-select: none;
	}

	.toggle-label input[type="checkbox"] {
		width: 16px;
		height: 16px;
		margin: 0;
		cursor: pointer;
		accent-color: var(--accent);
	}

	.toggle-text {
		transition: color var(--transition-fast);
	}

	.toggle-label:hover .toggle-text {
		color: var(--text);
	}

	.toggle-label:has(input:checked) .toggle-text {
		color: var(--text);
	}

	/* Info button */
	.info-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		width: 20px;
		height: 20px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.info-btn:hover {
		color: var(--text);
		background: transparent;
	}
</style>
