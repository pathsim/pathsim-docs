<script lang="ts">
	import { Sidebar } from './index';
	import ScrollToTop from '$lib/components/common/ScrollToTop.svelte';
	import type { PackageId } from '$lib/config/packages';
	import type { PackageManifest } from '$lib/api/versions';
	import type { Snippet } from 'svelte';

	interface Props {
		packageId: PackageId;
		manifest?: PackageManifest;
		currentTag?: string;
		children: Snippet;
	}

	let { packageId, manifest, currentTag, children }: Props = $props();
</script>

<div class="doc-layout">
	<Sidebar {packageId} {manifest} {currentTag} />
	<div class="doc-main">
		<div class="doc-content">
			<article class="prose">
				{@render children()}
			</article>
		</div>
	</div>
	<ScrollToTop />
</div>

<style>
	.doc-layout {
		display: flex;
		flex: 1;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
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
		min-height: 0;
		background: var(--surface);
		overflow-x: hidden; /* Clip separators at content area edge */
		overflow-y: auto; /* This is the main scrollable area */
	}

	.doc-content {
		flex: 1;
		min-width: 0;
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: var(--space-xl);
		padding-bottom: var(--space-2xl);
	}

	@media (max-width: 600px) {
		.doc-content {
			padding: var(--space-md);
			padding-bottom: var(--space-xl);
		}
	}
</style>
