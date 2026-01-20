<script lang="ts">
	import type { APIClass } from '$lib/api/generated';
	import FunctionDoc from './FunctionDoc.svelte';
	import Icon from '$lib/components/common/Icon.svelte';

	interface Props {
		cls: APIClass;
		expanded?: boolean;
	}

	let { cls, expanded: initialExpanded = false }: Props = $props();
	let isExpanded = $state(initialExpanded);

	// Filter methods - skip __init__ since we show parameters separately
	let publicMethods = $derived(
		cls.methods.filter((m) => m.name !== '__init__' && !m.name.startsWith('_'))
	);
</script>

<div class="api-class" id={cls.name}>
	<button class="api-class-header" onclick={() => (isExpanded = !isExpanded)}>
		<div class="api-class-title">
			<span class="api-class-toggle" class:expanded={isExpanded}>
				<Icon name="chevron-right" size={14} />
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
				<div class="api-docstring">
					{@html cls.docstring_html}
				</div>
			{/if}

			{#if cls.parameters && cls.parameters.length > 0}
				<div class="api-section">
					<h5 class="api-section-title">Constructor Parameters</h5>
					<div class="api-params">
						{#each cls.parameters as param}
							<div class="api-param">
								<div class="api-param-name">
									<code>{param.name}</code>
									{#if param.type}
										<span class="api-param-type">{param.type}</span>
									{/if}
									{#if param.default}
										<span class="api-param-default">= {param.default}</span>
									{/if}
								</div>
								{#if param.description}
									<p class="api-param-desc">{param.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if cls.attributes && cls.attributes.length > 0}
				<div class="api-section">
					<h5 class="api-section-title">Attributes</h5>
					<div class="api-params">
						{#each cls.attributes as attr}
							<div class="api-param">
								<div class="api-param-name">
									<code>{attr.name}</code>
									{#if attr.type}
										<span class="api-param-type">{attr.type}</span>
									{/if}
								</div>
								{#if attr.description}
									<p class="api-param-desc">{attr.description}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if publicMethods.length > 0}
				<div class="api-section">
					<h5 class="api-section-title">Methods</h5>
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
		color: var(--text-muted);
		transition: transform var(--transition-fast);
	}

	.api-class-toggle.expanded {
		transform: rotate(90deg);
	}

	.api-class-name {
		font-size: var(--font-md);
		font-weight: 600;
		color: var(--accent);
		background: none;
		border: none;
		padding: 0;
	}

	.api-class-bases {
		font-size: var(--font-sm);
		color: var(--text-muted);
		font-family: var(--font-mono);
	}

	.api-class-desc {
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin-left: calc(14px + var(--space-sm));
	}

	.api-class-body {
		padding: var(--space-lg);
		background: var(--surface);
		border-top: 1px solid var(--border);
	}

	.api-docstring {
		font-size: var(--font-sm);
		line-height: 1.6;
		margin-bottom: var(--space-lg);
	}

	.api-docstring :global(p) {
		margin-bottom: 0.75em;
	}

	.api-docstring :global(p:last-child) {
		margin-bottom: 0;
	}

	.api-docstring :global(pre) {
		margin: 1em 0;
	}

	.api-docstring :global(dl) {
		margin: 0.5em 0;
	}

	.api-docstring :global(dt) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--accent);
		margin-top: 0.5em;
	}

	.api-docstring :global(dd) {
		margin-left: var(--space-lg);
		color: var(--text-muted);
	}

	.api-section {
		margin-top: var(--space-xl);
	}

	.api-section:first-child {
		margin-top: 0;
	}

	.api-section-title {
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.api-params {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.api-param {
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-raised);
		border-radius: var(--radius-md);
	}

	.api-param-name {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.api-param-name code {
		color: var(--accent);
		font-size: var(--font-sm);
		background: none;
		border: none;
		padding: 0;
	}

	.api-param-type {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
	}

	.api-param-default {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-disabled);
	}

	.api-param-desc {
		margin: var(--space-xs) 0 0;
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	.api-methods {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
</style>
