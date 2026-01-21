/**
 * Cross-reference system for linking class/function names in docstrings
 */

import { apiData } from '$lib/api/generated';

export interface CrossRefTarget {
	name: string;
	type: 'class' | 'function' | 'method' | 'module';
	packageId: string;
	moduleName: string;
	parentClass?: string;
	path: string;
}

// Cached cross-reference index
let crossRefIndex: Map<string, CrossRefTarget> | null = null;

/**
 * Build the cross-reference index from all API data
 */
function buildCrossRefIndex(): Map<string, CrossRefTarget> {
	const index = new Map<string, CrossRefTarget>();

	for (const [packageId, pkg] of Object.entries(apiData)) {
		const basePath = `/${packageId}/api`;

		for (const [moduleName, module] of Object.entries(pkg.modules)) {
			// Add module
			const moduleShortName = moduleName.split('.').pop() || moduleName;
			index.set(moduleName, {
				name: moduleName,
				type: 'module',
				packageId,
				moduleName,
				path: `${basePath}#${moduleName.replace(/\./g, '-')}`
			});

			// Add classes
			for (const cls of module.classes) {
				// Full path: pathsim.blocks.integrator.Integrator
				const fullPath = `${moduleName}.${cls.name}`;
				const target: CrossRefTarget = {
					name: cls.name,
					type: 'class',
					packageId,
					moduleName,
					path: `${basePath}#${cls.name}`
				};

				// Index by multiple keys for flexible lookup
				index.set(cls.name, target); // Just class name
				index.set(fullPath, target); // Full path
				index.set(`${packageId}.${cls.name}`, target); // package.ClassName

				// Add methods
				for (const method of cls.methods) {
					if (method.name.startsWith('_') && method.name !== '__init__') continue;

					const methodTarget: CrossRefTarget = {
						name: method.name,
						type: 'method',
						packageId,
						moduleName,
						parentClass: cls.name,
						path: `${basePath}#${method.name}`
					};

					// Index by ClassName.method_name
					index.set(`${cls.name}.${method.name}`, methodTarget);
				}
			}

			// Add functions
			for (const func of module.functions) {
				const fullPath = `${moduleName}.${func.name}`;
				const target: CrossRefTarget = {
					name: func.name,
					type: 'function',
					packageId,
					moduleName,
					path: `${basePath}#${func.name}`
				};

				index.set(func.name, target);
				index.set(fullPath, target);
			}
		}
	}

	return index;
}

/**
 * Get the cross-reference index (builds on first access)
 */
export function getCrossRefIndex(): Map<string, CrossRefTarget> {
	if (!crossRefIndex) {
		crossRefIndex = buildCrossRefIndex();
	}
	return crossRefIndex;
}

/**
 * Look up a reference and return the target if found
 */
export function lookupRef(name: string): CrossRefTarget | undefined {
	const index = getCrossRefIndex();
	return index.get(name);
}

/**
 * Process HTML docstring to add cross-reference links
 *
 * Handles:
 * - RST role syntax: :class:`ClassName`, :func:`function_name`, :meth:`method_name`
 * - Plain backtick code: `ClassName`, `function_name`
 * - Title tag references from docutils: <cite>ClassName</cite>
 * - Single-quoted class names in text: 'ClassName'
 */
export function processCrossRefs(html: string, currentPackageId?: string): string {
	const index = getCrossRefIndex();

	// 1. Handle RST role syntax: :class:`Name`, :func:`Name`, :meth:`Name`, :mod:`Name`
	// These often get converted to various forms by docutils
	html = html.replace(
		/<code class="xref[^"]*">([^<]+)<\/code>/g,
		(match, name) => {
			const target = index.get(name.trim());
			if (target) {
				return `<a href="${target.path}" class="crossref crossref-${target.type}">${name}</a>`;
			}
			return match;
		}
	);

	// 2. Handle <cite> elements (docutils converts backticks to cite)
	html = html.replace(
		/<cite>([^<]+)<\/cite>/g,
		(match, name) => {
			const trimmed = name.trim();
			const target = index.get(trimmed);
			if (target) {
				return `<a href="${target.path}" class="crossref crossref-${target.type}">${name}</a>`;
			}
			return match;
		}
	);

	// 3. Handle inline code that matches known classes/functions
	// Be careful not to match code inside pre blocks or already-processed links
	html = html.replace(
		/<code>([A-Z][a-zA-Z0-9_]*)<\/code>/g,
		(match, name) => {
			// Skip if it looks like it's already part of a link
			const target = index.get(name);
			if (target && target.type === 'class') {
				return `<a href="${target.path}" class="crossref crossref-class"><code>${name}</code></a>`;
			}
			return match;
		}
	);

	// 4. Handle title attribute references (docutils)
	html = html.replace(
		/<span class="[^"]*" title="([^"]+)">([^<]+)<\/span>/g,
		(match, title, text) => {
			const target = index.get(title) || index.get(text);
			if (target) {
				return `<a href="${target.path}" class="crossref crossref-${target.type}">${text}</a>`;
			}
			return match;
		}
	);

	// 5. Handle single-quoted class names in plain text: 'ClassName'
	// Only match PascalCase names (likely class names)
	html = html.replace(
		/'([A-Z][a-zA-Z0-9_]*)'/g,
		(match, name) => {
			const target = index.get(name);
			if (target && target.type === 'class') {
				return `<a href="${target.path}" class="crossref crossref-class">'${name}'</a>`;
			}
			return match;
		}
	);

	return html;
}
