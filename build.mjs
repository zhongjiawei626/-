import { build } from 'esbuild';
import { mkdir,copyFile,readdir } from 'node:fs/promises';
await mkdir('dist/assets',{recursive:true});
await build({entryPoints:['src/local-ocr.mjs'],outfile:'dist/assets/local-ocr.js',bundle:true,external:['fs','path'],format:'esm',platform:'browser',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
await copyFile('index.html','dist/index.html');
for(const name of (await readdir('node_modules/onnxruntime-web/dist')).filter(n=>n.startsWith('ort-wasm-')&&/\.(mjs|wasm)$/.test(n)))await copyFile(`node_modules/onnxruntime-web/dist/${name}`,`dist/assets/${name}`);
