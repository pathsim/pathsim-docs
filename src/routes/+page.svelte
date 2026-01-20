<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
</script>

<svelte:head>
	<title>PathSim Documentation</title>
	<meta name="description" content="Documentation for PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<main class="docs-home">
	<header class="hero">
		<img src="/pathsim_logo.png" alt="PathSim" class="hero-logo" />
		<p class="tagline">Documentation for the PathSim ecosystem</p>
	</header>

	<section class="packages">
		<h2>Packages</h2>
		<div class="package-grid">
			<a href="/pathsim" class="package-card">
				<img src="/pathsim_logo.png" alt="PathSim" class="package-logo" />
				<p>Core simulation framework with blocks, solvers, and event handling</p>
			</a>

			<a href="/chem" class="package-card">
				<img src="/pathsim_chem_logo.png" alt="PathSim-Chem" class="package-logo" />
				<p>Chemical engineering toolbox with reactors and separation units</p>
			</a>

			<a href="/vehicle" class="package-card">
				<img src="/pathsim_vehicle_logo.png" alt="PathSim-Vehicle" class="package-logo" />
				<p>Vehicle dynamics and powertrain simulation blocks</p>
			</a>
		</div>
	</section>

	<section class="quick-links">
		<h2>Quick Links</h2>
		<div class="link-grid">
			<a href="/pathsim/getting-started" class="link-card">
				<Icon name="zap" size={20} />
				<span>Getting Started</span>
			</a>
			<a href="/pathsim/api" class="link-card">
				<Icon name="book" size={20} />
				<span>API Reference</span>
			</a>
			<a href="/pathsim/examples" class="link-card">
				<Icon name="code" size={20} />
				<span>Examples</span>
			</a>
			<a href="https://github.com/milanofthe/pathsim" class="link-card" target="_blank" rel="noopener">
				<Icon name="github" size={20} />
				<span>GitHub</span>
			</a>
		</div>
	</section>
</main>

<style>
	.docs-home {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-xl) var(--space-lg);
	}

	.hero {
		text-align: center;
		padding: var(--space-3xl) 0;
	}

	.hero-logo {
		height: 200px;
		width: auto;
		margin-bottom: var(--space-lg);
	}

	.tagline {
		font-size: var(--font-xl);
		color: var(--text-muted);
		max-width: 600px;
		margin: 0 auto;
	}

	section {
		margin-bottom: var(--space-3xl);
	}

	h2 {
		font-size: var(--font-2xl);
		margin-bottom: var(--space-xl);
	}

	.package-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-lg);
	}

	.package-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-xl);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: all var(--transition-normal);
	}

	.package-card:hover {
		border-color: var(--accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		text-decoration: none;
	}

	.package-logo {
		height: 120px;
		width: auto;
		margin-bottom: var(--space-lg);
	}

	.package-card p {
		color: var(--text-muted);
		font-size: var(--font-base);
		margin: 0;
	}

	.link-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-md);
	}

	.link-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--text);
		transition: all var(--transition-fast);
	}

	.link-card:hover {
		border-color: var(--border-focus);
		background: var(--surface-hover);
		text-decoration: none;
	}
</style>
