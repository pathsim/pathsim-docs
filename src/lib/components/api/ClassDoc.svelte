<script lang="ts">
	import type { APIClass } from '$lib/api/generated';
	import FunctionDoc from './FunctionDoc.svelte';
	import DocstringRenderer from './DocstringRenderer.svelte';

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
		<div class="class-header-top">
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
					<div class="label-uppercase methods-header">Methods</div>
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

	/* Disable tile hover effect */
	.class-tile:hover {
		border-color: var(--border);
		box-shadow: none;
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
