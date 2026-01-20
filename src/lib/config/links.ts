// Centralized link configuration for PathSim Docs

export const external = {
	home: 'https://pathsim.org',
	view: 'https://view.pathsim.org',
	github: 'https://github.com/pathsim',
	pypi: 'https://pypi.org/project',
	sponsor: 'https://github.com/sponsors/milanofthe'
};

export const packages = {
	pathsim: {
		name: 'PathSim',
		logo: '/pathsim_logo.png',
		docs: '/pathsim',
		api: '/pathsim/api',
		examples: '/pathsim/examples',
		quickstart: '/pathsim/quickstart',
		pypi: `${external.pypi}/pathsim`,
		github: `${external.github}/pathsim`
	},
	chem: {
		name: 'PathSim-Chem',
		logo: '/pathsim_chem_logo.png',
		docs: '/chem',
		api: '/chem/api',
		examples: '/chem/examples',
		pypi: `${external.pypi}/pathsim-chem`,
		github: `${external.github}/pathsim-chem`
	},
	vehicle: {
		name: 'PathSim-Vehicle',
		logo: '/pathsim_vehicle_logo.png',
		docs: '/vehicle',
		api: '/vehicle/api',
		examples: '/vehicle/examples',
		pypi: `${external.pypi}/pathsim-vehicle`,
		github: `${external.github}/pathsim-vehicle`
	}
};

export const nav = {
	home: external.home,
	quickstart: packages.pathsim.quickstart,
	tryOnline: external.view,
	github: `${external.github}/pathsim`,
	sponsor: external.sponsor
};

export const footer = {
	home: external.home,
	github: `${external.github}/pathsim`,
	pypi: `${external.pypi}/pathsim`
};
