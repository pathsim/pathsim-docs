<script lang="ts">
	import { packages } from '$lib/config/links';

	const pkg = packages.pathsim;
</script>

<svelte:head>
	<title>Installation - PathSim</title>
	<meta name="description" content="How to install PathSim" />
</svelte:head>

<h1 id="installation">Installation</h1>

<p>PathSim can be installed via pip or conda.</p>

<h2 id="pip">Using pip</h2>

<pre><code>pip install pathsim</code></pre>

<h2 id="conda">Using conda</h2>

<pre><code>conda install -c conda-forge pathsim</code></pre>

<h2 id="requirements">Requirements</h2>

<ul>
	<li>Python 3.9+</li>
	<li>NumPy</li>
	<li>SciPy</li>
	<li>Matplotlib (optional, for plotting)</li>
</ul>

<h2 id="verify">Verify Installation</h2>

<pre><code class="language-python">import pathsim
print(pathsim.__version__)</code></pre>

<h2 id="next-steps">Next Steps</h2>

<ul>
	<li><a href="/pathsim/quickstart">Quick Start Guide</a></li>
	<li><a href={pkg.api}>API Reference</a></li>
	<li><a href={pkg.examples}>Examples</a></li>
</ul>
