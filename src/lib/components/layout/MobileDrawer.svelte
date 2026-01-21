<script lang="ts">
	import { base } from '$app/paths';
	import Icon from '$lib/components/common/Icon.svelte';
	import Sidebar from './Sidebar.svelte';
	import { packages, packageOrder, type PackageId } from '$lib/config/packages';

	interface Props {
		open: boolean;
		packageId: PackageId | null;
		onClose: () => void;
	}

	let { open, packageId, onClose }: Props = $props();

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	// Prevent body scroll when open
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="drawer-backdrop" onclick={onClose} role="presentation"></div>
	<div class="drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
		<div class="drawer-header">
			<span class="drawer-title">Navigation</span>
			<button class="icon-btn" onclick={onClose} aria-label="Close menu">
				<Icon name="x" size={14} />
			</button>
		</div>
		<div class="drawer-content">
			<!-- Package selector for mobile -->
			<nav class="mobile-package-nav">
				{#each packageOrder as id}
					{@const pkg = packages[id]}
					<a
						href="{base}/{pkg.docs}"
						class="mobile-package-link"
						class:active={packageId === id}
						onclick={onClose}
					>
						{pkg.name}
					</a>
				{/each}
			</nav>

			{#if packageId}
				<div class="drawer-divider"></div>
				<Sidebar {packageId} />
			{/if}
		</div>
	</div>
{/if}

<style>
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 200;
	}

	.drawer {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: 300px;
		max-width: 85vw;
		background: var(--surface);
		border-right: 1px solid var(--border);
		z-index: 201;
		display: flex;
		flex-direction: column;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) var(--space-lg);
		background: var(--surface-raised);
		border-bottom: 1px solid var(--border);
	}

	.drawer-title {
		font-size: var(--font-base);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-muted);
	}

	.drawer-content {
		flex: 1;
		overflow-y: auto;
	}

	.drawer-content :global(.sidebar) {
		width: 100%;
		border-right: none;
	}

	.mobile-package-nav {
		display: flex;
		flex-direction: column;
		padding: var(--space-md);
		gap: var(--space-xs);
	}

	.mobile-package-link {
		display: block;
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-base);
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.mobile-package-link:hover {
		color: var(--text);
		background: var(--surface-hover);
		text-decoration: none;
	}

	.mobile-package-link.active {
		color: var(--accent);
		background: var(--accent-bg);
	}

	.drawer-divider {
		height: 1px;
		background: var(--border);
		margin: 0 var(--space-lg);
	}
</style>
