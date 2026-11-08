// Fixed public test tensors only. Never accepts report text or report pixels.
const probes=require('./ocr-probes');
function digest(path){return new Promise(resolve=>{let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value)},timer=setTimeout(()=>finish(null),5000);try{wx.getFileInfo({filePath:path,digestAlgorithm:'md5',success:r=>finish(r.digest),fail:()=>finish(null)})}catch(error){finish(null)}})}
async function run(files){
 const integrity={};for(const f of files)integrity[f.kind]=(await digest(f.path))===f.md5;
 const checks=[],fs=wx.getFileSystemManager(),dir=wx.env.USER_DATA_PATH+'/ocr-diagnostics';try{fs.mkdirSync(dir,true)}catch(ignore){}
 for(const probe of probes){
  const path=dir+'/'+probe.name+'.onnx';fs.writeFileSync(path,wx.base64ToArrayBuffer(probe.model));
  const result=await new Promise(resolve=>{let s,done=false;const finish=(ok,error)=>{if(done)return;done=true;clearTimeout(timer);if(s)try{s.destroy()}catch(ignore){}resolve({name:probe.name,ok,error:error?String(error.errMsg||error.message||error).slice(0,150):''})},timer=setTimeout(()=>finish(false,'timeout'),6000);
   try{s=wx.createInferenceSession({model:path,precisionLevel:4,allowNPU:false,allowQuantize:false});s.onError(error=>finish(false,error));s.onLoad(()=>{s.run({x:{type:'float32',shape:[1,1,2,2],data:new Float32Array([1,2,3,4]).buffer}}).then(output=>{const value=output.y;if(!value)return finish(false,'no output');const numbers=new Float32Array(value.data);const valid=numbers.length===probe.expected.length&&probe.expected.every((v,i)=>Math.abs(v-numbers[i])<.001);finish(valid,valid?'':'output mismatch')},error=>finish(false,error))})}catch(error){finish(false,error)}
  });checks.push(result);if(probe.name==='Conv'&&!result.ok)break;
 }
 const summary='模型文件'+(Object.values(integrity).every(Boolean)?'完整':'校验失败')+'；'+checks.map(c=>c.name+(c.ok?'通过':'失败')).join('，');return {integrity,checks,summary};
}
module.exports={run};
