import path from "node:path";

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Android System WebView can be as old as Chrome 91, which drops every
    // @layer block (Chrome 99+), i.e. all of Tailwind's theme, preflight and
    // utilities. Flatten the layers, keeping their priority via specificity.
    "@csstools/postcss-cascade-layers": {},
    // vh and transform fallbacks for the same WebView; see the file header.
    // Absolute path: Turbopack require()s plugin names from .next/build/chunks.
    // shortcut: assumes builds run from the project root (npm scripts do), move
    // to a local workspace package if that ever changes.
    [path.join(process.cwd(), "postcss-webview-fallbacks.cjs")]: {},
  },
};

export default config;
