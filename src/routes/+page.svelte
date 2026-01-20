<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
	import { packages, nav, footer } from '$lib/config/packages';
</script>

<svelte:head>
	<title>PathSim Documentation</title>
	<meta name="description" content="Documentation for PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<Tooltip />

<main>
	<header class="hero">
		<img src="/pathsim_logo.png" alt="PathSim" class="hero-logo" />
		<p class="tagline">Documentation for the PathSim ecosystem</p>
		<p class="description">
			API reference, tutorials, and examples for PathSim and its domain-specific toolboxes.
		</p>
		<div class="hero-actions">
			<a href={nav.home} class="action-card">
				<Icon name="home" size={20} />
				<span class="action-label">Home</span>
			</a>
			<a href={packages.pathsim.docs} class="action-card">
				<Icon name="zap" size={20} />
				<span class="action-label">Get Started</span>
			</a>
			<a href={nav.tryOnline} class="action-card">
				<Icon name="play" size={20} />
				<span class="action-label">Try Online</span>
			</a>
			<a href={nav.github} class="action-card">
				<Icon name="github" size={20} />
				<span class="action-label">GitHub</span>
			</a>
			<a href={nav.sponsor} class="action-card">
				<Icon name="heart" size={20} />
				<span class="action-label">Sponsor</span>
			</a>
		</div>
	</header>

	<div class="separator"></div>

	<section class="packages">
		<h2>Packages</h2>
		<div class="package-grid">
			<div class="package-card">
				<div class="panel-header">
					<span>{packages.pathsim.shortName}</span>
					<div class="header-actions">
						<a href={packages.pathsim.api} class="icon-btn" use:tooltip={'API'}>
							<Icon name="braces" size={14} />
						</a>
						<a href={packages.pathsim.docs} class="icon-btn" use:tooltip={'Docs'}>
							<Icon name="book" size={14} />
						</a>
						<a href={packages.pathsim.pypi} class="icon-btn" use:tooltip={'PyPI'}>
							<Icon name="package" size={14} />
						</a>
						<a href={packages.pathsim.examples} class="icon-btn" use:tooltip={'Examples'}>
							<Icon name="play" size={14} />
						</a>
						<a href={packages.pathsim.github} class="icon-btn" use:tooltip={'GitHub'}>
							<Icon name="github" size={14} />
						</a>
					</div>
				</div>
				<a href={packages.pathsim.docs} class="package-body">
					<img src={packages.pathsim.logo} alt={packages.pathsim.name} />
				</a>
			</div>
			<div class="package-card">
				<div class="panel-header">
					<span>{packages.chem.shortName}</span>
					<div class="header-actions">
						<a href={packages.chem.api} class="icon-btn" use:tooltip={'API'}>
							<Icon name="braces" size={14} />
						</a>
						<a href={packages.chem.docs} class="icon-btn" use:tooltip={'Docs'}>
							<Icon name="book" size={14} />
						</a>
						<a href={packages.chem.pypi} class="icon-btn" use:tooltip={'PyPI'}>
							<Icon name="package" size={14} />
						</a>
						<a href={packages.chem.examples} class="icon-btn" use:tooltip={'Examples'}>
							<Icon name="play" size={14} />
						</a>
						<a href={packages.chem.github} class="icon-btn" use:tooltip={'GitHub'}>
							<Icon name="github" size={14} />
						</a>
					</div>
				</div>
				<a href={packages.chem.docs} class="package-body">
					<img src={packages.chem.logo} alt={packages.chem.name} />
				</a>
			</div>
			<div class="package-card">
				<div class="panel-header">
					<span>{packages.vehicle.shortName}</span>
					<div class="header-actions">
						<a href={packages.vehicle.api} class="icon-btn" use:tooltip={'API'}>
							<Icon name="braces" size={14} />
						</a>
						<a href={packages.vehicle.docs} class="icon-btn" use:tooltip={'Docs'}>
							<Icon name="book" size={14} />
						</a>
						<a href={packages.vehicle.pypi} class="icon-btn" use:tooltip={'PyPI'}>
							<Icon name="package" size={14} />
						</a>
						<a href={packages.vehicle.examples} class="icon-btn" use:tooltip={'Examples'}>
							<Icon name="play" size={14} />
						</a>
						<a href={packages.vehicle.github} class="icon-btn" use:tooltip={'GitHub'}>
							<Icon name="github" size={14} />
						</a>
					</div>
				</div>
				<a href={packages.vehicle.docs} class="package-body">
					<img src={packages.vehicle.logo} alt={packages.vehicle.name} />
				</a>
			</div>
		</div>
	</section>

</main>

<!-- Footer -->
<footer>
	<div class="footer-content">
		<a href={footer.home} class="footer-link">
			<Icon name="home" size={14} />
			<span>Home</span>
		</a>
		<a href={footer.github} class="footer-link">
			<Icon name="github" size={14} />
			<span>GitHub</span>
		</a>
		<a href={footer.pypi} class="footer-link">
			<Icon name="package" size={14} />
			<span>PyPI</span>
		</a>
		<span class="footer-text">MIT License</span>
	</div>
</footer>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 var(--space-lg);
	}

	.hero {
		text-align: center;
		padding: var(--space-2xl) 0;
	}

	.hero-logo {
		height: 140px;
		width: auto;
		margin-bottom: var(--space-lg);
	}

	.tagline {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.description {
		font-size: var(--font-base);
		color: var(--text);
		margin-bottom: var(--space-lg);
	}

	.hero-actions {
		display: flex;
		justify-content: center;
		gap: var(--space-xs);
	}

	section {
		padding: var(--space-xl) 0;
	}

	.separator {
		height: 1px;
		background: var(--border);
		margin: 0 calc(-1 * var(--space-lg));
	}

	h2 {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-lg);
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-lg);
	}

	@media (max-width: 900px) {
		.package-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 600px) {
		.package-grid {
			grid-template-columns: 1fr;
		}
	}

	.package-card {
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		overflow: hidden;
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.package-card:hover {
		border-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
	}

	.header-actions {
		display: flex;
		gap: var(--space-xs);
	}

	.package-body {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: var(--surface);
		text-decoration: none;
	}

	.package-body img {
		height: 100px;
		width: auto;
		object-fit: contain;
	}

	/* Footer */
	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--surface-raised);
		border-top: 1px solid var(--border);
		z-index: 100;
	}

	/* Add padding to main to account for fixed footer */
	main {
		padding-bottom: 48px;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-sm) var(--space-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
	}

	.footer-link {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 500;
		text-decoration: none;
	}

	.footer-link:hover {
		color: var(--text);
		text-decoration: none;
	}

	.footer-text {
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 500;
	}
</style>
