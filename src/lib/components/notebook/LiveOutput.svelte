<script lang="ts">
	/**
	 * LiveOutput - Displays execution output from Pyodide (error, stdout, stderr, plots)
	 */
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';

	interface Props {
		/** Error from execution */
		error: { message: string; traceback?: string } | null;
		/** Standard output text */
		stdout: string;
		/** Standard error text */
		stderr: string;
		/** Base64-encoded SVG plots */
		plots: string[];
		/** Execution duration in ms */
		duration: number | null;
		/** Callback to clear all output */
		onClear: () => void;
	}

	let { error, stdout, stderr, plots, duration, onClear }: Props = $props();
</script>

{#if error}
	<div class="output-panel error">
		<div class="panel-header">
			<span>Error</span>
			<div class="header-actions">
				<button class="icon-btn" onclick={onClear} use:tooltip={'Clear'}>
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
				<button class="icon-btn" onclick={onClear} use:tooltip={'Clear'}>
					<Icon name="x" size={14} />
				</button>
			</div>
		</div>
		<div class="panel-body">
			<div class="output-text">{stdout}</div>
		</div>
	</div>
{/if}

{#if stderr && !error}
	<div class="output-panel warning">
		<div class="panel-header">
			<span>Stderr</span>
			<div class="header-actions">
				<button class="icon-btn" onclick={onClear} use:tooltip={'Clear'}>
					<Icon name="x" size={14} />
				</button>
			</div>
		</div>
		<div class="panel-body">
			<div class="output-text stderr">{stderr}</div>
		</div>
	</div>
{/if}

{#if plots.length > 0}
	<div class="output-panel">
		<div class="panel-header">
			<span>Plot</span>
			<div class="header-actions">
				<button class="icon-btn" onclick={onClear} use:tooltip={'Clear'}>
					<Icon name="x" size={14} />
				</button>
			</div>
		</div>
		<div class="panel-body plots-body">
			{#each plots as plot, i}
				<img src="data:image/svg+xml;base64,{plot}" alt="Plot {i + 1}" class="plot-image" />
			{/each}
		</div>
	</div>
{/if}

<style>
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

	/* Duration in header */
	.output-panel .duration {
		font-family: var(--font-ui);
		font-size: var(--font-base);
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: none;
		color: var(--text-muted);
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
		font-size: var(--font-base);
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

	.output-panel.warning .output-text {
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
		background: transparent;
	}

	/* Output text styling */
	.output-text {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		font-weight: 400;
		line-height: 1.5;
		margin: 0;
		padding: var(--space-md);
		color: var(--text-muted);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.output-text.stderr {
		color: var(--warning);
	}
</style>
