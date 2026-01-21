<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import Icon from '$lib/components/common/Icon.svelte';
	import type { PackageManifest } from '$lib/api/versions';
	import { isLatestVersion } from '$lib/api/versions';

	interface Props {
		packageId: string;
		currentVersion: string;
		manifest: PackageManifest;
	}

	let { packageId, currentVersion, manifest }: Props = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement | null = $state(null);

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function selectVersion(version: string) {
		isOpen = false;

		// Preserve current hash if it exists
		const hash = typeof window !== 'undefined' ? window.location.hash : '';

		// Navigate to the new version
		const versionPath = isLatestVersion(version, manifest) ? '' : `/v${version}`;
		goto(`${base}/${packageId}/api${versionPath}${hash}`);
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="version-selector" bind:this={dropdownRef}>
	<button class="version-trigger" onclick={toggleDropdown} aria-expanded={isOpen}>
		<span class="version-text">v{currentVersion}</span>
		<Icon name="chevron-down" size={10} />
	</button>

	{#if isOpen}
		<div class="dropdown">
			{#each manifest.versions as v}
				{@const isSelected = v.version === currentVersion}
				{@const isLatest = isLatestVersion(v.version, manifest)}
				<button
					class="dropdown-item"
					class:selected={isSelected}
					onclick={() => selectVersion(v.version)}
				>
					<span class="dropdown-version">v{v.version}</span>
					{#if isLatest}
						<span class="latest-badge">latest</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.version-selector {
		position: absolute;
		top: var(--space-lg);
		right: 0;
		z-index: var(--z-dropdown);
	}

	.version-trigger {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.version-trigger:hover {
		color: var(--text);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + var(--space-xs));
		right: 0;
		min-width: 100px;
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.dropdown-item {
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

	.dropdown-item:hover {
		background: var(--surface-hover);
		color: var(--text);
	}

	.dropdown-item.selected {
		color: var(--accent);
	}

	.latest-badge {
		font-size: 10px;
		color: var(--text-disabled);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>
