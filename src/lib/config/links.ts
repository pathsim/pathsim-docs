// Centralized link configuration for PathSim Docs

export const external = {
	home: 'https://pathsim.org',
	view: 'https://view.pathsim.org',
	github: 'https://github.com/pathsim',
	pypi: 'https://pypi.org/project',
	sponsor: 'https://github.com/sponsors/milanofthe'
};

export type PackageId = 'pathsim' | 'chem' | 'vehicle';

export interface PackageConfig {
	id: PackageId;
	name: string;
	shortName: string;
	logo: string;
	docs: string;
	api: string;
	examples: string;
	gettingStarted: string;
	pypi: string;
	github: string;
}

export const packages: Record<PackageId, PackageConfig> = {
	pathsim: {
		id: 'pathsim',
		name: 'PathSim',
		shortName: 'pathsim',
		logo: '/pathsim_logo.png',
		docs: '/pathsim',
		api: '/pathsim/api',
		examples: '/pathsim/examples',
		gettingStarted: '/pathsim/getting-started',
		pypi: `${external.pypi}/pathsim`,
		github: `${external.github}/pathsim`
	},
	chem: {
		id: 'chem',
		name: 'PathSim-Chem',
		shortName: 'chem',
		logo: '/pathsim_chem_logo.png',
		docs: '/chem',
		api: '/chem/api',
		examples: '/chem/examples',
		gettingStarted: '/chem/getting-started',
		pypi: `${external.pypi}/pathsim-chem`,
		github: `${external.github}/pathsim-chem`
	},
	vehicle: {
		id: 'vehicle',
		name: 'PathSim-Vehicle',
		shortName: 'vehicle',
		logo: '/pathsim_vehicle_logo.png',
		docs: '/vehicle',
		api: '/vehicle/api',
		examples: '/vehicle/examples',
		gettingStarted: '/vehicle/getting-started',
		pypi: `${external.pypi}/pathsim-vehicle`,
		github: `${external.github}/pathsim-vehicle`
	}
};

// Ordered list for tabs/navigation
export const packageOrder: PackageId[] = ['pathsim', 'chem', 'vehicle'];

// Sidebar navigation structure per package
export interface SidebarItem {
	title: string;
	path: string;
	icon?: string;
	children?: SidebarItem[];
}

export interface SidebarSection {
	title: string;
	items: SidebarItem[];
	expanded?: boolean;
}

export const sidebars: Record<PackageId, SidebarSection[]> = {
	pathsim: [
		{
			title: 'Getting Started',
			expanded: true,
			items: [
				{ title: 'Overview', path: '/pathsim', icon: 'home' },
				{ title: 'Installation', path: '/pathsim/getting-started', icon: 'download' },
				{ title: 'Quick Start', path: '/pathsim/quickstart', icon: 'zap' }
			]
		},
		{
			title: 'API Reference',
			expanded: true,
			items: [
				{ title: 'API Index', path: '/pathsim/api', icon: 'braces' }
				// Children will be dynamically populated from API JSON
			]
		},
		{
			title: 'Examples',
			expanded: true,
			items: [
				{ title: 'All Examples', path: '/pathsim/examples', icon: 'play' }
				// Children will be dynamically populated from notebook manifest
			]
		}
	],
	chem: [
		{
			title: 'Getting Started',
			expanded: true,
			items: [
				{ title: 'Overview', path: '/chem', icon: 'home' },
				{ title: 'Installation', path: '/chem/getting-started', icon: 'download' }
			]
		},
		{
			title: 'API Reference',
			expanded: true,
			items: [{ title: 'API Index', path: '/chem/api', icon: 'braces' }]
		},
		{
			title: 'Examples',
			expanded: true,
			items: [{ title: 'All Examples', path: '/chem/examples', icon: 'play' }]
		}
	],
	vehicle: [
		{
			title: 'Getting Started',
			expanded: true,
			items: [
				{ title: 'Overview', path: '/vehicle', icon: 'home' },
				{ title: 'Installation', path: '/vehicle/getting-started', icon: 'download' }
			]
		},
		{
			title: 'API Reference',
			expanded: true,
			items: [{ title: 'API Index', path: '/vehicle/api', icon: 'braces' }]
		},
		{
			title: 'Examples',
			expanded: true,
			items: [{ title: 'All Examples', path: '/vehicle/examples', icon: 'play' }]
		}
	]
};

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
