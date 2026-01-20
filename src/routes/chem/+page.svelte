<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
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
	<p class="tagline">Chemical engineering blocks for PathSim.</p>
	<p class="description">
		PathSim-Chem extends PathSim with blocks for chemical engineering simulations,
		including reactors, heat exchangers, and separation units.
	</p>
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
