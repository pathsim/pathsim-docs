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

<div class="tile method-tile" id={func.name}>
	<div class="panel-header">
		<div class="method-header-content">
			<code class="method-name">{func.name}</code>
			{#if func.signature}
				<code class="method-signature">{func.signature}</code>
			{/if}
		</div>
		{#if showBadge}
			<span class="badge accent">{methodType}</span>
		{/if}
	</div>

	<div class="panel-body method-body">
		{#if func.docstring_html}
			<DocstringRenderer html={func.docstring_html} />
		{:else if func.description}
			<p class="method-desc">{func.description}</p>
		{/if}

		{#if func.returns}
			<div class="method-returns">
				<span class="method-returns-label">Returns</span>
				<code>{func.returns}</code>
			</div>
		{/if}
	</div>
</div>

<style>
	.method-tile {
		/* Inherits tile base styles from app.css */
	}

	/* Override panel-header for method - more compact, no uppercase */
	.method-tile :global(.panel-header) {
		padding: var(--space-sm) var(--space-md);
		text-transform: none;
		letter-spacing: normal;
		font-size: var(--font-sm);
	}

	.method-header-content {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		flex-wrap: wrap;
		min-width: 0;
	}

	.method-name {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
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

	.method-returns-label {
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
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
