<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';

	interface Props {
		value: string;
		isSearching?: boolean;
		placeholder?: string;
		inputRef?: HTMLInputElement | null;
		onkeydown?: (event: KeyboardEvent) => void;
	}

	let {
		value = $bindable(''),
		isSearching = false,
		placeholder = 'Search docs...',
		inputRef = $bindable(null),
		onkeydown
	}: Props = $props();
</script>

<div class="search-input-wrapper">
	<span class="search-icon"><Icon name="search" size={14} /></span>
	<input
		type="text"
		{placeholder}
		bind:value
		bind:this={inputRef}
		class="search-input"
		{onkeydown}
	/>
	{#if isSearching}
		<span class="search-spinner"></span>
	{:else if value}
		<button class="clear-btn" onclick={() => (value = '')}>
			<Icon name="x" size={12} />
		</button>
	{/if}
</div>

<style>
	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
	}

	.search-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		border-radius: 0;
		font-size: var(--font-base);
		color: var(--text);
		outline: none;
		box-shadow: none;
		padding: 0;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 2px;
		cursor: pointer;
	}

	.clear-btn:hover {
		color: var(--text);
	}
</style>
