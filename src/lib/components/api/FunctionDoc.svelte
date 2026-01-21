<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import type { APIFunction, APIMethod } from '$lib/api/generated';
	import DocstringRenderer from './DocstringRenderer.svelte';
	import TypeRef from './TypeRef.svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { searchTarget, clearSearchTarget } from '$lib/stores/searchNavigation';

	interface Props {
		func: APIFunction | APIMethod;
		isMethod?: boolean;
		expanded?: boolean;
	}

	let { func, isMethod = false, expanded = false }: Props = $props();
	// Use IIFE to capture initial value without triggering reactive warning
	let isExpanded = $state((() => expanded)());
	let viewMode = $state<'docs' | 'source'>('docs');
	let tileElement: HTMLDivElement | undefined = $state();

	// CodeMirror state
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let editorLoading = $state(false);

	// Get method type badge if applicable
	let methodType = $derived((func as APIMethod).method_type);
	let showBadge = $derived(isMethod && methodType && methodType !== 'method');

	function toggleView(e: MouseEvent | KeyboardEvent) {
		e.stopPropagation();
		viewMode = viewMode === 'docs' ? 'source' : 'docs';
	}

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

	// Watch for search navigation target
	$effect(() => {
		const target = $searchTarget;
		if (!target) return;

		// Match function or method by name
		if ((target.type === 'function' || target.type === 'method') && target.name === func.name) {
			isExpanded = true;
			clearSearchTarget();
			tick().then(() => {
				tileElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		}
	});

	onDestroy(() => {
		editorView?.destroy();
	});
</script>

<div class="tile method-tile elevated" id={func.name} bind:this={tileElement}>
	<button class="panel-header method-header" class:expanded={isExpanded} onclick={() => (isExpanded = !isExpanded)}>
		<div class="method-header-content">
			<code class="method-name">{func.name}</code>
			{#if func.signature}
				<code class="method-signature">{func.signature}</code>
			{/if}
			{#if showBadge}
				<span class="badge accent">{methodType}</span>
			{/if}
		</div>
		{#if func.source && isExpanded}
			<span
				role="button"
				tabindex="0"
				class="icon-btn view-toggle-btn"
				onclick={toggleView}
				onkeydown={(e) => e.key === 'Enter' && toggleView(e)}
				use:tooltip={viewMode === 'docs' ? 'View source' : 'View docs'}
			>
				<Icon name={viewMode === 'docs' ? 'braces' : 'book'} size={14} />
			</span>
		{/if}
	</button>

	{#if isExpanded}
		{#if viewMode === 'docs'}
			<div class="panel-body method-body">
				{#if func.docstring_html}
					<DocstringRenderer html={func.docstring_html} />
				{:else if func.description}
					<p class="method-desc">{func.description}</p>
				{/if}

				{#if func.returns}
					<div class="method-returns">
						<span class="label-uppercase">Returns</span>
						<TypeRef type={func.returns} />
					</div>
				{/if}
			</div>
		{:else}
			<div class="panel-body source-body" bind:this={editorContainer}>
				{#if editorLoading}
					<div class="loading">Loading...</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Override panel-header for method - clickable, no uppercase */
	.method-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		text-transform: none;
		letter-spacing: normal;
		font-size: var(--font-base);
		width: 100%;
		border-radius: 0;
		border-bottom: none;
		text-align: left;
		cursor: pointer;
	}

	.method-header:hover {
		background: var(--surface-raised);
	}

	.method-header.method-header.expanded {
		border-bottom: 1px solid var(--border);
	}

	.method-header-content {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
		flex: 1;
		min-width: 0;
	}

	.method-name {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
		flex-shrink: 0;
	}

	.method-signature {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		color: var(--text-muted);
		background: none;
		border: none;
		padding: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* View toggle button - inherits .icon-btn styles */
	.view-toggle-btn {
		flex-shrink: 0;
	}

	.method-body {
		padding: var(--space-md);
	}

	.method-desc {
		font-family: var(--font-ui);
		font-size: var(--font-base);
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	/* Source view - no padding, CodeMirror fills the space */
	.source-body {
		padding: 0;
	}

	.source-body :global(.cm-editor) {
		height: auto;
		max-height: 400px;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
	}

	.source-body .loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-muted);
		font-size: var(--font-base);
		background: var(--surface);
	}

	.method-returns {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.method-returns :global(.type-ref) {
		font-size: var(--font-base);
		color: var(--text);
	}
</style>
