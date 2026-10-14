// Builds assets/fonts.css: the two ERA XV typefaces inlined as data URIs (the artifact page loads no font host).
// Archivo (variable width + weight, OFL) for display and text; IBM Plex Mono (OFL) for match-sheet labels and numbers.
import { readFileSync, writeFileSync } from 'node:fs';
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const uri = (f) => `url(data:font/woff2;base64,${readFileSync(`assets/fonts/${f}`).toString('base64')}) format('woff2')`;
const css = [
  `@font-face{font-family:"Archivo";font-style:normal;font-display:swap;font-weight:100 900;font-stretch:62% 125%;src:${uri('archivo-latin-wdth-normal.woff2')};unicode-range:${LATIN}}`,
  `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-display:swap;font-weight:500;src:${uri('ibm-plex-mono-latin-500-normal.woff2')};unicode-range:${LATIN}}`,
  `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-display:swap;font-weight:600;src:${uri('ibm-plex-mono-latin-600-normal.woff2')};unicode-range:${LATIN}}`,
].join('\n');
writeFileSync('assets/fonts.css', css + '\n');
console.log(`assets/fonts.css ${Math.round(css.length / 1024)} KB`);
