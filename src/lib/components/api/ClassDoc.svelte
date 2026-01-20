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

<div class="api-class" id={cls.name}>
	<button class="api-class-header" onclick={() => (isExpanded = !isExpanded)}>
		<div class="api-class-title">
			<span class="api-class-toggle" class:expanded={isExpanded}>
				<Icon name="chevron-down" size={16} />
			</span>
			<code class="api-class-name">{cls.name}</code>
			{#if cls.bases && cls.bases.length > 0}
				<span class="api-class-bases">({cls.bases.join(', ')})</span>
			{/if}
		</div>
		{#if cls.description}
			<span class="api-class-desc">{cls.description}</span>
		{/if}
	</button>

	{#if isExpanded}
		<div class="api-class-body">
			{#if cls.docstring_html}
				<DocstringRenderer html={cls.docstring_html} />
			{/if}

			{#if publicMethods.length > 0}
				<div class="api-section">
					<div class="api-section-header">
						<span class="api-section-title">Methods</span>
					</div>
					<div class="api-methods">
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
	.api-class {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-lg);
		overflow: hidden;
		transition: border-color var(--transition-fast);
	}

	.api-class:hover {
		border-color: var(--border-focus);
	}

	.api-class-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		background: var(--surface-raised);
		border: none;
		border-radius: 0;
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.api-class-header:hover {
		background: var(--surface-hover);
	}

	.api-class-title {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.api-class-toggle {
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

	.api-class-toggle.expanded {
		background: var(--accent-bg);
		color: var(--accent);
	}

	.api-class-toggle.expanded :global(svg) {
		transform: rotate(180deg);
	}

	.api-class-name {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
	}

	.api-class-bases {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	.api-class-desc {
		font-family: var(--font-ui);
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin-left: calc(20px + var(--space-sm));
		line-height: 1.5;
	}

	.api-class-body {
		padding: var(--space-lg);
		background: var(--surface);
		border-top: 1px solid var(--border);
	}

	.api-section {
		margin-top: var(--space-xl);
	}

	.api-section:first-child {
		margin-top: var(--space-lg);
	}

	.api-section-header {
		position: relative;
		margin-bottom: var(--space-md);
		padding-top: var(--space-lg);
	}

	/* Full width separator ABOVE header (extends to card edges) */
	.api-section-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: calc(-1 * var(--space-lg));
		right: calc(-1 * var(--space-lg));
		height: 1px;
		background: var(--border);
	}

	.api-section-title {
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.api-methods {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
</style>
