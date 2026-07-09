/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clinical workstation palette - deep navy/charcoal, low-glare for OR use.
        base: '#0A121C',        // page background
        surface: '#101B28',     // panels, top bar, nav
        raised: '#152232',      // cards
        raised2: '#1B2C40',     // hovered / nested cards
        line: '#243449',        // hairline borders
        line2: '#2E4258',       // stronger borders / dividers

        ink: '#0A121C',
        paper: '#E9EEF3',       // primary text
        muted: '#8CA0B3',       // secondary text / labels
        subtle: '#5E7284',      // tertiary / disabled text

        mint: '#34D399',        // primary accent (monitor green) - confirm/positive
        mint2: '#22B686',
        info: '#5B9BFF',        // clinical blue - informational / active nav
        info2: '#4785F0',
        amber: '#F2A93B',       // caution
        rose: '#F0555B',        // alert / complication / destructive
      },
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
        raised: '0 4px 16px rgba(0,0,0,0.35)',
        overlay: '0 8px 40px rgba(0,0,0,0.55)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-up': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'fade-up': 'fade-up 0.22s ease-out',
        'slide-in-left': 'slide-in-left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
