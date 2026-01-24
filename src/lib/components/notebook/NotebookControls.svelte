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
	<div class="controls-content">
		<p class="controls-info">
			This example is interactive. Click the play button on any cell to execute it, or run all cells in sequence.
		</p>

		<div class="controls-actions">
			<button
				class="icon-btn"
				class:running={isExecuting}
				onclick={handleRunAll}
				disabled={isExecuting}
				use:tooltip={isExecuting ? 'Running...' : 'Run all cells'}
			>
				{#if isExecuting}
					<span class="spinner"><Icon name="loader" size={18} /></span>
				{:else}
					<Icon name="play" size={18} />
				{/if}
			</button>

			<button
				class="icon-btn"
				class:active={forcePrerequisites}
				onclick={toggleForcePrerequisites}
				use:tooltip={forcePrerequisites ? 'Force execution order (on)' : 'Force execution order (off)'}
			>
				<Icon name="layers" size={18} />
			</button>
		</div>
	</div>
</div>

<div class="separator"></div>

<style>
	.notebook-controls {
		margin-bottom: var(--space-md);
	}

	.controls-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.controls-info {
		margin: 0;
		font-size: var(--font-sm);
		color: var(--text-muted);
		line-height: 1.5;
		flex: 1;
		min-width: 200px;
	}

	.controls-actions {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}

	/* Icon buttons */
	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.icon-btn:hover:not(:disabled) {
		background: var(--surface-raised);
		color: var(--text);
		border-color: var(--border-hover);
	}

	.icon-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.icon-btn.active {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}

	.icon-btn.active:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}

	.icon-btn.running {
		background: var(--surface-raised);
		border-color: var(--accent);
		color: var(--accent);
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

</style>
