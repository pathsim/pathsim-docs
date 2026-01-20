<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages } from '$lib/config/links';

	const pkg = packages.vehicle;
</script>

<svelte:head>
	<title>PathSim-Vehicle Documentation</title>
	<meta name="description" content="PathSim-Vehicle - Vehicle dynamics blocks for PathSim" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt="PathSim-Vehicle" class="hero-logo" />
	<p class="description">
		Vehicle dynamics blocks for PathSim, including tire models, suspension systems, and powertrain components.
	</p>
	<div class="hero-actions">
		<a href={pkg.gettingStarted} class="action-card">
			<Icon name="zap" size={20} />
			<span class="action-label">Get Started</span>
		</a>
		<a href={pkg.api} class="action-card">
			<Icon name="braces" size={20} />
			<span class="action-label">API</span>
		</a>
		<a href={pkg.examples} class="action-card">
			<Icon name="play" size={20} />
			<span class="action-label">Examples</span>
		</a>
		<a href={pkg.github} class="action-card">
			<Icon name="github" size={20} />
			<span class="action-label">GitHub</span>
		</a>
		<a href={pkg.pypi} class="action-card">
			<Icon name="package" size={20} />
			<span class="action-label">PyPI</span>
		</a>
	</div>
</div>

<h2 id="key-features">Key Features</h2>

<div class="tile-grid cols-2">
	<div class="tile">
		<div class="panel-header">Tire Models</div>
		<div class="panel-body tile-body">Pacejka magic formula, linear tire</div>
	</div>
	<div class="tile">
		<div class="panel-header">Suspension</div>
		<div class="panel-body tile-body">Spring-damper systems</div>
	</div>
	<div class="tile">
		<div class="panel-header">Powertrain</div>
		<div class="panel-body tile-body">Engine, transmission models</div>
	</div>
	<div class="tile">
		<div class="panel-header">Vehicle Body</div>
		<div class="panel-body tile-body">Multi-body dynamics</div>
	</div>
</div>
