import type { SpectacleThemeOverrides } from 'spectacle';

// Matches the macek.ai site's "dark inventor" brand: warm charcoal
// backgrounds, a single gold accent, Playfair Display headings, DM Sans
// body copy, JetBrains Mono for small labels. See landing/src/index.css for
// the source-of-truth tokens (OKLCH) this was derived from.
export const webinarTheme: SpectacleThemeOverrides = {
  size: {
    width: 1280,
    height: 720,
  },
  colors: {
    primary: '#efe7d9', // foreground -- light text on dark backgrounds
    secondary: '#090502', // background -- main charcoal
    tertiary: '#dbb155', // gold -- accent, CTA/exercise slide backgrounds
    quaternary: '#887f73', // muted foreground -- subtitles, de-emphasized text
    quinary: '#120c07', // card -- alt-dark background for visual rhythm
  },
  fonts: {
    header: '"Playfair Display", serif',
    text: '"DM Sans", sans-serif',
    monospace: '"JetBrains Mono", monospace',
  },
};

// Extra brand tokens not part of Spectacle's 5-color theme slot, used
// directly in WebinarDeck for finer touches (e.g. gold-dim on hover-like
// emphasis, or the exact text-on-gold color for CTA-style exercise slides).
export const brand = {
  goldLight: '#f0d49b',
  goldDim: '#ab8a41',
  border: 'rgba(239, 231, 217, 0.12)',
};
