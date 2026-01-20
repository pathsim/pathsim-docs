<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import { packages } from '$lib/config/links';

	const pkg = packages.chem;
</script>

<svelte:head>
	<title>PathSim-Chem Documentation</title>
	<meta name="description" content="PathSim-Chem - Chemical engineering blocks for PathSim" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt="PathSim-Chem" class="hero-logo" />
	<p class="description">
		Chemical engineering blocks for PathSim, including reactors, heat exchangers, and separation units.
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
		<div class="panel-header">Reactor Models</div>
		<div class="panel-body tile-body">CSTR, PFR, batch reactors</div>
	</div>
	<div class="tile">
		<div class="panel-header">Heat Transfer</div>
		<div class="panel-body tile-body">Heat exchangers, heaters, coolers</div>
	</div>
	<div class="tile">
		<div class="panel-header">Separation</div>
		<div class="panel-body tile-body">Distillation, absorption columns</div>
	</div>
	<div class="tile">
		<div class="panel-header">Thermodynamics</div>
		<div class="panel-body tile-body">Property calculations</div>
	</div>
</div>
