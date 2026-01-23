/**
 * Shared code utilities for PathSim Documentation
 */

/**
 * Detect language from code content
 * Returns 'console' for code with Python REPL markers, 'python' otherwise
 */
export function detectLanguage(code: string): 'python' | 'console' {
	if (code.includes('>>>') || code.includes('...')) {
		return 'console';
	}
	return 'python';
}
