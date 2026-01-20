<script lang="ts">
	import type { APIClass } from '$lib/api/generated';
	import FunctionDoc from './FunctionDoc.svelte';

	interface Props {
		cls: APIClass;
		expanded?: boolean;
	}

	let { cls, expanded = false }: Props = $props();
	let isExpanded = $state(expanded);

	// Filter methods - skip __init__ since we show parameters separately
	let publicMethods = $derived(
		cls.methods.filter((m) => m.name !== '__init__' && !m.name.startsWith('_'))
	);
</script>

<div class="class-doc" id={cls.name}>
	<button class="class-header" onclick={() => (isExpanded = !isExpanded)}>
		<div class="class-title">
			<span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
			<code class="class-name">{cls.name}</code>
			{#if cls.bases && cls.bases.length > 0}
				<span class="class-bases">({cls.bases.join(', ')})</span>
			{/if}
		</div>
		<span class="class-description">{cls.description}</span>
	</button>

	{#if isExpanded}
		<div class="class-body">
			{#if cls.docstring_html}
				<div class="docstring">
					{@html cls.docstring_html}
				</div>
			{/if}

			{#if cls.parameters && cls.parameters.length > 0}
				<div class="section">
					<h5 class="section-title">Constructor Parameters</h5>
					<table class="api-param-table">
						<thead>
							<tr>
								<th>Parameter</th>
								<th>Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							{#each cls.parameters as param}
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
				</div>
			{/if}

			{#if cls.attributes && cls.attributes.length > 0}
				<div class="section">
					<h5 class="section-title">Attributes</h5>
					<table class="api-param-table">
						<thead>
							<tr>
								<th>Attribute</th>
								<th>Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							{#each cls.attributes as attr}
								<tr>
									<td>{attr.name}</td>
									<td>{attr.type || ''}</td>
									<td>{attr.description || ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			{#if publicMethods.length > 0}
				<div class="section">
					<h5 class="section-title">Methods</h5>
					{#each publicMethods as method}
						<FunctionDoc func={method} isMethod={true} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.class-doc {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-lg);
		overflow: hidden;
	}

	.class-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
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

	.class-header:hover {
		background: var(--surface-hover);
	}

	.class-title {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.expand-icon {
		font-size: var(--font-xs);
		color: var(--text-muted);
		width: 12px;
	}

	.class-name {
		font-size: var(--font-md);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
	}

	.class-bases {
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	.class-description {
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin-left: calc(12px + var(--space-sm));
	}

	.class-body {
		padding: var(--space-lg);
		background: var(--surface);
		border-top: 1px solid var(--border);
	}

	.docstring {
		margin-bottom: var(--space-lg);
		font-size: var(--font-sm);
		line-height: 1.6;
	}

	.docstring :global(p) {
		margin-bottom: 0.75em;
	}

	.docstring :global(pre) {
		margin: 1em 0;
	}

	.docstring :global(dl) {
		margin: 0.5em 0;
	}

	.docstring :global(dt) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--accent);
		margin-top: 0.5em;
	}

	.docstring :global(dd) {
		margin-left: var(--space-lg);
		color: var(--text-muted);
	}

	.section {
		margin-top: var(--space-xl);
	}

	.section:first-child {
		margin-top: 0;
	}

	.section-title {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.param-default {
		color: var(--text-muted);
		font-size: var(--font-xs);
	}
</style>
