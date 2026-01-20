<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import Tooltip, { tooltip } from '$lib/components/common/Tooltip.svelte';
	import CodeBlock from '$lib/components/common/CodeBlock.svelte';
	import { packages } from '$lib/config/links';

	const pkg = packages.pathsim;

	const exampleCode = `from pathsim import Simulation, Connection
from pathsim.blocks import Integrator, Amplifier, Scope

# Create blocks
integ = Integrator(1.0)   # Initial value = 1.0
amp = Amplifier(-0.5)     # Gain = -0.5
scope = Scope()

# Create connections (feedback loop: dx/dt = -0.5*x)
connections = [
    Connection(integ, amp, scope),
    Connection(amp, integ)
]

# Build and run simulation
sim = Simulation([integ, amp, scope], connections)
sim.run(10.0)

# Plot results
scope.plot()`;
</script>

<svelte:head>
	<title>PathSim Documentation</title>
	<meta name="description" content="PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<Tooltip />

<div class="hero">
	<img src={pkg.logo} alt="PathSim" class="hero-logo" />
	<p class="description">
		A Python library for building and simulating continuous-time, discrete-time, and hybrid
		dynamical systems using a block-diagram approach.
	</p>
</div>

<h2 id="key-features">Key Features</h2>

<div class="tile-grid cols-3">
	<div class="tile">
		<div class="panel-header">Block-based</div>
		<div class="panel-body tile-body">Build systems by connecting reusable blocks</div>
	</div>
	<div class="tile">
		<div class="panel-header">18+ Solvers</div>
		<div class="panel-body tile-body">Explicit, implicit, and adaptive integrators</div>
	</div>
	<div class="tile">
		<div class="panel-header">Event Handling</div>
		<div class="panel-body tile-body">Zero-crossing detection and scheduled events</div>
	</div>
	<div class="tile">
		<div class="panel-header">Hierarchical</div>
		<div class="panel-body tile-body">Nest subsystems for modular designs</div>
	</div>
	<div class="tile">
		<div class="panel-header">Hot-swappable</div>
		<div class="panel-body tile-body">Change blocks and solvers during simulation</div>
	</div>
	<div class="tile">
		<div class="panel-header">MIMO Support</div>
		<div class="panel-body tile-body">Multiple input/output ports on all blocks</div>
	</div>
</div>

<h2 id="quick-example">Quick Example</h2>

<CodeBlock code={exampleCode} title="Example" />

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
