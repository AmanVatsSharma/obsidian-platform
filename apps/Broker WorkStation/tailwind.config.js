/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base':  '#06080A',
        'bg-1':     '#0C0E12',
        'bg-2':     '#0F1216',
        'bg-3':     '#141820',
        'bg-4':     '#1A1F28',
        'bull':     '#10D996',
        'bear':     '#FF3B5C',
        'accent':   '#3B82F6',
        'warn':     '#F59E0B',
      },
      fontFamily: {
        'data':    ['IBM Plex Mono', 'monospace'],
        'display': ['Syne', 'sans-serif'],
        'ui':      ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'obsidian-sm': '4px',
        'obsidian-md': '8px',
        'obsidian-lg': '12px',
        'obsidian-xl': '16px',
      },
    },
  },
  plugins: [],
};
