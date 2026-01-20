<script lang="ts">
	import { packages } from '$lib/config/links';

	const pkg = packages.vehicle;
</script>

<svelte:head>
	<title>PathSim-Vehicle Documentation</title>
	<meta name="description" content="PathSim-Vehicle - Vehicle dynamics blocks for PathSim" />
</svelte:head>

<h1 id="overview">PathSim-Vehicle</h1>

<p class="lead">
	Vehicle dynamics blocks for PathSim.
</p>

<h2 id="what-is-vehicle">What is PathSim-Vehicle?</h2>

<p>
	PathSim-Vehicle extends PathSim with blocks for vehicle dynamics simulations,
	including tire models, suspension systems, and powertrain components.
</p>

<h2 id="key-features">Key Features</h2>

<ul>
	<li><strong>Tire models</strong> - Pacejka magic formula, linear tire</li>
	<li><strong>Suspension</strong> - Spring-damper systems</li>
	<li><strong>Powertrain</strong> - Engine, transmission models</li>
	<li><strong>Vehicle body</strong> - Multi-body dynamics</li>
</ul>

<h2 id="next-steps">Next Steps</h2>

<ul>
	<li><a href={pkg.gettingStarted}>Installation guide</a></li>
	<li><a href={pkg.api}>API Reference</a></li>
	<li><a href={pkg.examples}>Examples</a></li>
</ul>

