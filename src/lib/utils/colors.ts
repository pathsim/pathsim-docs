/**
 * Color definitions for PathSim Documentation
 * Matches PathView design system
 */

// Syntax highlighting colors - aligned with design system
export const SYNTAX_COLORS = {
	keyword: '#E57373', // Red - control flow, imports
	operator: '#0070C0', // PathSim blue - symbols, operators
	special: '#FFB74D', // Orange - classes, types, decorators
	number: '#4DB6AC', // Teal - numeric literals
	string: '#81C784', // Green - string literals
	function: '#0070C0', // PathSim blue - function names
	comment: { dark: '#505060', light: '#909098' },
	invalid: '#BA68C8', // Purple - errors
	variable: { dark: '#e0e0e0', light: '#383a42' },
	punctuation: { dark: '#abb2bf', light: '#505050' }
} as const;
