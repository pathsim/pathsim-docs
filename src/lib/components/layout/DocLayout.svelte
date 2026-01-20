<script lang="ts">
	import { Sidebar, TableOfContents, Breadcrumb } from './index';
	import type { PackageId } from '$lib/config/links';
	import type { Snippet } from 'svelte';

	interface Props {
		packageId: PackageId;
		showToc?: boolean;
		children: Snippet;
	}

	let { packageId, showToc = true, children }: Props = $props();
</script>

<div class="doc-layout">
	<Sidebar {packageId} />
	<div class="doc-main">
		<div class="doc-content">
			<Breadcrumb />
			<article class="prose">
				{@render children()}
			</article>
		</div>
		{#if showToc}
			<TableOfContents />
		{/if}
	</div>
</div>

<style>
	.doc-layout {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.doc-layout :global(.sidebar) {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.doc-layout :global(.sidebar) {
			display: none;
		}
	}

	.doc-main {
		flex: 1;
		display: flex;
		min-width: 0;
		overflow-y: auto;
	}

	.doc-content {
		flex: 1;
		max-width: var(--content-max-width, 800px);
		margin: 0 auto;
		padding: var(--space-lg) var(--space-xl);
	}

	.doc-content :global(.toc) {
		display: none;
	}

	@media (min-width: 1200px) {
		.doc-main :global(.toc) {
			display: block;
			flex-shrink: 0;
		}
	}

	.prose {
		line-height: 1.7;
	}

	.prose :global(h1) {
		font-size: var(--font-3xl);
		margin-bottom: var(--space-lg);
	}

	.prose :global(h2) {
		font-size: var(--font-2xl);
		margin-top: var(--space-2xl);
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border);
	}

	.prose :global(h3) {
		font-size: var(--font-xl);
		margin-top: var(--space-xl);
		margin-bottom: var(--space-sm);
	}

	.prose :global(p) {
		margin-bottom: var(--space-md);
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin-bottom: var(--space-md);
		padding-left: var(--space-xl);
	}

	.prose :global(li) {
		margin-bottom: var(--space-xs);
	}

	.prose :global(pre) {
		margin: var(--space-lg) 0;
	}

	.prose :global(code) {
		font-size: 0.9em;
	}

	.prose :global(a) {
		color: var(--accent);
		text-decoration: none;
	}

	.prose :global(a:hover) {
		text-decoration: underline;
	}
</style>
