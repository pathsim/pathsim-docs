<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/common/Icon.svelte';
	import { packages, packageOrder, external } from '$lib/config/packages';

	let redirecting = $state(false);
	let redirectTarget = $state('');

	/**
	 * Try to map old RTD URLs to new structure
	 * Old: /en/latest/api/pathsim.html -> New: /pathsim/latest/api
	 * Old: /en/v0.16.0/examples/... -> New: /pathsim/v0.16.0/examples/...
	 */
	function getRedirectUrl(pathname: string): string | null {
		// Match RTD pattern: /en/{version}/{rest}
		const rtdMatch = pathname.match(/^\/en\/([^/]+)(?:\/(.*))?$/);
		if (!rtdMatch) return null;

		const [, version, rest] = rtdMatch;

		// Normalize version
		let normalizedVersion = version;
		if (version === 'latest' || version === 'stable') {
			normalizedVersion = 'latest';
		} else if (version.match(/^v?\d+\.\d+/)) {
			normalizedVersion = version.startsWith('v') ? version : `v${version}`;
		}

		// Build new path - RTD docs were for pathsim package
		let newPath = `${base}/pathsim`;

		if (rest) {
			if (rest.startsWith('api/') || rest === 'api') {
				newPath = `${base}/pathsim/${normalizedVersion}/api`;
			} else if (rest.startsWith('examples/') || rest === 'examples') {
				newPath = `${base}/pathsim/${normalizedVersion}/examples`;
			} else if (rest.endsWith('.html')) {
				newPath = `${base}/pathsim`;
			} else {
				newPath = `${base}/pathsim/${normalizedVersion}/${rest}`;
			}
		}

		return newPath;
	}

	onMount(() => {
		const pathname = $page.url.pathname;
		const redirect = getRedirectUrl(pathname);

		if (redirect && $page.status === 404) {
			redirecting = true;
			redirectTarget = redirect;
			setTimeout(() => {
				goto(redirect, { replaceState: true });
			}, 1500);
		}
	});
</script>

<svelte:head>
	<title>PathSim Docs - {$page.status === 404 ? 'Page Not Found' : 'Error'}</title>
</svelte:head>

<div class="page-wrapper">
	<main>
		{#if redirecting}
			<section class="error-section">
				<div class="redirect-notice">
					<Icon name="arrow-right" size={24} />
					<h2>Redirecting...</h2>
					<p>This page has moved. Taking you to the new location.</p>
					<code>{redirectTarget}</code>
				</div>
			</section>
		{:else}
			<section class="error-section">
				<div class="error-code">{$page.status}</div>

				{#if $page.status === 404}
					<h1>Page not found</h1>
					<p class="error-message">
						The page you're looking for doesn't exist or has been moved.
					</p>

					{#if $page.url.pathname.includes('/en/')}
						<p class="migration-hint">
							Looking for the old Read the Docs site? The documentation has moved to a new structure.
						</p>
					{/if}
				{:else}
					<h1>Something went wrong</h1>
					<p class="error-message">{$page.error?.message || 'An unexpected error occurred'}</p>
				{/if}
			</section>

			<div class="separator"></div>

			<section class="packages-section">
				<h2>Browse Documentation</h2>
				<div class="package-grid">
					{#each packageOrder as pkgId}
						{@const pkg = packages[pkgId]}
						<a href="{base}/{pkg.docs}" class="package-card elevated">
							<img src="{base}/{pkg.logo}" alt={pkg.name} />
							<span class="package-name">{pkg.shortName}</span>
						</a>
					{/each}
				</div>
			</section>

			<div class="separator"></div>

			<section class="actions-section">
				<h2>Quick Links</h2>
				<div class="actions-row">
					<a href="{base}/" class="action-card">
						<Icon name="home" size={20} />
						<span class="action-label">Home</span>
					</a>
					<a href="{base}/pathsim/latest/api" class="action-card">
						<Icon name="braces" size={20} />
						<span class="action-label">API Reference</span>
					</a>
					<a href="{base}/pathsim/latest/examples" class="action-card">
						<Icon name="play" size={20} />
						<span class="action-label">Examples</span>
					</a>
					<a href={external.github} class="action-card">
						<Icon name="github" size={20} />
						<span class="action-label">GitHub</span>
					</a>
				</div>
			</section>
		{/if}
	</main>
</div>

<style>
	.page-wrapper {
		flex: 1;
		overflow-x: hidden;
		overflow-y: auto;
	}

	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 var(--space-lg);
	}

	section {
		padding: var(--space-xl) 0;
	}

	h1 {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	h2 {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-lg);
	}

	.error-section {
		text-align: center;
		padding: var(--space-3xl) 0 var(--space-xl);
	}

	.error-code {
		font-size: 100px;
		font-weight: 700;
		color: var(--text-muted);
		line-height: 1;
		opacity: 0.2;
		margin-bottom: var(--space-md);
	}

	.error-message {
		font-size: var(--font-md);
		color: var(--text-muted);
	}

	.migration-hint {
		font-size: var(--font-base);
		color: var(--text-muted);
		margin-top: var(--space-lg);
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-raised);
		border-radius: var(--radius-md);
		display: inline-block;
	}

	.redirect-notice {
		text-align: center;
		padding: var(--space-2xl) 0;
	}

	.redirect-notice h2 {
		font-size: var(--font-lg);
		color: var(--text);
		text-transform: none;
		margin: var(--space-md) 0;
	}

	.redirect-notice p {
		color: var(--text-muted);
		margin-bottom: var(--space-md);
	}

	.redirect-notice code {
		display: inline-block;
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-raised);
		border-radius: var(--radius-sm);
		font-size: var(--font-base);
		font-family: var(--font-mono);
	}

	.packages-section {
		text-align: center;
	}

	.package-grid {
		display: flex;
		justify-content: center;
		gap: var(--space-lg);
		flex-wrap: wrap;
	}

	.package-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--text);
		transition: all var(--transition-fast);
		min-width: 140px;
	}

	.package-card:hover {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
		text-decoration: none;
	}

	.package-card img {
		height: 60px;
		width: auto;
		object-fit: contain;
	}

	.package-name {
		font-size: var(--font-base);
		font-weight: 500;
		color: var(--text-muted);
	}

	.actions-section {
		text-align: center;
	}

	.actions-row {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	@media (max-width: 600px) {
		.error-code {
			font-size: 72px;
		}

		.package-grid {
			gap: var(--space-md);
		}

		.package-card {
			min-width: 100px;
			padding: var(--space-md);
		}

		.package-card img {
			height: 48px;
		}
	}
</style>
