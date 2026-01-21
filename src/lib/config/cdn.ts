// Centralized CDN URLs for external resources

export const CDN = {
	// Google Fonts
	fonts: {
		preconnect: 'https://fonts.googleapis.com',
		preconnectGstatic: 'https://fonts.gstatic.com',
		inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
		jetbrainsMono: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
		combined: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
	},

	// KaTeX for math rendering
	katex: {
		version: '0.16.9',
		css: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
	}
} as const;
