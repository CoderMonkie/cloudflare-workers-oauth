const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2021',
  platform: 'neutral',
  minify: true,
  sourcemap: true,
  external: ['__STATIC_CONTENT_MANIFEST'],
}).catch(() => process.exit(1));