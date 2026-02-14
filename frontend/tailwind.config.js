/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				// Terminal brutalism palette
				dark: {
					950: '#0a0a0f',
					900: '#111118',
					800: '#1a1a24',
					700: '#24243a',
					600: '#2e2e4a',
				},
				neon: {
					cyan: '#00ffff',
					green: '#00ff88',
					purple: '#aa00ff',
					pink: '#ff00aa',
					yellow: '#ffee00',
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
			},
			fontFamily: {
				mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
				display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'slide-in': 'slideIn 0.5s ease-out',
			},
			keyframes: {
				glow: {
					'0%': { boxShadow: '0 0 5px rgba(0, 255, 255, 0.5), 0 0 10px rgba(0, 255, 255, 0.3)' },
					'100%': { boxShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.5)' },
				},
				slideIn: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
			},
		},
	},
	plugins: [],
}

