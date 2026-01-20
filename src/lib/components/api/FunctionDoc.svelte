<script lang="ts">
	import type { APIFunction, APIMethod } from '$lib/api/generated';
	import DocstringRenderer from './DocstringRenderer.svelte';
	import Icon from '$lib/components/common/Icon.svelte';

	interface Props {
		func: APIFunction | APIMethod;
		isMethod?: boolean;
		expanded?: boolean;
	}

	let { func, isMethod = false, expanded: initialExpanded = false }: Props = $props();
	let isExpanded = $state(initialExpanded);

	// Get method type badge if applicable
	let methodType = $derived((func as APIMethod).method_type);
	let showBadge = $derived(isMethod && methodType && methodType !== 'method');
</script>

<div class="tile method-tile" id={func.name}>
	<button class="panel-header method-header" onclick={() => (isExpanded = !isExpanded)}>
		<div class="method-header-left">
			<span class="expandable-toggle" class:expanded={isExpanded}>
				<Icon name="chevron-down" size={14} />
			</span>
			<code class="method-name">{func.name}</code>
			{#if func.signature}
				<code class="method-signature">{func.signature}</code>
			{/if}
		</div>
		{#if showBadge}
			<span class="badge accent">{methodType}</span>
		{/if}
	</button>

	{#if isExpanded}
		<div class="panel-body method-body">
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
		text-align: left;
		cursor: pointer;
	}

	.method-header-left {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		flex-wrap: wrap;
		min-width: 0;
	}

	.method-header-left :global(.expandable-toggle) {
		align-self: center;
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
