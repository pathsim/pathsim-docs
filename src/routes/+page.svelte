<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
</script>

<svelte:head>
	<title>PathSim Documentation</title>
	<meta name="description" content="Documentation for PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<main id="main-content" class="docs-home">
	<header class="hero">
		<h1>PathSim Documentation</h1>
		<p class="tagline">A Python framework for simulating dynamical systems using block diagrams</p>
	</header>

	<section class="packages">
		<h2>Packages</h2>
		<div class="package-grid">
			<a href="/pathsim" class="package-card">
				<div class="package-icon">
					<Icon name="box" size={32} />
				</div>
				<h3>PathSim</h3>
				<p>Core simulation framework with blocks, solvers, and event handling</p>
			</a>

			<a href="/chem" class="package-card">
				<div class="package-icon chem">
					<Icon name="flask" size={32} />
				</div>
				<h3>PathSim-Chem</h3>
				<p>Chemical engineering toolbox with reactors and separation units</p>
			</a>

			<a href="/vehicle" class="package-card">
				<div class="package-icon vehicle">
					<Icon name="car" size={32} />
				</div>
				<h3>PathSim-Vehicle</h3>
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

	.hero h1 {
		font-size: 48px;
		margin-bottom: var(--space-md);
		background: linear-gradient(135deg, var(--text) 0%, var(--accent) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
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

	.package-icon {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent-bg);
		color: var(--accent);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
	}

	.package-icon.chem {
		background: rgba(129, 199, 132, 0.15);
		color: #81C784;
	}

	.package-icon.vehicle {
		background: rgba(255, 183, 77, 0.15);
		color: #FFB74D;
	}

	.package-card h3 {
		font-size: var(--font-xl);
		margin-bottom: var(--space-sm);
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
