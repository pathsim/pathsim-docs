/**
 * Shared CodeMirror utilities for consistent editor setup
 */

import { SYNTAX_COLORS } from './colors';

// Cached CodeMirror modules
let cachedModules: CodeMirrorModules | null = null;

export interface CodeMirrorModules {
	EditorView: typeof import('@codemirror/view').EditorView;
	EditorState: typeof import('@codemirror/state').EditorState;
	keymap: typeof import('@codemirror/view').keymap;
	basicSetup: typeof import('codemirror').basicSetup;
	python: typeof import('@codemirror/lang-python').python;
	oneDark: typeof import('@codemirror/theme-one-dark').oneDark;
	HighlightStyle: typeof import('@codemirror/language').HighlightStyle;
	syntaxHighlighting: typeof import('@codemirror/language').syntaxHighlighting;
	indentUnit: typeof import('@codemirror/language').indentUnit;
	tags: typeof import('@lezer/highlight').tags;
}

/**
 * Dynamically load CodeMirror modules (cached after first load)
 */
export async function loadCodeMirrorModules(): Promise<CodeMirrorModules> {
	if (cachedModules) return cachedModules;

	const [viewModule, stateModule, cmModule, pythonModule, themeModule, langModule, highlightModule] =
		await Promise.all([
			import('@codemirror/view'),
			import('@codemirror/state'),
			import('codemirror'),
			import('@codemirror/lang-python'),
			import('@codemirror/theme-one-dark'),
			import('@codemirror/language'),
			import('@lezer/highlight')
		]);

	cachedModules = {
		EditorView: viewModule.EditorView,
		EditorState: stateModule.EditorState,
		keymap: viewModule.keymap,
		basicSetup: cmModule.basicSetup,
		python: pythonModule.python,
		oneDark: themeModule.oneDark,
		HighlightStyle: langModule.HighlightStyle,
		syntaxHighlighting: langModule.syntaxHighlighting,
		indentUnit: langModule.indentUnit,
		tags: highlightModule.tags
	};

	return cachedModules;
}

/**
 * Create syntax highlighting style for the given theme
 */
export function createHighlightStyle(modules: CodeMirrorModules, isDark: boolean) {
	const { HighlightStyle, tags } = modules;
	const varColor = isDark ? SYNTAX_COLORS.variable.dark : SYNTAX_COLORS.variable.light;
	const punctColor = isDark ? SYNTAX_COLORS.punctuation.dark : SYNTAX_COLORS.punctuation.light;
	const commentColor = isDark ? SYNTAX_COLORS.comment.dark : SYNTAX_COLORS.comment.light;

	return HighlightStyle.define([
		{ tag: tags.keyword, color: SYNTAX_COLORS.keyword },
		{ tag: tags.operator, color: SYNTAX_COLORS.operator },
		{ tag: tags.special(tags.variableName), color: SYNTAX_COLORS.special },
		{ tag: tags.typeName, color: SYNTAX_COLORS.special },
		{ tag: tags.atom, color: SYNTAX_COLORS.number },
		{ tag: tags.number, color: SYNTAX_COLORS.number },
		{ tag: tags.bool, color: SYNTAX_COLORS.number },
		{ tag: tags.string, color: SYNTAX_COLORS.string },
		{ tag: tags.character, color: SYNTAX_COLORS.string },
		{ tag: tags.regexp, color: SYNTAX_COLORS.string },
		{ tag: tags.escape, color: SYNTAX_COLORS.operator },
		{ tag: tags.variableName, color: varColor },
		{ tag: tags.definition(tags.variableName), color: varColor },
		{ tag: tags.propertyName, color: varColor },
		{ tag: tags.function(tags.variableName), color: SYNTAX_COLORS.function },
		{ tag: tags.function(tags.propertyName), color: SYNTAX_COLORS.function },
		{ tag: tags.definition(tags.function(tags.variableName)), color: SYNTAX_COLORS.function },
		{ tag: tags.labelName, color: varColor },
		{ tag: tags.comment, color: commentColor, fontStyle: 'italic' },
		{ tag: tags.blockComment, color: commentColor, fontStyle: 'italic' },
		{ tag: tags.docComment, color: commentColor, fontStyle: 'italic' },
		{ tag: tags.invalid, color: '#ffffff', backgroundColor: SYNTAX_COLORS.invalid },
		{ tag: tags.punctuation, color: punctColor },
		{ tag: tags.bracket, color: punctColor },
		{ tag: tags.className, color: SYNTAX_COLORS.special },
		{ tag: tags.attributeName, color: varColor },
		{ tag: tags.attributeValue, color: SYNTAX_COLORS.string },
		{ tag: tags.self, color: SYNTAX_COLORS.special }
	]);
}

export interface EditorOptions {
	/** Whether the editor is read-only */
	readOnly?: boolean;
	/** Custom keybindings */
	keymaps?: { key: string; run: (view: import('@codemirror/view').EditorView) => boolean }[];
	/** Callback when document changes */
	onDocChange?: (doc: string) => void;
	/** Line numbers */
	lineNumbers?: boolean;
}

/**
 * Create CodeMirror extensions for a Python editor
 */
export function createEditorExtensions(
	modules: CodeMirrorModules,
	isDark: boolean,
	options: EditorOptions = {}
): import('@codemirror/state').Extension[] {
	const {
		EditorView,
		EditorState,
		keymap,
		basicSetup,
		python,
		oneDark,
		syntaxHighlighting,
		indentUnit
	} = modules;

	const extensions: import('@codemirror/state').Extension[] = [];

	// Custom keymaps must come BEFORE basicSetup to take precedence
	if (options.keymaps && options.keymaps.length > 0) {
		extensions.push(keymap.of(options.keymaps));
	}

	extensions.push(
		basicSetup,
		python(),
		indentUnit.of('    '), // 4-space indentation for Python
		syntaxHighlighting(createHighlightStyle(modules, isDark))
	);

	// Read-only mode
	if (options.readOnly) {
		extensions.push(EditorState.readOnly.of(true));
	}

	// Document change listener
	if (options.onDocChange) {
		const callback = options.onDocChange;
		extensions.push(
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					callback(update.state.doc.toString());
				}
			})
		);
	}

	// Dark theme chrome (gutters, background, etc.)
	if (isDark) {
		extensions.push(oneDark);
	}

	return extensions;
}

/**
 * Create minimal CodeMirror extensions for read-only output display
 * No syntax highlighting, no line numbers, just consistent font styling
 */
export function createOutputExtensions(
	modules: CodeMirrorModules,
	isDark: boolean
): import('@codemirror/state').Extension[] {
	const { EditorView, EditorState, oneDark } = modules;

	const extensions: import('@codemirror/state').Extension[] = [
		EditorState.readOnly.of(true),
		EditorView.editable.of(false),
		EditorView.lineWrapping,
		// Minimal theme - hide gutters, match output styling
		EditorView.theme({
			'&': {
				backgroundColor: 'transparent',
				fontSize: '12px'
			},
			'.cm-scroller': {
				fontFamily: 'var(--font-mono)',
				fontWeight: '500',
				lineHeight: '1.5',
				padding: 'var(--space-md)',
				overflow: 'auto'
			},
			'.cm-content': {
				padding: '0',
				caretColor: 'transparent'
			},
			'.cm-line': {
				padding: '0'
			},
			'.cm-gutters': {
				display: 'none'
			},
			'.cm-activeLineGutter': {
				display: 'none'
			},
			'.cm-cursor': {
				display: 'none'
			}
		})
	];

	// Dark theme chrome
	if (isDark) {
		extensions.push(oneDark);
	}

	return extensions;
}

/**
 * Editor lifecycle manager - handles creation, theme updates, and cleanup
 * Reduces boilerplate in components that use CodeMirror
 */
export class EditorManager {
	private view: import('@codemirror/view').EditorView | null = null;
	private modules: CodeMirrorModules | null = null;
	private options: EditorOptions;

	constructor(options: EditorOptions = {}) {
		this.options = options;
	}

	/** Initialize the editor with the given content and container */
	async init(content: string, container: HTMLElement, isDark: boolean): Promise<void> {
		this.modules = await loadCodeMirrorModules();
		this.view = new this.modules.EditorView({
			doc: content,
			extensions: createEditorExtensions(this.modules, isDark, this.options),
			parent: container
		});
	}

	/** Update the editor theme (recreates editor with new extensions) */
	updateTheme(content: string, container: HTMLElement, isDark: boolean): void {
		if (!this.modules) return;
		this.view?.destroy();
		this.view = new this.modules.EditorView({
			doc: content,
			extensions: createEditorExtensions(this.modules, isDark, this.options),
			parent: container
		});
	}

	/** Get the current document content */
	getContent(): string {
		return this.view?.state.doc.toString() ?? '';
	}

	/** Destroy the editor */
	destroy(): void {
		this.view?.destroy();
		this.view = null;
	}

	/** Check if editor is initialized */
	get isInitialized(): boolean {
		return this.view !== null;
	}

	/** Get the underlying EditorView (for advanced use) */
	get editorView(): import('@codemirror/view').EditorView | null {
		return this.view;
	}
}
