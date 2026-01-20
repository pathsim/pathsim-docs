<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { APIClass } from '$lib/api/generated';
	import FunctionDoc from './FunctionDoc.svelte';
	import DocstringRenderer from './DocstringRenderer.svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';

	interface Props {
		cls: APIClass;
		expanded?: boolean;
	}

	let { cls, expanded: initialExpanded = false }: Props = $props();
	let isExpanded = $state(initialExpanded);
	let viewMode = $state<'docs' | 'source'>('docs');

	// CodeMirror state
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let editorLoading = $state(false);

	// Filter methods - skip __init__ since parameters are in docstring
	let publicMethods = $derived(
		cls.methods.filter((m) => m.name !== '__init__' && !m.name.startsWith('_'))
	);

	function toggleView(e: MouseEvent) {
		e.stopPropagation();
		viewMode = viewMode === 'docs' ? 'source' : 'docs';
	}

	// Initialize CodeMirror when switching to source view
	$effect(() => {
		if (viewMode === 'source' && cls.source && editorContainer && !editorView) {
			editorLoading = true;
			loadCodeMirrorModules().then((modules) => {
				cmModules = modules;
				const isDark = $theme === 'dark';
				editorView = new cmModules.EditorView({
					doc: cls.source || '',
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
				doc: cls.source || '',
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

<div class="tile class-tile" id={cls.name}>
	<button class="panel-header class-header" class:expanded={isExpanded} onclick={() => (isExpanded = !isExpanded)}>
		<div class="class-header-content">
			<div class="class-header-top">
				<code class="class-name">{cls.name}</code>
				{#if cls.bases && cls.bases.length > 0}
					<span class="class-bases">({cls.bases.join(', ')})</span>
				{/if}
			</div>
			{#if cls.description}
				<span class="class-desc">{cls.description}</span>
			{/if}
		</div>
		{#if cls.source && isExpanded}
			<button
				class="icon-btn view-toggle-btn"
				class:active={viewMode === 'source'}
				onclick={toggleView}
				use:tooltip={viewMode === 'docs' ? 'View source' : 'View docs'}
			>
				<Icon name={viewMode === 'docs' ? 'code' : 'book'} size={14} />
			</button>
		{/if}
	</button>

	{#if isExpanded}
		<div class="panel-body class-body">
			{#if viewMode === 'docs'}
				{#if cls.docstring_html}
					<DocstringRenderer html={cls.docstring_html} />
				{/if}

				{#if publicMethods.length > 0}
					<div class="methods-section">
						<div class="label-uppercase methods-header">Methods</div>
						<div class="methods-list">
							{#each publicMethods as method}
								<FunctionDoc func={method} isMethod={true} />
							{/each}
						</div>
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
	.class-tile {
		margin-bottom: var(--space-lg);
	}

	/* Disable tile hover effect */
	.class-tile:hover {
		border-color: var(--border);
		box-shadow: none;
	}

	/* Override panel-header for class - make it clickable */
	.class-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		width: 100%;
		border-radius: 0;
		border-bottom: none;
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
		/* Override panel-header uppercase */
		text-transform: none;
		letter-spacing: normal;
		font-size: var(--font-sm);
	}

	.class-header.class-header.expanded {
		border-bottom: 1px solid var(--border);
	}

	.class-header-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-xs);
		flex: 1;
		min-width: 0;
	}

	.class-header-top {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.class-name {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
	}

	.class-bases {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
	}

	.class-desc {
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		color: var(--text-muted);
		line-height: 1.5;
	}

	/* View toggle button */
	.view-toggle-btn {
		flex-shrink: 0;
		color: var(--text-muted);
	}

	.view-toggle-btn:hover {
		color: var(--text);
	}

	.view-toggle-btn.active {
		color: var(--accent);
	}

	/* Source view */
	.source-view {
		margin: calc(-1 * var(--space-lg));
		margin-top: 0;
	}

	.source-view :global(.cm-editor) {
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		max-height: 600px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-muted);
		font-size: var(--font-sm);
	}

	.methods-section {
		position: relative;
		margin-top: var(--space-xl);
		padding-top: var(--space-lg);
	}

	/* Full width separator extending to card edges */
	.methods-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: calc(-1 * var(--space-lg));
		right: calc(-1 * var(--space-lg));
		height: 1px;
		background: var(--border);
	}

	.methods-header {
		margin-bottom: var(--space-md);
	}

	.methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
</style>
