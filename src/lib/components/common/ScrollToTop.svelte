<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from './Icon.svelte';

	let visible = $state(false);
	let scrollContainer: HTMLElement | null = null;

	function handleScroll() {
		if (scrollContainer) {
			visible = scrollContainer.scrollTop > 300;
		}
	}

	function scrollToTop() {
		scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	onMount(() => {
		// Find the scrollable container (doc-main in DocLayout)
		scrollContainer = document.querySelector('.doc-main');
		if (scrollContainer) {
			scrollContainer.addEventListener('scroll', handleScroll);
			handleScroll(); // Check initial state
		}
	});

	onDestroy(() => {
		if (scrollContainer) {
			scrollContainer.removeEventListener('scroll', handleScroll);
		}
	});
</script>

{#if visible}
	<button
		class="scroll-to-top elevated"
		onclick={scrollToTop}
		aria-label="Scroll to top"
	>
		<Icon name="chevron-up" size={18} />
	</button>
{/if}

<style>
	.scroll-to-top {
		position: fixed;
		bottom: calc(var(--header-height) + var(--space-xl));
		right: var(--space-xl);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--surface-raised);
		border: 1px solid var(--border);
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		z-index: var(--z-sticky);
		padding: 0;
	}

	.scroll-to-top:hover {
		color: var(--text);
		border-color: var(--accent);
	}
</style>
