<script lang="ts">
	import Icon from '$lib/components/common/Icon.svelte';
	import { packages } from '$lib/config/links';

	const pkg = packages.pathsim;
</script>

<svelte:head>
	<title>PathSim Documentation</title>
	<meta name="description" content="PathSim - A Python framework for simulating dynamical systems" />
</svelte:head>

<h1 id="overview">PathSim</h1>

<p class="lead">
	A Python framework for simulating dynamical systems using block diagrams.
</p>

<h2 id="what-is-pathsim">What is PathSim?</h2>

<p>
	PathSim is a Python library for building and simulating continuous-time, discrete-time, and hybrid
	dynamical systems. It uses a block-diagram approach where systems are built by connecting modular
	blocks that represent mathematical operations, integrators, sources, and sinks.
</p>

<h2 id="key-features">Key Features</h2>

<ul>
	<li><strong>Block-based modeling</strong> - Build systems by connecting reusable blocks</li>
	<li><strong>18+ numerical solvers</strong> - Explicit, implicit, and adaptive integrators</li>
	<li><strong>Event handling</strong> - Zero-crossing detection and scheduled events</li>
	<li><strong>Hierarchical systems</strong> - Nest subsystems for modular designs</li>
	<li><strong>Hot-swappable</strong> - Change blocks and solvers during simulation</li>
	<li><strong>MIMO support</strong> - Multiple input/output ports on all blocks</li>
</ul>

<h2 id="quick-example">Quick Example</h2>

<pre><code class="language-python">from pathsim import Simulation, Connection
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
scope.plot()</code></pre>

<h2 id="next-steps">Next Steps</h2>

<ul>
	<li><a href={pkg.gettingStarted}>Installation guide</a></li>
	<li><a href={pkg.api}>API Reference</a></li>
	<li><a href={pkg.examples}>Examples</a></li>
</ul>

