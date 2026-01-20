<script lang="ts">
	import type { APIFunction, APIMethod } from '$lib/api/generated';
	import DocstringRenderer from './DocstringRenderer.svelte';

	interface Props {
		func: APIFunction | APIMethod;
		isMethod?: boolean;
	}

	let { func, isMethod = false }: Props = $props();

	// Get method type badge if applicable
	let methodType = $derived((func as APIMethod).method_type);
	let showBadge = $derived(isMethod && methodType && methodType !== 'method');
</script>

<div class="api-method" id={func.name}>
	<div class="api-method-header">
		<code class="api-method-name">{func.name}</code>
		{#if showBadge}
			<span class="badge accent">{methodType}</span>
		{/if}
	</div>

	{#if func.signature}
		<div class="api-method-signature">
			<code><span class="syntax-function">{func.name}</span>{func.signature}</code>
		</div>
	{/if}

	{#if func.docstring_html}
		<div class="api-method-docstring">
			<DocstringRenderer html={func.docstring_html} />
		</div>
	{:else if func.description}
		<p class="api-method-desc">{func.description}</p>
	{/if}

	{#if func.returns}
		<div class="api-method-returns">
			<span class="api-method-returns-label">Returns</span>
			<code>{func.returns}</code>
		</div>
	{/if}
</div>

<style>
	.api-method {
		padding: var(--space-md);
		background: var(--surface-raised);
		border-radius: var(--radius-md);
	}

	.api-method-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.api-method-name {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
	}

	.api-method-signature {
		margin-bottom: var(--space-sm);
	}

	.api-method-signature code {
		display: block;
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
		background: var(--surface);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.api-method-docstring {
		margin: var(--space-sm) 0;
	}

	.api-method-desc {
		font-family: var(--font-ui);
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin: var(--space-sm) 0;
		line-height: 1.5;
	}

	.api-method-returns {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border);
	}

	.api-method-returns-label {
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.api-method-returns code {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}
</style>
