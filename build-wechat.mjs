import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
await build({entryPoints:['src/report-parser.mjs'],outfile:'wechat/miniprogram/utils/report-parser.js',bundle:true,format:'cjs',platform:'neutral',target:'es2018'});
const html=await readFile('index.html','utf8');
const names=['baseMetric','unitToken','convertMeasurementValue','canonicalize','referenceBounds','referenceText'];
let code="// Shared unit and reference rules generated from the web application.\nconst numeric=v=>typeof v==='number'&&Number.isFinite(v);\n";
for(const name of names){const begin=html.indexOf('function '+name+'(');if(begin<0)throw Error('Missing '+name);let depth=0,quote=null,escape=false,end=begin;const body=html.indexOf('{',begin);/* Use next top-level function boundary for these existing declarations. */const next=html.indexOf('\nfunction ',body);const nextAsync=html.indexOf('\nasync function ',body);const bounds=[next,nextAsync,html.indexOf('\nlet ',body),html.indexOf('\nconst ',body),html.indexOf('\ndocument.',body)].filter(x=>x>body);end=Math.min(...bounds);code+=html.slice(begin,end)+'\n';}
code+='\nmodule.exports={numeric,'+names.join(',')+'};\n';
await writeFile('wechat/miniprogram/utils/domain.js',code);
