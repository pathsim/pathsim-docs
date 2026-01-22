import type { PageLoad } from './$types';
import { parseNotebook } from '$lib/notebook/parser';
import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import {
	getVersionManifest,
	getNotebookWithOutputs,
	findNotebookBySlug
} from '$lib/notebook/loader';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { slug } = params;
	const { packageId, resolvedTag } = await parent();

	// Load version manifest to find notebook metadata
	const versionManifest = await getVersionManifest(packageId, resolvedTag, fetch);
	const notebookMeta = findNotebookBySlug(versionManifest, slug);

	if (!notebookMeta) {
		// Notebook not found - redirect up to examples list (which may redirect further)
		throw redirect(307, `${base}/${packageId}/${resolvedTag}/examples`);
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
		tag: resolvedTag,
		versionManifest
	};
};
