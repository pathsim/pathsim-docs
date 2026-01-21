import type { PageLoad } from './$types';
import { loadManifest, type NotebookMeta } from '$lib/notebook/manifest';
import { parseNotebook, type NotebookData } from '$lib/notebook/parser';
import { error } from '@sveltejs/kit';

const PACKAGE_ID = 'pathsim';

export const load: PageLoad = async ({ params, fetch }) => {
	const { slug } = params;

	// Load manifest to find notebook metadata
	const manifest = await loadManifest(PACKAGE_ID);
	const notebookMeta = manifest.notebooks.find((n) => n.slug === slug);

	if (!notebookMeta) {
		throw error(404, {
			message: `Notebook "${slug}" not found`
		});
	}

	// Load the actual notebook file
	const response = await fetch(`/notebooks/${PACKAGE_ID}/${notebookMeta.file}`);
	if (!response.ok) {
		throw error(404, {
			message: `Failed to load notebook file: ${notebookMeta.file}`
		});
	}

	const notebookJson = await response.text();
	const notebook = parseNotebook(notebookJson);

	return {
		notebook,
		meta: notebookMeta,
		packageId: PACKAGE_ID
	};
};
