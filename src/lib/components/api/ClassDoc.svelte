<script lang="ts">
	import type { APIClass } from '$lib/api/generated';
	import FunctionDoc from './FunctionDoc.svelte';
	import DocstringRenderer from './DocstringRenderer.svelte';
	import Icon from '$lib/components/common/Icon.svelte';

	interface Props {
		cls: APIClass;
		expanded?: boolean;
	}

	let { cls, expanded: initialExpanded = false }: Props = $props();
	let isExpanded = $state(initialExpanded);

	// Filter methods - skip __init__ since parameters are in docstring
	let publicMethods = $derived(
		cls.methods.filter((m) => m.name !== '__init__' && !m.name.startsWith('_'))
	);
</script>

<div class="tile class-tile" id={cls.name}>
	<button class="panel-header class-header" onclick={() => (isExpanded = !isExpanded)}>
		<div class="class-header-left">
			<span class="class-toggle" class:expanded={isExpanded}>
				<Icon name="chevron-down" size={16} />
			</span>
			<code class="class-name">{cls.name}</code>
			{#if cls.bases && cls.bases.length > 0}
				<span class="class-bases">({cls.bases.join(', ')})</span>
			{/if}
		</div>
		{#if cls.description}
			<span class="class-desc">{cls.description}</span>
		{/if}
	</button>

	{#if isExpanded}
		<div class="panel-body class-body">
			{#if cls.docstring_html}
				<DocstringRenderer html={cls.docstring_html} />
			{/if}

			{#if publicMethods.length > 0}
				<div class="methods-section">
					<div class="methods-header">Methods</div>
					<div class="methods-list">
						{#each publicMethods as method}
							<FunctionDoc func={method} isMethod={true} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.class-tile {
		margin-bottom: var(--space-lg);
	}

	/* Override panel-header for class - make it clickable and flex column */
	.class-header {
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-xs);
		width: 100%;
		border-radius: 0;
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
		/* Override panel-header uppercase */
		text-transform: none;
		letter-spacing: normal;
		font-size: var(--font-sm);
	}

	.class-header:hover {
		background: var(--surface-hover);
	}

	.class-header-left {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.class-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		color: var(--text-muted);
		background: var(--surface);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.class-toggle.expanded {
		background: var(--accent-bg);
		color: var(--accent);
	}

	.class-toggle.expanded :global(svg) {
		transform: rotate(180deg);
	}

	.class-name {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
	}

	.class-bases {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	.class-desc {
		font-family: var(--font-ui);
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin-left: calc(20px + var(--space-sm));
		line-height: 1.5;
		text-transform: none;
		letter-spacing: normal;
	}

	.class-body {
		/* Inherits panel-body styles */
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
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
</style>
