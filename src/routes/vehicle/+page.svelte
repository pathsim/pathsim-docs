<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
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
	<div class="hero-content">
		<p class="tagline">Vehicle dynamics blocks for PathSim.</p>
		<p class="description">
			PathSim-Vehicle extends PathSim with blocks for vehicle dynamics simulations,
			including tire models, suspension systems, and powertrain components.
		</p>
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

<h2 id="next-steps">Next Steps</h2>

<div class="tile-grid cols-3">
	<a href={pkg.gettingStarted} class="tile link-tile">
		<div class="panel-header">
			<span>Installation</span>
			<div class="header-actions">
				<span class="icon-btn" use:tooltip={'Get started'}>
					<Icon name="download" size={14} />
				</span>
			</div>
		</div>
		<div class="panel-body">
			<Icon name="zap" size={32} />
		</div>
	</a>
	<a href={pkg.api} class="tile link-tile">
		<div class="panel-header">
			<span>API Reference</span>
			<div class="header-actions">
				<span class="icon-btn" use:tooltip={'Browse API'}>
					<Icon name="braces" size={14} />
				</span>
			</div>
		</div>
		<div class="panel-body">
			<Icon name="book" size={32} />
		</div>
	</a>
	<a href={pkg.examples} class="tile link-tile">
		<div class="panel-header">
			<span>Examples</span>
			<div class="header-actions">
				<span class="icon-btn" use:tooltip={'View examples'}>
					<Icon name="play" size={14} />
				</span>
			</div>
		</div>
		<div class="panel-body">
			<Icon name="play" size={32} />
		</div>
	</a>
</div>
