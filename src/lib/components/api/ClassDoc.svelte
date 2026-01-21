<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import type { APIClass } from '$lib/api/generated';
	import FunctionDoc from './FunctionDoc.svelte';
	import DocstringRenderer from './DocstringRenderer.svelte';
	import TypeRef from './TypeRef.svelte';
	import Icon from '$lib/components/common/Icon.svelte';
	import { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { searchTarget, clearSearchTarget } from '$lib/stores/searchNavigation';

	interface Props {
		cls: APIClass;
		expanded?: boolean;
	}

	let { cls, expanded: initialExpanded = false }: Props = $props();
	let isExpanded = $state(initialExpanded);
	let viewMode = $state<'docs' | 'source'>('docs');
	let tileElement: HTMLDivElement | undefined = $state();

	// CodeMirror state
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let editorLoading = $state(false);

	// Filter methods - skip __init__ since parameters are in docstring
	let publicMethods = $derived(
		cls.methods.filter((m) => m.name !== '__init__' && !m.name.startsWith('_'))
	);

	function toggleView(e: MouseEvent | KeyboardEvent) {
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

	// Watch for search navigation target
	$effect(() => {
		const target = $searchTarget;
		if (!target) return;

		// Direct class match
		if (target.type === 'class' && target.name === cls.name) {
			isExpanded = true;
			clearSearchTarget();
			tick().then(() => {
				tileElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			});
		}
		// Method inside this class - expand so method can be found
		else if (target.type === 'method' && target.parentClass === cls.name) {
			isExpanded = true;
			// Don't clear target - let FunctionDoc handle it
		}
	});

	onDestroy(() => {
		editorView?.destroy();
	});
</script>

<div class="tile class-tile" id={cls.name} bind:this={tileElement}>
	<button class="panel-header class-header" class:expanded={isExpanded} onclick={() => (isExpanded = !isExpanded)}>
		<div class="class-header-content">
			<div class="class-header-top">
				<code class="class-name">{cls.name}</code>
				{#if cls.bases && cls.bases.length > 0}
					<span class="class-bases">({#each cls.bases as base, i}{#if i > 0}, {/if}<TypeRef type={base} />{/each})</span>
				{/if}
			</div>
			{#if cls.description}
				<span class="class-desc">{cls.description}</span>
			{/if}
		</div>
		{#if cls.source && isExpanded}
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
			<div class="panel-body class-body">
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
	.class-tile {
		margin-bottom: var(--space-lg);
	}

	/* Override panel-header for class - make it clickable */
	.class-header {
		display: flex;
		align-items: center;
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

	.class-header:hover {
		background: var(--surface-raised);
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

	/* View toggle button - inherits .icon-btn styles */
	.view-toggle-btn {
		flex-shrink: 0;
	}

	/* Source view - no padding, CodeMirror fills the space */
	.source-body {
		padding: 0;
	}

	.source-body :global(.cm-editor) {
		height: auto;
		max-height: 600px;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
	}

	.source-body .loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-muted);
		font-size: 12px;
		background: var(--surface);
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
