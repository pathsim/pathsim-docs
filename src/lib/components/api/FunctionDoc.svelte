<script lang="ts">
	import type { APIFunction, APIMethod } from '$lib/api/generated';

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

	{#if func.description}
		<p class="api-method-desc">{func.description}</p>
	{/if}

	{#if func.parameters && func.parameters.length > 0}
		<div class="api-method-params">
			{#each func.parameters as param}
				<div class="api-method-param">
					<code class="api-method-param-name">{param.name}</code>
					{#if param.type}
						<span class="api-method-param-type">{param.type}</span>
					{/if}
					{#if param.default}
						<span class="api-method-param-default">= {param.default}</span>
					{/if}
					{#if param.description}
						<span class="api-method-param-desc">{param.description}</span>
					{/if}
				</div>
			{/each}
		</div>
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
		font-size: var(--font-xs);
		color: var(--text-muted);
		background: var(--surface);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.api-method-desc {
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin: var(--space-sm) 0;
	}

	.api-method-params {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
	}

	.api-method-param {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		flex-wrap: wrap;
		font-size: var(--font-sm);
	}

	.api-method-param-name {
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
		font-size: var(--font-sm);
	}

	.api-method-param-type {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
	}

	.api-method-param-default {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-disabled);
	}

	.api-method-param-desc {
		color: var(--text-muted);
		flex-basis: 100%;
		padding-left: var(--space-md);
	}

	.api-method-returns {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border);
		font-size: var(--font-sm);
	}

	.api-method-returns-label {
		font-size: var(--font-xs);
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.api-method-returns code {
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}
</style>
