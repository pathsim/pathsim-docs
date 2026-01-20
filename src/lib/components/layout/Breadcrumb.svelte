<script lang="ts">
	import { page } from '$app/stores';
	import Icon from '$lib/components/common/Icon.svelte';
	import { packages, type PackageId } from '$lib/config/links';

	interface BreadcrumbItem {
		label: string;
		href: string;
	}

	let items = $derived.by(() => {
		const path = $page.url.pathname;
		const segments = path.split('/').filter(Boolean);
		const result: BreadcrumbItem[] = [];

		if (segments.length === 0) {
			return result;
		}

		// First segment is the package
		const packageId = segments[0] as PackageId;
		const pkg = packages[packageId];

		if (pkg) {
			result.push({ label: pkg.name, href: pkg.docs });
		}

		// Build remaining breadcrumbs
		let currentPath = `/${packageId}`;
		for (let i = 1; i < segments.length; i++) {
			currentPath += `/${segments[i]}`;
			const label = formatSegment(segments[i]);
			result.push({ label, href: currentPath });
		}

		return result;
	});

	function formatSegment(segment: string): string {
		// Convert slug to readable label
		return segment
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

{#if items.length > 0}
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<ol>
			<li>
				<a href="/">Docs</a>
			</li>
			{#each items as item, i}
				<li>
					<Icon name="chevron-right" size={12} />
					{#if i === items.length - 1}
						<span class="current" aria-current="page">{item.label}</span>
					{:else}
						<a href={item.href}>{item.label}</a>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.breadcrumb {
		padding: var(--space-sm) 0;
	}

	ol {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-xs);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	li :global(svg) {
		color: var(--text-disabled);
	}

	a {
		font-size: var(--font-sm);
		color: var(--text-muted);
		text-decoration: none;
	}

	a:hover {
		color: var(--text);
		text-decoration: underline;
	}

	.current {
		font-size: var(--font-sm);
		color: var(--text);
	}
</style>
