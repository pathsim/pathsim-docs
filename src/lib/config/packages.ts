// Centralized package configuration for PathSim Docs
// All package-specific content is defined here for dynamic page generation

export const external = {
	home: 'https://pathsim.org',
	view: 'https://view.pathsim.org',
	github: 'https://github.com/pathsim',
	pypi: 'https://pypi.org/project',
	sponsor: 'https://github.com/sponsors/milanofthe'
};

export type PackageId = 'pathsim' | 'chem' | 'vehicle';

export interface Feature {
	title: string;
	description: string;
}

export interface InstallOption {
	name: string;
	command: string;
}

export interface QuickStart {
	description: string;
	code: string;
	title?: string;
}

export interface ApiModule {
	name: string;
	description: string;
}

// Note: Examples are now loaded dynamically from manifest.json
// See src/lib/notebook/manifest.ts

export interface PackageConfig {
	id: PackageId;
	name: string;
	shortName: string;
	description: string;
	logo: string;

	// Links
	docs: string;
	api: string;
	examples: string | null;  // null if no examples
	pypi: string | null;  // null if not yet on PyPI
	github: string;

	// Content
	features: Feature[];
	installation: InstallOption[];  // empty if not installable yet
	quickstart: QuickStart | null;  // null if no quickstart

	// API page content
	apiModules: ApiModule[];
}

export const packages: Record<PackageId, PackageConfig> = {
	pathsim: {
		id: 'pathsim',
		name: 'PathSim',
		shortName: 'pathsim',
		description: 'A Python library for building and simulating continuous-time, discrete-time, and hybrid dynamical systems using a block-diagram approach.',
		logo: 'pathsim_logo.png',
		docs: 'pathsim',
		api: 'pathsim/api',
		examples: 'pathsim/examples',
		pypi: `${external.pypi}/pathsim`,
		github: `${external.github}/pathsim`,
		features: [
			{ title: 'Block-based', description: 'Build systems by connecting reusable blocks' },
			{ title: '18+ Solvers', description: 'Explicit, implicit, and adaptive integrators' },
			{ title: 'Event Handling', description: 'Zero-crossing detection and scheduled events' },
			{ title: 'Hierarchical', description: 'Nest subsystems for modular designs' },
			{ title: 'Hot-swappable', description: 'Change blocks and solvers during simulation' },
			{ title: 'MIMO Support', description: 'Multiple input/output ports on all blocks' }
		],
		installation: [
			{ name: 'pip', command: 'pip install pathsim' },
			{ name: 'conda', command: 'conda install -c conda-forge pathsim' }
		],
		quickstart: {
			description: 'PathSim uses a block-diagram approach. Create blocks, connect them, and simulate.',
			code: `from pathsim import Simulation, Connection
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

# Build and run simulation
sim = Simulation([integ, amp, scope], connections)
sim.run(10.0)

# Plot results
scope.plot()`,
			title: 'Example'
		},
		apiModules: [
			{ name: 'pathsim', description: 'Main module with Simulation and Connection classes' },
			{ name: 'pathsim.blocks', description: 'Block library (Integrator, Amplifier, Scope, etc.)' },
			{ name: 'pathsim.solvers', description: 'Numerical integrators' },
			{ name: 'pathsim.events', description: 'Event handling' }
		]
	},
	chem: {
		id: 'chem',
		name: 'PathSim-Chem',
		shortName: 'chem',
		description: 'Chemical engineering blocks for PathSim, including reactors, heat exchangers, and separation units.',
		logo: 'pathsim_chem_logo.png',
		docs: 'chem',
		api: 'chem/api',
		examples: null,
		pypi: `${external.pypi}/pathsim-chem`,
		github: `${external.github}/pathsim-chem`,
		features: [],
		installation: [
			{ name: 'pip', command: 'pip install pathsim-chem' }
		],
		quickstart: null,
		apiModules: [
			{ name: 'pathsim_chem.reactors', description: 'CSTR, PFR, batch reactor blocks' },
			{ name: 'pathsim_chem.heat', description: 'Heat exchangers, heaters, coolers' },
			{ name: 'pathsim_chem.separation', description: 'Distillation, absorption columns' },
			{ name: 'pathsim_chem.thermo', description: 'Thermodynamic property calculations' }
		]
	},
	vehicle: {
		id: 'vehicle',
		name: 'PathSim-Vehicle',
		shortName: 'vehicle',
		description: 'Vehicle dynamics blocks for PathSim, including tire models, suspension systems, and powertrain components.',
		logo: 'pathsim_vehicle_logo.png',
		docs: 'vehicle',
		api: 'vehicle/api',
		examples: null,
		pypi: null,
		github: `${external.github}/pathsim-vehicle`,
		features: [],
		installation: [],
		quickstart: null,
		apiModules: [
			{ name: 'pathsim_vehicle.tires', description: 'Pacejka magic formula, linear tire models' },
			{ name: 'pathsim_vehicle.suspension', description: 'Spring-damper systems' },
			{ name: 'pathsim_vehicle.powertrain', description: 'Engine, transmission models' },
			{ name: 'pathsim_vehicle.body', description: 'Multi-body vehicle dynamics' }
		]
	}
};

// Ordered list for tabs/navigation
export const packageOrder: PackageId[] = ['pathsim', 'chem', 'vehicle'];

// Sidebar navigation (auto-generated from package config)
export interface SidebarItem {
	title: string;
	path: string;
	icon?: string;
}

export function getSidebarItems(packageId: PackageId): SidebarItem[] {
	const pkg = packages[packageId];
	const items: SidebarItem[] = [
		{ title: 'Overview', path: pkg.docs, icon: 'home' },
		{ title: 'API Reference', path: pkg.api, icon: 'braces' }
	];
	if (pkg.examples) {
		items.push({ title: 'Examples', path: pkg.examples, icon: 'play' });
	}
	return items;
}

// Navigation links
export const nav = {
	home: external.home,
	tryOnline: external.view,
	github: `${external.github}/pathsim`,
	sponsor: external.sponsor
};

export const footer = {
	home: external.home,
	github: `${external.github}/pathsim`,
	pypi: `${external.pypi}/pathsim`
};
