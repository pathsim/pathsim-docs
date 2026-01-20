<script lang="ts">
	import { Sidebar } from './index';
	import type { PackageId } from '$lib/config/packages';
	import type { Snippet } from 'svelte';

	interface Props {
		packageId: PackageId;
		children: Snippet;
	}

	let { packageId, children }: Props = $props();
</script>

<div class="doc-layout">
	<Sidebar {packageId} />
	<div class="doc-main">
		<div class="doc-content">
			<article class="prose">
				{@render children()}
			</article>
		</div>
	</div>
</div>

<style>
	.doc-layout {
		display: flex;
		flex: 1;
		align-items: flex-start;
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
		background: var(--surface);
		overflow-x: hidden; /* Clip separators at content area edge */
	}

	.doc-content {
		flex: 1;
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: var(--space-xl);
	}
</style>
