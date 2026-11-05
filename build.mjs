import { build } from 'esbuild';
import { mkdir,copyFile,readdir,readFile,writeFile } from 'node:fs/promises';
await mkdir('dist/assets',{recursive:true});
await build({entryPoints:['src/local-ocr.mjs'],outfile:'dist/assets/local-ocr.js',bundle:true,external:['fs','path'],format:'esm',platform:'browser',target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
await copyFile('index.html','dist/index.html');
for(const name of (await readdir('node_modules/onnxruntime-web/dist')).filter(n=>n.startsWith('ort-wasm-')&&/\.(mjs|wasm)$/.test(n)))await copyFile(`node_modules/onnxruntime-web/dist/${name}`,`dist/assets/${name}`);

const worker=(await readdir('node_modules/@paddleocr/paddleocr-js/dist/assets')).find(n=>n.startsWith('worker-entry-')&&n.endsWith('.js'));
const cacheFetch=`const baseFetch=self.fetch.bind(self);self.fetch=async(input,init)=>{if(!String(input).endsWith('.tar')||!self.caches)return baseFetch(input,init);const cache=await caches.open('health-ocr-models-v1');const found=await cache.match(input);if(found)return found;const res=await baseFetch(input,init);if(res.ok)await cache.put(input,res.clone());return res;};\n`;
await writeFile('dist/assets/paddle-worker.js',cacheFetch+await readFile('node_modules/@paddleocr/paddleocr-js/dist/assets/'+worker,'utf8'));
