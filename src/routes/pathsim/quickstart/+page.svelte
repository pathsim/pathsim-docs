<svelte:head>
	<title>Quick Start - PathSim</title>
	<meta name="description" content="Quick start guide for PathSim" />
</svelte:head>

<h1 id="quickstart">Quick Start</h1>

<p>This guide will help you get started with PathSim in just a few minutes.</p>

<h2 id="basic-concepts">Basic Concepts</h2>

<p>
	PathSim uses a block-diagram approach to model dynamical systems. The key concepts are:
</p>

<ul>
	<li><strong>Blocks</strong> - Components that perform operations (integrators, gains, sources, etc.)</li>
	<li><strong>Connections</strong> - Links between block outputs and inputs</li>
	<li><strong>Simulation</strong> - The engine that solves the system over time</li>
</ul>

<h2 id="first-simulation">Your First Simulation</h2>

<p>Let's simulate a simple exponential decay: dx/dt = -0.5*x with x(0) = 1</p>

<pre><code class="language-python">from pathsim import Simulation, Connection
from pathsim.blocks import Integrator, Amplifier, Scope

# Create blocks
integ = Integrator(1.0)   # Initial value x(0) = 1.0
amp = Amplifier(-0.5)     # Gain = -0.5
scope = Scope()           # Records the output

# Create connections
connections = [
    Connection(integ, amp, scope),  # integ -> amp, integ -> scope
    Connection(amp, integ)          # amp -> integ (feedback)
]

# Build simulation
sim = Simulation([integ, amp, scope], connections)

# Run for 10 seconds
sim.run(10.0)

# Plot results
scope.plot()</code></pre>

<h2 id="choosing-solver">Choosing a Solver</h2>

<p>PathSim includes many numerical solvers. The default is RK4, but you can specify others:</p>

<pre><code class="language-python">from pathsim.solvers import RKDP54, SSPRK22

# Adaptive solver
sim = Simulation(blocks, connections, solver=RKDP54())

# Fixed-step solver with custom timestep
sim = Simulation(blocks, connections, solver=SSPRK22(), dt=0.01)</code></pre>

<h2 id="next-steps">Next Steps</h2>

<ul>
	<li><a href="/pathsim/api">API Reference</a> - Detailed documentation</li>
	<li><a href="/pathsim/examples">Examples</a> - More complex simulations</li>
</ul>
