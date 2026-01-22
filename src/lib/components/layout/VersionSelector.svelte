<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import type { PackageId } from '$lib/config/packages';
	import type { PackageManifest } from '$lib/api/versions';
	import { isLatestTag, versionHasExamples } from '$lib/api/versions';

	interface Props {
		packageId: PackageId;
		manifest: PackageManifest;
		currentTag: string;
	}

	let { packageId, manifest, currentTag }: Props = $props();

	let dropdownOpen = $state(false);
	let dropdownRef = $state<HTMLDivElement | null>(null);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	async function selectVersion(tag: string) {
		dropdownOpen = false;

		// Update stored version preference
		const { versionStore } = await import('$lib/stores/versionStore');
		versionStore.setVersion(packageId, tag);

		// Check if the new version has examples
		const newVersionHasExamples = versionHasExamples(tag, manifest);

		// Preserve current hash if it exists
		const hash = typeof window !== 'undefined' ? window.location.hash : '';

		// Get current page type (api or examples or overview)
		const pathname = $page.url.pathname;

		if (pathname.includes('/examples')) {
			// On examples page - check if new version has examples
			if (newVersionHasExamples) {
				if (pathname.includes('/examples/')) {
					// We're on a specific example page
					const match = pathname.match(/\/examples\/(.+)$/);
					const subPath = match ? `/${match[1]}` : '';
					goto(`${base}/${packageId}/${tag}/examples${subPath}${hash}`, { invalidateAll: true });
				} else {
					goto(`${base}/${packageId}/${tag}/examples${hash}`, { invalidateAll: true });
				}
			} else {
				// New version has no examples - go to overview
				goto(`${base}/${packageId}`, { invalidateAll: true });
			}
		} else if (pathname.includes('/api')) {
			goto(`${base}/${packageId}/${tag}/api${hash}`, { invalidateAll: true });
		} else {
			// On overview page - reload to pick up new version
			const { invalidateAll } = await import('$app/navigation');
			await invalidateAll();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			dropdownOpen = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dropdownOpen = false;
		}
	}

	$effect(() => {
		if (dropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="version-selector-container" bind:this={dropdownRef}>
	<button
		class="version-selector-trigger"
		onclick={toggleDropdown}
		aria-expanded={dropdownOpen}
	>
		<span class="version-text">{currentTag}</span>
		<Icon name="chevron-down" size={10} />
	</button>

	{#if dropdownOpen}
		<div class="version-dropdown">
			{#each manifest.versions as v}
				{@const isSelected = v.tag === currentTag}
				{@const isLatest = isLatestTag(v.tag, manifest)}
				<button
					class="version-item"
					class:selected={isSelected}
					onclick={() => selectVersion(v.tag)}
				>
					<span class="version-tag">{v.tag}</span>
					{#if isLatest}
						<span class="latest-badge">latest</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.version-selector-container {
		position: relative;
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	.version-selector-trigger {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.version-selector-trigger:hover {
		color: var(--text);
		border-color: var(--border-hover);
	}

	.version-text {
		flex: 1;
		text-align: left;
	}

	.version-dropdown {
		position: absolute;
		top: 100%;
		left: var(--space-md);
		right: var(--space-md);
		margin-top: var(--space-xs);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		overflow: hidden;
		z-index: var(--z-dropdown);
		max-height: 300px;
		overflow-y: auto;
	}

	.version-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-xs) var(--space-md);
		background: transparent;
		border: none;
		border-radius: 0;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.version-item:hover {
		background: var(--surface-hover);
		color: var(--text);
	}

	.version-item.selected {
		color: var(--accent);
	}

	.latest-badge {
		font-size: 10px;
		color: var(--text-disabled);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>
