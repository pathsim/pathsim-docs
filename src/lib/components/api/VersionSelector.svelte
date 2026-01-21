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
	<button class="version-button" onclick={toggleDropdown} aria-expanded={isOpen}>
		<span class="version-label">v{currentVersion}</span>
		<span class="chevron" class:open={isOpen}>
			<Icon name="chevron-down" size={12} />
		</span>
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
						<span class="badge accent">latest</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.version-selector {
		position: relative;
		display: inline-block;
	}

	.version-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-md);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--text);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.version-button:hover {
		border-color: var(--accent);
		background: var(--surface-hover);
	}

	.chevron {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		transition: transform var(--transition-fast);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + var(--space-xs));
		right: 0;
		min-width: 140px;
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		z-index: var(--z-dropdown);
		overflow: hidden;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: transparent;
		border: none;
		border-radius: 0;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.dropdown-item:hover {
		background: var(--surface-hover);
	}

	.dropdown-item.selected {
		background: var(--accent-bg);
		color: var(--accent);
	}

	.dropdown-version {
		flex: 1;
	}
</style>
