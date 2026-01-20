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

<div class="function-doc" id={func.name}>
	<div class="function-header">
		<h4 class="function-name">
			<code>{func.name}</code>
			{#if showBadge}
				<span class="badge accent">{methodType}</span>
			{/if}
		</h4>
	</div>

	{#if func.signature}
		<div class="api-signature">
			<span class="syntax-function">{func.name}</span>{func.signature}
		</div>
	{/if}

	{#if func.description}
		<p class="function-description">{func.description}</p>
	{/if}

	{#if func.parameters && func.parameters.length > 0}
		<table class="api-param-table">
			<thead>
				<tr>
					<th>Parameter</th>
					<th>Type</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				{#each func.parameters as param}
					<tr>
						<td>
							{param.name}
							{#if param.default}
								<span class="param-default">= {param.default}</span>
							{/if}
						</td>
						<td>{param.type || 'any'}</td>
						<td>{param.description || ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#if func.returns}
		<div class="returns">
			<span class="returns-label">Returns:</span>
			<code>{func.returns}</code>
		</div>
	{/if}
</div>

<style>
	.function-doc {
		margin-bottom: var(--space-xl);
		padding-bottom: var(--space-lg);
		border-bottom: 1px solid var(--border);
	}

	.function-doc:last-child {
		border-bottom: none;
	}

	.function-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.function-name {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin: 0;
		font-size: var(--font-md);
		font-weight: 600;
	}

	.function-name code {
		background: none;
		border: none;
		padding: 0;
		color: var(--accent);
		font-size: inherit;
	}

	.function-description {
		color: var(--text-muted);
		margin: var(--space-sm) 0;
	}

	.param-default {
		color: var(--text-muted);
		font-size: var(--font-xs);
	}

	.returns {
		margin-top: var(--space-md);
		font-size: var(--font-sm);
	}

	.returns-label {
		color: var(--text-muted);
		font-weight: 500;
		margin-right: var(--space-sm);
	}

	.returns code {
		color: var(--text);
	}
</style>
