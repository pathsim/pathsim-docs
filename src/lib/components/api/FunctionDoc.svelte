<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { APIFunction, APIMethod } from '$lib/api/generated';
	import DocstringRenderer from './DocstringRenderer.svelte';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';

	interface Props {
		func: APIFunction | APIMethod;
		isMethod?: boolean;
		expanded?: boolean;
	}

	let { func, isMethod = false, expanded: initialExpanded = false }: Props = $props();
	let isExpanded = $state(initialExpanded);
	let viewMode = $state<'docs' | 'source'>('docs');

	// CodeMirror state
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let editorLoading = $state(false);

	// Get method type badge if applicable
	let methodType = $derived((func as APIMethod).method_type);
	let showBadge = $derived(isMethod && methodType && methodType !== 'method');

	// Initialize CodeMirror when switching to source view
	$effect(() => {
		if (viewMode === 'source' && func.source && editorContainer && !editorView) {
			editorLoading = true;
			loadCodeMirrorModules().then((modules) => {
				cmModules = modules;
				const isDark = $theme === 'dark';
				editorView = new cmModules.EditorView({
					doc: func.source || '',
					extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
					parent: editorContainer!
				});
				editorLoading = false;
			});
		}
	});

	// Update editor theme when it changes
	$effect(() => {
		const currentTheme = $theme;
		if (viewMode === 'source' && editorView && cmModules && editorContainer) {
			const isDark = currentTheme === 'dark';
			editorView.destroy();
			editorView = new cmModules.EditorView({
				doc: func.source || '',
				extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
				parent: editorContainer
			});
		}
	});

	// Cleanup editor when collapsed or view changes
	$effect(() => {
		if (!isExpanded || viewMode !== 'source') {
			if (editorView) {
				editorView.destroy();
				editorView = null;
			}
		}
	});

	onDestroy(() => {
		editorView?.destroy();
	});
</script>

<div class="tile method-tile" id={func.name}>
	<button class="panel-header method-header" class:expanded={isExpanded} onclick={() => (isExpanded = !isExpanded)}>
		<code class="method-name">{func.name}</code>
		{#if func.signature}
			<code class="method-signature">{func.signature}</code>
		{/if}
		{#if showBadge}
			<span class="badge accent">{methodType}</span>
		{/if}
	</button>

	{#if isExpanded}
		<div class="panel-body method-body">
			{#if func.source}
				<div class="view-toggle">
					<button
						class="toggle-btn"
						class:active={viewMode === 'docs'}
						onclick={() => (viewMode = 'docs')}
					>
						Docs
					</button>
					<button
						class="toggle-btn"
						class:active={viewMode === 'source'}
						onclick={() => (viewMode = 'source')}
					>
						Source
					</button>
				</div>
			{/if}

			{#if viewMode === 'docs'}
				{#if func.docstring_html}
					<DocstringRenderer html={func.docstring_html} />
				{:else if func.description}
					<p class="method-desc">{func.description}</p>
				{/if}

				{#if func.returns}
					<div class="method-returns">
						<span class="label-uppercase">Returns</span>
						<code>{func.returns}</code>
					</div>
				{/if}
			{:else}
				<div class="source-view" bind:this={editorContainer}>
					{#if editorLoading}
						<div class="loading">Loading...</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Disable tile hover effect */
	.method-tile:hover {
		border-color: var(--border);
		box-shadow: none;
	}

	/* Override panel-header for method - clickable, no uppercase */
	.method-header {
		padding: var(--space-sm) var(--space-md);
		text-transform: none;
		letter-spacing: normal;
		font-size: var(--font-sm);
		width: 100%;
		border-radius: 0;
		border-bottom: none;
		text-align: left;
		cursor: pointer;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.method-header.method-header.expanded {
		border-bottom: 1px solid var(--border);
	}

	.method-name {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
		flex-shrink: 0;
	}

	.method-signature {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
		background: none;
		border: none;
		padding: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.method-body {
		padding: var(--space-md);
	}

	.method-desc {
		font-family: var(--font-ui);
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* View toggle */
	.view-toggle {
		display: flex;
		gap: 2px;
		margin-bottom: var(--space-md);
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
		padding: 2px;
		width: fit-content;
	}

	.toggle-btn {
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-xs);
		font-family: var(--font-ui);
		background: transparent;
		border: none;
		border-radius: var(--radius-xs);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.toggle-btn:hover {
		color: var(--text);
	}

	.toggle-btn.active {
		background: var(--bg);
		color: var(--text);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Source view */
	.source-view {
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.source-view :global(.cm-editor) {
		font-size: var(--font-xs);
		max-height: 400px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 80px;
		color: var(--text-muted);
		font-size: var(--font-sm);
	}

	.method-returns {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.method-returns code {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}
</style>
