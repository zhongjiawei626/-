// Reproducible packing of official PaddleOCR weights. Reports are never read.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import yaml from 'js-yaml';
const root='wechat/miniprogram',models={},packages=[];
for(const kind of ['det','rec']){
 const dir=process.argv[kind==='det'?2:3];if(!dir)throw Error('Usage: node build-wechat-models.mjs DET_EXTRACTED_DIRECTORY REC_EXTRACTED_DIRECTORY');
 const bytes=await fs.readFile(path.join(dir,'inference.onnx'));const chunks=[];
 for(let offset=0,index=0;offset<bytes.length;offset+=1500000,index++){
  const name=`ocr-${kind}-${index}`,folder=path.join(root,name);await fs.mkdir(folder,{recursive:true});
  const part=bytes.subarray(offset,offset+1500000);await fs.rm(path.join(folder,'weights.onnx'),{force:true});
  await fs.writeFile(path.join(folder,'stub.js'),'Page({})\n');await fs.writeFile(path.join(folder,'stub.json'),'{}\n');await fs.writeFile(path.join(folder,'stub.wxml'),'<view/>\n');await fs.writeFile(path.join(folder,'ready.js'),'module.exports='+JSON.stringify(part.toString('base64'))+';\n');
  packages.push({name,root:name,pages:['stub']});chunks.push({name,path:`${name}/weights.onnx`,size:part.length});
 }
 models[kind]={shape:kind==='det'?[1,3,960,960]:[1,3,48,640],size:bytes.length,md5:crypto.createHash('md5').update(bytes).digest('hex'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),chunks};
 if(kind==='rec'){
  const config=yaml.load(await fs.readFile(path.join(dir,'inference.yml'),'utf8'));const chars=['',...config.PostProcess.character_dict,' '];
  await fs.writeFile(path.join(root,'utils/ocr-characters.js'),'module.exports='+JSON.stringify(chars)+';\n');models.classes=chars.length;
 }
}
await fs.writeFile(path.join(root,'utils/ocr-package-loaders.js'),'const loaders={'+packages.map(p=>JSON.stringify(p.name)+':()=>require.async('+JSON.stringify('../'+p.root+'/ready.js')+')').join(',')+'};\nmodule.exports=name=>{if(!loaders[name])throw Error("未知模型分包");return loaders[name]()};\n');
await fs.writeFile(path.join(root,'utils/ocr-models.js'),'module.exports='+JSON.stringify(models,null,2)+';\n');
const app=JSON.parse(await fs.readFile(path.join(root,'app.json'),'utf8'));app.subpackages=packages;await fs.writeFile(path.join(root,'app.json'),JSON.stringify(app,null,2)+'\n');console.log({models:Object.fromEntries(['det','rec'].map(k=>[k,models[k].size])),classes:models.classes,packages:packages.length});
