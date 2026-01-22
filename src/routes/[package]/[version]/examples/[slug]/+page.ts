import type { PageLoad } from './$types';
import { parseNotebook } from '$lib/notebook/parser';
import { error } from '@sveltejs/kit';
import {
	getVersionManifest,
	getNotebookWithOutputs,
	findNotebookBySlug
} from '$lib/notebook/loader';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { slug } = params;
	const { packageId, resolvedTag } = await parent();

	try {
		// Load version manifest to find notebook metadata
		const versionManifest = await getVersionManifest(packageId, resolvedTag, fetch);
		const notebookMeta = findNotebookBySlug(versionManifest, slug);

		if (!notebookMeta) {
			throw error(404, { message: `Notebook "${slug}" not found` });
		}

		// Load notebook source and outputs
		const { notebook: rawNotebook, outputs } = await getNotebookWithOutputs(
			packageId,
			resolvedTag,
			notebookMeta.file,
			fetch
		);

		// Parse the notebook
		const notebook = parseNotebook(JSON.stringify(rawNotebook));

		return {
			notebook,
			outputs,
			meta: notebookMeta,
			packageId,
			tag: resolvedTag
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		const message = e instanceof Error ? e.message : 'Failed to load notebook';
		throw error(500, { message });
	}
};
