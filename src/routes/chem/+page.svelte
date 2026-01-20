<script lang="ts">
	import { packages } from '$lib/config/links';

	const pkg = packages.chem;
</script>

<svelte:head>
	<title>PathSim-Chem Documentation</title>
	<meta name="description" content="PathSim-Chem - Chemical engineering blocks for PathSim" />
</svelte:head>

<h1 id="overview">PathSim-Chem</h1>

<p class="lead">
	Chemical engineering blocks for PathSim.
</p>

<h2 id="what-is-chem">What is PathSim-Chem?</h2>

<p>
	PathSim-Chem extends PathSim with blocks for chemical engineering simulations,
	including reactors, heat exchangers, and separation units.
</p>

<h2 id="key-features">Key Features</h2>

<ul>
	<li><strong>Reactor models</strong> - CSTR, PFR, batch reactors</li>
	<li><strong>Heat transfer</strong> - Heat exchangers, heaters, coolers</li>
	<li><strong>Separation</strong> - Distillation, absorption columns</li>
	<li><strong>Thermodynamics</strong> - Property calculations</li>
</ul>

<h2 id="next-steps">Next Steps</h2>

<ul>
	<li><a href={pkg.gettingStarted}>Installation guide</a></li>
	<li><a href={pkg.api}>API Reference</a></li>
	<li><a href={pkg.examples}>Examples</a></li>
</ul>

<style>
	.lead {
		font-size: var(--font-lg);
		color: var(--text-muted);
		margin-bottom: var(--space-xl);
	}
</style>
