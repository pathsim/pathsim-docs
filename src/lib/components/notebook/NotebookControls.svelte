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
	<div class="controls-info">
		<p>
			This example is interactive. Click the play button on any cell to execute it,
			or use <strong>Run All</strong> to execute all cells in order.
		</p>
	</div>

	<div class="controls-actions">
		<button
			class="btn primary"
			onclick={handleRunAll}
			disabled={isExecuting}
		>
			{#if isExecuting}
				<Icon name="loader" size={16} />
				<span>Running...</span>
			{:else}
				<Icon name="play" size={16} />
				<span>Run All</span>
			{/if}
		</button>

		<button
			class="btn toggle"
			class:active={forcePrerequisites}
			onclick={toggleForcePrerequisites}
			use:tooltip={'When enabled, always re-run prerequisite cells even if already executed'}
		>
			<Icon name={forcePrerequisites ? 'check-square' : 'square'} size={16} />
			<span>Force execution order</span>
		</button>
	</div>
</div>

<style>
	.notebook-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-xl);
	}

	.controls-info p {
		margin: 0;
		font-size: var(--font-base);
		color: var(--text-muted);
		line-height: 1.5;
	}

	.controls-info strong {
		color: var(--text);
	}

	.controls-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-base);
		font-weight: 500;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		background: var(--surface);
		color: var(--text);
	}

	.btn:hover:not(:disabled) {
		background: var(--surface-raised);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
	}

	.btn.primary:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}

	.btn.toggle {
		background: var(--surface);
		color: var(--text-muted);
	}

	.btn.toggle.active {
		background: var(--surface-raised);
		color: var(--text);
		border-color: var(--accent);
	}

	.btn.toggle:hover:not(:disabled) {
		color: var(--text);
	}

	/* Spinning loader */
	.btn :global(svg.loader) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
