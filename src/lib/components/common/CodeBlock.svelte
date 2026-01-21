<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from './Tooltip.svelte';
	import {
		loadCodeMirrorModules,
		createEditorExtensions,
		type CodeMirrorModules
	} from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { copyToClipboard as copy } from '$lib/utils/clipboard';
	import { notebookStore } from '$lib/stores/notebookStore';

	interface Props {
		/** The code to display */
		code: string;
		/** Title shown in header */
		title?: string;
		/** Unique ID for this code block (required for executable blocks with prerequisites) */
		id?: string;
		/** Whether code can be executed via Pyodide */
		executable?: boolean;
		/** Whether code can be edited */
		editable?: boolean;
		/** IDs of code blocks that must execute first */
		prerequisites?: string[];
		/** Callback when code changes (for editable blocks) */
		onCodeChange?: (code: string) => void;
	}

	let {
		code,
		title = 'Example',
		id = undefined,
		executable = false,
		editable = false,
		prerequisites = [],
		onCodeChange = undefined
	}: Props = $props();

	// State
	let copied = $state(false);
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let loading = $state(true);

	// Execution state
	let isRunning = $state(false);
	let executionCount = $state<number | null>(null);
	let stdout = $state('');
	let stderr = $state('');
	let plots = $state<string[]>([]);
	let error = $state<{ message: string; traceback?: string } | null>(null);
	let duration = $state<number | null>(null);

	// Track current code (for editable mode)
	let currentCode = $state(code);

	function handleCopy() {
		copy(currentCode, () => (copied = true), () => (copied = false));
	}

	function getCurrentCode(): string {
		if (editorView && editable) {
			return editorView.state.doc.toString();
		}
		return currentCode;
	}

	async function handleRun() {
		if (isRunning) return;

		// Check prerequisites
		const prereqCheck = notebookStore.checkPrerequisites(prerequisites);
		if (!prereqCheck.satisfied) {
			error = {
				message: `Prerequisite cell(s) not executed: ${prereqCheck.missing.join(', ')}`
			};
			return;
		}

		isRunning = true;
		error = null;
		stdout = '';
		stderr = '';
		plots = [];

		try {
			// Dynamically import pyodide to avoid loading it until needed
			const { execute, initPyodide } = await import('$lib/pyodide');

			// Ensure Pyodide is initialized
			await initPyodide();

			// Execute the code
			const result = await execute(getCurrentCode());

			stdout = result.stdout;
			stderr = result.stderr;
			plots = result.plots;
			duration = result.duration;

			if (result.error) {
				error = result.error;
			} else {
				// Mark this cell as executed
				if (id) {
					notebookStore.markExecuted(id);
				}
				executionCount = (executionCount ?? 0) + 1;
			}
		} catch (err) {
			error = {
				message: err instanceof Error ? err.message : String(err)
			};
		} finally {
			isRunning = false;
		}
	}

	function clearOutput() {
		stdout = '';
		stderr = '';
		plots = [];
		error = null;
		duration = null;
	}

	// Computed: has any output to show
	let hasOutput = $derived(stdout || stderr || plots.length > 0 || error);

	onMount(() => {
		if (!editorContainer) return;

		loadCodeMirrorModules().then((modules) => {
			cmModules = modules;

			const isDark = $theme === 'dark';

			// Setup update listener for editable mode
			const updateListener = editable
				? cmModules.EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							currentCode = update.state.doc.toString();
							onCodeChange?.(currentCode);
						}
					})
				: [];

			editorView = new cmModules.EditorView({
				doc: code,
				extensions: [
					createEditorExtensions(cmModules, isDark, { readOnly: !editable }),
					...(Array.isArray(updateListener) ? updateListener : [updateListener])
				],
				parent: editorContainer!
			});

			loading = false;
		});
	});

	// Watch for theme changes
	$effect(() => {
		const currentTheme = $theme;
		if (editorView && cmModules && editorContainer) {
			const isDark = currentTheme === 'dark';
			const currentDoc = editorView.state.doc.toString();

			const updateListener = editable
				? cmModules.EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							currentCode = update.state.doc.toString();
							onCodeChange?.(currentCode);
						}
					})
				: [];

			editorView.destroy();
			editorView = new cmModules.EditorView({
				doc: currentDoc,
				extensions: [
					createEditorExtensions(cmModules, isDark, { readOnly: !editable }),
					...(Array.isArray(updateListener) ? updateListener : [updateListener])
				],
				parent: editorContainer
			});
		}
	});

	// Watch for external code changes
	$effect(() => {
		if (editorView && code !== currentCode && !editable) {
			currentCode = code;
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: code }
			});
		}
	});

	onDestroy(() => {
		editorView?.destroy();
	});
</script>

<div class="code-panel" class:executable class:has-output={hasOutput}>
	<div class="panel-header">
		<div class="header-left">
			{#if executable && executionCount !== null}
				<span class="execution-count">[{executionCount}]</span>
			{/if}
			<span>{title}</span>
		</div>
		<div class="header-actions">
			{#if executable}
				{#if isRunning}
					<button class="icon-btn running" disabled use:tooltip={'Running...'}>
						<Icon name="loader" size={14} />
					</button>
				{:else}
					<button class="icon-btn run-btn" onclick={handleRun} use:tooltip={'Run (Shift+Enter)'}>
						<Icon name="play" size={14} />
					</button>
				{/if}
			{/if}
			<button class="icon-btn" onclick={handleCopy} use:tooltip={copied ? 'Copied!' : 'Copy'}>
				<Icon name={copied ? 'check' : 'copy'} size={14} />
			</button>
		</div>
	</div>
	<div class="panel-body" bind:this={editorContainer}>
		{#if loading}
			<div class="loading">Loading...</div>
		{/if}
	</div>

	{#if executable && hasOutput}
		<div class="output-section">
			{#if error}
				<div class="output-error">
					<div class="output-header">
						<Icon name="alert-triangle" size={12} />
						<span>Error</span>
					</div>
					<pre class="error-message">{error.message}</pre>
					{#if error.traceback}
						<pre class="error-traceback">{error.traceback}</pre>
					{/if}
				</div>
			{/if}

			{#if stdout}
				<div class="output-stdout">
					<div class="output-header">
						<Icon name="terminal" size={12} />
						<span>Output</span>
						{#if duration !== null}
							<span class="duration">{duration}ms</span>
						{/if}
					</div>
					<pre>{stdout}</pre>
				</div>
			{/if}

			{#if stderr && !error}
				<div class="output-stderr">
					<div class="output-header">
						<Icon name="alert-triangle" size={12} />
						<span>Stderr</span>
					</div>
					<pre>{stderr}</pre>
				</div>
			{/if}

			{#if plots.length > 0}
				<div class="output-plots">
					<div class="output-header">
						<Icon name="image" size={12} />
						<span>Plots ({plots.length})</span>
					</div>
					<div class="plots-container">
						{#each plots as plot, i}
							<img src="data:image/png;base64,{plot}" alt="Plot {i + 1}" class="plot-image" />
						{/each}
					</div>
				</div>
			{/if}

			{#if hasOutput}
				<button class="clear-output-btn" onclick={clearOutput} use:tooltip={'Clear output'}>
					<Icon name="x" size={12} />
					<span>Clear</span>
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.code-panel.executable .panel-header {
		background: var(--surface-raised);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.execution-count {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-disabled);
	}

	.run-btn {
		color: var(--success);
	}

	.run-btn:hover {
		background: var(--success-bg);
		color: var(--success);
	}

	.icon-btn.running {
		color: var(--accent);
	}

	.icon-btn.running :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Output section */
	.output-section {
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.output-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-md);
		background: var(--surface-raised);
		font-size: var(--font-xs);
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.output-header .duration {
		margin-left: auto;
		font-family: var(--font-mono);
		text-transform: none;
		color: var(--text-disabled);
	}

	.output-stdout pre,
	.output-stderr pre,
	.error-message,
	.error-traceback {
		margin: 0;
		padding: var(--space-md);
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		white-space: pre-wrap;
		word-break: break-word;
		background: transparent;
		border: none;
		border-radius: 0;
	}

	.output-error {
		background: var(--error-bg);
	}

	.output-error .output-header {
		background: transparent;
		color: var(--error);
	}

	.error-message {
		color: var(--error);
	}

	.error-traceback {
		color: var(--text-muted);
		font-size: var(--font-xs);
		border-top: 1px solid var(--border);
	}

	.output-stderr {
		background: var(--warning-bg);
	}

	.output-stderr .output-header {
		background: transparent;
		color: var(--warning);
	}

	.output-stderr pre {
		color: var(--warning);
	}

	/* Plots */
	.output-plots {
		border-top: 1px solid var(--border);
	}

	.plots-container {
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

	/* Clear button */
	.clear-output-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-md);
		margin: var(--space-sm) var(--space-md);
		font-size: var(--font-xs);
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.clear-output-btn:hover {
		background: var(--surface-raised);
		color: var(--text);
	}
</style>
