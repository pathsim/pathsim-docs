<script lang="ts">
	import type { APIModule } from '$lib/api/generated';
	import ClassDoc from './ClassDoc.svelte';
	import FunctionDoc from './FunctionDoc.svelte';
	import DocstringRenderer from './DocstringRenderer.svelte';

	interface Props {
		module: APIModule;
		defaultExpanded?: boolean;
	}

	let { module, defaultExpanded = false }: Props = $props();
</script>

<section class="api-module" id={module.name.replace(/\./g, '-')}>
	<header class="api-module-header">
		<h3 class="api-module-name">
			<code>{module.name}</code>
		</h3>
		{#if module.description}
			<p class="api-module-desc">{module.description}</p>
		{/if}
	</header>

	{#if module.docstring_html}
		<div class="api-module-docstring">
			<DocstringRenderer html={module.docstring_html} />
		</div>
	{/if}

	{#if module.classes && module.classes.length > 0}
		<div class="api-module-section">
			<div class="api-module-section-header">
				<span class="api-module-section-title">Classes</span>
			</div>
			{#each module.classes as cls}
				<ClassDoc {cls} expanded={defaultExpanded} />
			{/each}
		</div>
	{/if}

	{#if module.functions && module.functions.length > 0}
		<div class="api-module-section">
			<div class="api-module-section-header">
				<span class="api-module-section-title">Functions</span>
			</div>
			<div class="api-module-functions">
				{#each module.functions as func}
					<FunctionDoc {func} />
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.api-module {
		margin-bottom: var(--space-3xl);
	}

	.api-module-header {
		margin-bottom: var(--space-lg);
	}

	.api-module-name {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin: 0 0 var(--space-xs);
	}

	.api-module-name code {
		font-family: var(--font-mono);
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}

	.api-module-desc {
		font-family: var(--font-ui);
		font-size: var(--font-sm);
		color: var(--text-muted);
		margin: 0;
		line-height: 1.5;
	}

	.api-module-docstring {
		margin-bottom: var(--space-xl);
	}

	.api-module-section {
		margin-top: var(--space-xl);
	}

	.api-module-section-header {
		position: relative;
		margin-bottom: var(--space-lg);
		padding-bottom: var(--space-sm);
	}

	/* Full width separator */
	.api-module-section-header::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: calc(-50vw + 50%);
		width: 100vw;
		height: 1px;
		background: var(--border);
	}

	.api-module-section-title {
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.api-module-functions {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
</style>
