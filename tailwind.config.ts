import type { Config } from 'tailwindcss';

export default {
	theme: {
		extend: {
			fontFamily: {
				sans: ['Recursive T', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				heading: ['Recursive H', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
			}
		}
	}
} satisfies Config;
