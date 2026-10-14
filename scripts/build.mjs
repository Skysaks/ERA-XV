// Builds ERA XV into single HTML files:
//   dist/era-xv.html            → the published artifact page (React 18 from cdnjs)
//   dist/era-xv.standalone.html → fully offline copy (React inlined), for local play and tests
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/** Subresource Integrity of a local file: the CDN serves the same bytes as the installed npm package. */
const sri = (path) => `sha512-${createHash('sha512').update(readFileSync(path)).digest('base64')}`;
const versionOf = (pkg) => JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, 'utf8')).version;

mkdirSync('build', { recursive: true });
mkdirSync('dist', { recursive: true });

execSync('npx @tailwindcss/cli -i src/ui/styles.css -o build/app.css --minify', { stdio: 'inherit' });

const globalsPlugin = {
  name: 'react-globals',
  setup(b) {
    const map = { react: 'React', 'react-dom': 'ReactDOM', 'react-dom/client': 'ReactDOM' };
    b.onResolve({ filter: /^react(-dom)?(\/client)?$/ }, (a) => ({ path: a.path, namespace: 'global' }));
    b.onLoad({ filter: /.*/, namespace: 'global' }, (a) => ({ contents: `module.exports = window.${map[a.path]};`, loader: 'js' }));
  },
};

await build({
  entryPoints: ['src/ui/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  define: { 'process.env.NODE_ENV': '"production"', __ANALYTICS_URL__: JSON.stringify(process.env.ERA_ANALYTICS_URL ?? '') },
  plugins: [globalsPlugin],
  outfile: 'build/app.js',
  legalComments: 'none',
});

const fonts = readFileSync('assets/fonts.css', 'utf8');
const css = readFileSync('build/app.css', 'utf8');
const js = readFileSync('build/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const head = `<title>ERA XV</title>
<meta name="description" content="Every era. One XV. Draft an impossible rugby union XV and play a 26-game season.">
<meta name="theme-color" content="#07110E">
<style>${fonts}</style>
<style>${css}</style>
<div id="root"></div>
`;
// CDN URLs follow the installed versions, and each script is pinned with SRI: a tampered CDN file is refused.
const cdnScript = (pkg, file) =>
  `<script src="https://cdnjs.cloudflare.com/ajax/libs/${pkg}/${versionOf(pkg)}/umd/${file}" integrity="${sri(`node_modules/${pkg}/umd/${file}`)}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>\n`;
const cdn = cdnScript('react', 'react.production.min.js') + cdnScript('react-dom', 'react-dom.production.min.js');

// The offline copy loads nothing from the network: everything is inline (fonts as data: URIs).
// Only the optional analytics endpoint may be contacted.
const analyticsOrigin = (() => {
  try { return process.env.ERA_ANALYTICS_URL ? new URL(process.env.ERA_ANALYTICS_URL).origin : ''; } catch { return ''; }
})();
const standaloneCsp = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'font-src data:',
  "img-src data: blob:",
  `connect-src ${analyticsOrigin || "'none'"}`,
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');
writeFileSync('dist/era-xv.html', `${head}${cdn}<script>${js}</script>\n`);

const reactUmd = readFileSync('node_modules/react/umd/react.production.min.js', 'utf8');
const domUmd = readFileSync('node_modules/react-dom/umd/react-dom.production.min.js', 'utf8');
const standalone = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="${standaloneCsp}"><meta name="referrer" content="no-referrer">${head.replace('<div id="root"></div>\n', '')}</head><body>
<div id="root"></div>
<script>${reactUmd.replace(/<\/script/gi, '<\\/script')}</script>
<script>${domUmd.replace(/<\/script/gi, '<\\/script')}</script>
<script>${js}</script>
</body></html>
`;
writeFileSync('dist/era-xv.standalone.html', standalone);
const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} KB`;
console.log(`dist/era-xv.html ${kb(`${head}${cdn}${js}`)} · app.js ${kb(js)} · css ${kb(css)} · standalone ${kb(standalone)}`);
