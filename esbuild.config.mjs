import { build } from 'esbuild';

console.log('Starting build...');

build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'main.js',
  platform: 'node',
  external: ['obsidian'],
  allowOverwrite: true,
}).then(() => {
  console.log('Build completed successfully');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});