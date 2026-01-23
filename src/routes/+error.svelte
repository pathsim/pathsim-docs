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
			// Ensure v prefix
			normalizedVersion = version.startsWith('v') ? version : `v${version}`;
		}

		// Build new path - RTD docs were for pathsim package
		let newPath = `${base}/pathsim`;

		if (rest) {
			// Handle specific RTD paths
			if (rest.startsWith('api/') || rest === 'api') {
				newPath = `${base}/pathsim/${normalizedVersion}/api`;
			} else if (rest.startsWith('examples/') || rest === 'examples') {
				newPath = `${base}/pathsim/${normalizedVersion}/examples`;
			} else if (rest.endsWith('.html')) {
				// Old .html pages -> just go to package root
				newPath = `${base}/pathsim`;
			} else {
				// Try to preserve path structure
				newPath = `${base}/pathsim/${normalizedVersion}/${rest}`;
			}
		} else {
			// Just /en/latest -> /pathsim
			newPath = `${base}/pathsim`;
		}

		return newPath;
	}

	onMount(() => {
		const pathname = $page.url.pathname;
		const redirect = getRedirectUrl(pathname);

		if (redirect && $page.status === 404) {
			redirecting = true;
			redirectTarget = redirect;
			// Small delay so user sees the redirect message
			setTimeout(() => {
				goto(redirect, { replaceState: true });
			}, 1500);
		}
	});

	const quickLinks = [
		{ title: 'PathSim', description: 'Core simulation library', href: `${base}/pathsim`, icon: 'home' },
		{ title: 'API Reference', description: 'Browse the API docs', href: `${base}/pathsim/latest/api`, icon: 'braces' },
		{ title: 'Examples', description: 'Interactive notebooks', href: `${base}/pathsim/latest/examples`, icon: 'play' },
		{ title: 'GitHub', description: 'Source code & issues', href: external.github, icon: 'github', external: true }
	];
</script>

<svelte:head>
	<title>PathSim Docs - {$page.status === 404 ? 'Page Not Found' : 'Error'}</title>
</svelte:head>

<main class="error-page">
	{#if redirecting}
		<div class="redirect-notice">
			<Icon name="arrow-right" size={32} />
			<h1>Redirecting...</h1>
			<p>This page has moved. Taking you to the new location.</p>
			<code>{redirectTarget}</code>
		</div>
	{:else}
		<div class="error-content">
			<h1>{$page.status}</h1>

			{#if $page.status === 404}
				<h2>Page not found</h2>
				<p class="error-message">
					The page you're looking for doesn't exist or has been moved.
				</p>

				{#if $page.url.pathname.includes('/en/')}
					<div class="migration-notice">
						<Icon name="alert-triangle" size={18} />
						<span>
							Looking for the old Read the Docs site? The documentation has moved to a new structure.
						</span>
					</div>
				{/if}
			{:else}
				<h2>Something went wrong</h2>
				<p class="error-message">{$page.error?.message || 'An unexpected error occurred'}</p>
			{/if}

			<div class="quick-links">
				<h3>Try one of these instead:</h3>
				<div class="links-grid">
					{#each quickLinks as link}
						<a
							href={link.href}
							class="quick-link"
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
						>
							<Icon name={link.icon} size={20} />
							<div class="link-text">
								<span class="link-title">{link.title}</span>
								<span class="link-desc">{link.description}</span>
							</div>
							{#if link.external}
								<Icon name="external-link" size={14} />
							{/if}
						</a>
					{/each}
				</div>
			</div>

			<div class="home-link">
				<a href="{base}/">
					<Icon name="arrow-left" size={16} />
					Back to documentation home
				</a>
			</div>
		</div>
	{/if}
</main>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		padding: var(--space-xl);
	}

	.redirect-notice {
		text-align: center;
		animation: fadeIn 0.3s ease;
	}

	.redirect-notice h1 {
		font-size: var(--font-xl);
		margin: var(--space-md) 0;
	}

	.redirect-notice p {
		color: var(--text-muted);
		margin-bottom: var(--space-md);
	}

	.redirect-notice code {
		display: inline-block;
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-hover);
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
	}

	.error-content {
		max-width: 600px;
		text-align: center;
	}

	h1 {
		font-size: 120px;
		font-weight: 700;
		color: var(--text-muted);
		line-height: 1;
		margin: 0;
		opacity: 0.3;
	}

	h2 {
		font-size: var(--font-xl);
		margin: var(--space-sm) 0 var(--space-md);
	}

	.error-message {
		font-size: var(--font-md);
		color: var(--text-muted);
		margin-bottom: var(--space-lg);
	}

	.migration-notice {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: color-mix(in srgb, var(--warning) 15%, transparent);
		border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
		border-radius: var(--radius-md);
		font-size: var(--font-sm);
		color: var(--text);
		margin-bottom: var(--space-xl);
	}

	.quick-links {
		margin-top: var(--space-xl);
		text-align: left;
	}

	.quick-links h3 {
		font-size: var(--font-sm);
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-md);
		text-align: center;
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-sm);
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--text);
		transition: all var(--transition-fast);
	}

	.quick-link:hover {
		background: var(--surface-hover);
		border-color: var(--accent);
		text-decoration: none;
	}

	.link-text {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.link-title {
		font-weight: 500;
	}

	.link-desc {
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	.home-link {
		margin-top: var(--space-xl);
	}

	.home-link a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-muted);
		text-decoration: none;
		font-size: var(--font-sm);
	}

	.home-link a:hover {
		color: var(--accent);
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 600px) {
		h1 {
			font-size: 80px;
		}

		.links-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
