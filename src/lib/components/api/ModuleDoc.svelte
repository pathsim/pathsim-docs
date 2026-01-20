<script lang="ts">
	import type { APIModule } from '$lib/api/generated';
	import ClassDoc from './ClassDoc.svelte';
	import FunctionDoc from './FunctionDoc.svelte';

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

	{#if module.classes && module.classes.length > 0}
		<div class="api-module-section">
			<h4 class="api-module-section-title">Classes</h4>
			{#each module.classes as cls}
				<ClassDoc {cls} expanded={defaultExpanded} />
			{/each}
		</div>
	{/if}

	{#if module.functions && module.functions.length > 0}
		<div class="api-module-section">
			<h4 class="api-module-section-title">Functions</h4>
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
		margin-bottom: var(--space-xl);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	.api-module-name {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin: 0 0 var(--space-xs);
	}

	.api-module-name code {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}

	.api-module-desc {
		color: var(--text-muted);
		margin: 0;
		font-size: var(--font-sm);
	}

	.api-module-section {
		margin-top: var(--space-xl);
	}

	.api-module-section-title {
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.api-module-functions {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
</style>
