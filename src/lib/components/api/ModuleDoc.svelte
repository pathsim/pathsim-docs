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

<div class="module-doc" id={module.name.replace(/\./g, '-')}>
	<div class="module-header">
		<h3 class="module-name">
			<code>{module.name}</code>
		</h3>
		{#if module.description}
			<p class="module-description">{module.description}</p>
		{/if}
	</div>

	{#if module.submodules && module.submodules.length > 0}
		<div class="module-section">
			<h4 class="section-label">Submodules</h4>
			<div class="submodule-list">
				{#each module.submodules as submodule}
					<a href="#{module.name.replace(/\./g, '-')}-{submodule}" class="submodule-link">
						<code>{submodule}</code>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if module.classes && module.classes.length > 0}
		<div class="module-section">
			<h4 class="section-label">Classes</h4>
			{#each module.classes as cls}
				<ClassDoc {cls} expanded={defaultExpanded} />
			{/each}
		</div>
	{/if}

	{#if module.functions && module.functions.length > 0}
		<div class="module-section">
			<h4 class="section-label">Functions</h4>
			{#each module.functions as func}
				<FunctionDoc {func} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.module-doc {
		margin-bottom: var(--space-3xl);
	}

	.module-header {
		margin-bottom: var(--space-xl);
	}

	.module-name {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin: 0 0 var(--space-sm);
	}

	.module-name code {
		font-size: var(--font-xl);
		font-weight: 600;
		color: var(--text);
		background: none;
		border: none;
		padding: 0;
	}

	.module-description {
		color: var(--text-muted);
		margin: 0;
	}

	.module-section {
		margin-top: var(--space-xl);
	}

	.section-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border);
	}

	.submodule-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.submodule-link {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.submodule-link:hover {
		border-color: var(--accent);
		text-decoration: none;
	}

	.submodule-link code {
		font-size: var(--font-sm);
		background: none;
		border: none;
		padding: 0;
	}
</style>
