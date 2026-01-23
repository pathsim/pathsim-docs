<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import { getTypeIcon, type SearchResult } from '$lib/utils/search';

	interface Props {
		result: SearchResult;
		variant?: 'list' | 'card';
		onclick?: () => void;
	}

	let { result, variant = 'list', onclick }: Props = $props();

	let context = $derived(
		result.parentClass ||
		(variant === 'list' ? result.moduleName.split('.').pop() : result.moduleName)
	);
</script>

<button class="search-result {variant}" {onclick}>
	<span class="result-icon">
		<Icon name={getTypeIcon(result.type)} size={variant === 'card' ? 16 : 14} />
	</span>
	<div class="result-text">
		<span class="result-name">{result.name}</span>
		<span class="result-context">{context}</span>
	</div>
</button>

<style>
	.search-result {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: var(--text-muted);
		transition: all var(--transition-fast);
		width: 100%;
	}

	/* List variant (sidebar) */
	.search-result.list {
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		justify-content: flex-start;
	}

	.search-result.list:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	/* Card variant (front page) */
	.search-result.card {
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.search-result.card:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-md), 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.result-icon {
		flex-shrink: 0;
	}

	.search-result.list .result-icon {
		margin-top: 2px;
	}

	.result-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
	}

	.search-result.card .result-text {
		flex: 1;
		gap: 2px;
	}

	.result-name {
		font-size: var(--font-base);
		color: var(--text);
	}

	.search-result.card .result-name {
		font-weight: 600;
	}

	.result-context {
		font-size: var(--font-base);
		color: var(--text-muted);
	}

	.search-result.card .result-context {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
