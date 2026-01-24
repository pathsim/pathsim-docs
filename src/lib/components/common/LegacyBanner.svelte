<script lang="ts">
	import Icon from './Icon.svelte';

	let dismissed = $state(false);
</script>

{#if !dismissed}
	<div class="legacy-banner">
		<span class="banner-text">
			Looking for the old documentation?
			<a href="https://legacy.docs.pathsim.org" target="_blank" rel="noopener noreferrer">
				Visit the legacy docs
				<Icon name="external-link" size={12} />
			</a>
		</span>
		<button class="dismiss-btn" onclick={() => dismissed = true} aria-label="Dismiss banner">
			<Icon name="x" size={14} />
		</button>
	</div>
{/if}

<style>
	.legacy-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		padding: var(--space-sm) var(--space-lg);
		background: var(--accent);
		color: white;
		font-size: var(--font-base);
		font-weight: 500;
	}

	.banner-text {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.banner-text a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: white;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.banner-text a:hover {
		opacity: 0.9;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: white;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity var(--transition-fast);
	}

	.dismiss-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}
</style>
