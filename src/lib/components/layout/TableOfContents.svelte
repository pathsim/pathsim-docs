<script lang="ts">
	import { onMount } from 'svelte';

	interface TocItem {
		id: string;
		text: string;
		level: number;
	}

	interface Props {
		selector?: string;
	}

	let { selector = 'h2, h3' }: Props = $props();

	let items = $state<TocItem[]>([]);
	let activeId = $state<string | null>(null);

	onMount(() => {
		// Extract headings from page content
		const headings = document.querySelectorAll(selector);
		items = Array.from(headings)
			.filter((h) => h.id)
			.map((h) => ({
				id: h.id,
				text: h.textContent || '',
				level: parseInt(h.tagName.charAt(1))
			}));

		// Set up intersection observer for scroll spy
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
						break;
					}
				}
			},
			{
				rootMargin: '-80px 0px -80% 0px',
				threshold: 0
			}
		);

		headings.forEach((h) => {
			if (h.id) observer.observe(h);
		});

		return () => observer.disconnect();
	});

	function scrollToHeading(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

{#if items.length > 0}
	<nav class="toc">
		<div class="toc-header">On this page</div>
		<ul class="toc-list">
			{#each items as item}
				<li>
					<button
						class="toc-item"
						class:active={activeId === item.id}
						class:level-3={item.level === 3}
						onclick={() => scrollToHeading(item.id)}
					>
						{item.text}
					</button>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.toc {
		width: var(--toc-width, 200px);
		padding: var(--space-lg);
		position: sticky;
		top: 80px;
		max-height: calc(100vh - 100px);
		overflow-y: auto;
	}

	.toc-header {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
		margin-bottom: var(--space-md);
	}

	.toc-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc-item {
		display: block;
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-xs);
		color: var(--text-muted);
		text-align: left;
		text-decoration: none;
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.toc-item:hover {
		color: var(--text);
	}

	.toc-item.active {
		color: var(--accent);
		border-left-color: var(--accent);
	}

	.toc-item.level-3 {
		padding-left: var(--space-lg);
		font-size: var(--font-xs);
	}
</style>
