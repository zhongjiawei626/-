// PaddleOCR ONNX inference on the phone; no server or report upload.
const manifest=require('./ocr-models'),characters=require('./ocr-characters');
const {tensor,detectionInput,boxes,decodeCTC}=require('./ocr-numerics');
const loadPackage=require('./ocr-package-loaders');
const diagnostics=require('./ocr-diagnostics');let diagnosticCache=null;
const {groupOcrItems,parseReportLines}=require('./report-parser');
function create(options={}){
 let destroyed=false,det=null,rec=null,ready=null,busy=false,modelPaths={};const pending=new Set(),progress=options.onProgress||(()=>{}),fs=wx.getFileSystemManager();
 function guard(){if(destroyed)throw Error('识别已取消')}
 function wait(register,message,ms=30000){guard();return new Promise((resolve,reject)=>{let done=false;const end=(error,value)=>{if(done)return;done=true;clearTimeout(timer);pending.delete(cancel);error?reject(error):resolve(value)},cancel=()=>end(Error('识别已取消')),timer=setTimeout(()=>end(Error(message)),ms);pending.add(cancel);try{register(value=>end(null,value),error=>end(error instanceof Error?error:Error(error&&error.errMsg||message)))}catch(error){end(error)}})}
 async function model(kind){
  const meta=manifest[kind],dir=wx.env.USER_DATA_PATH+'/ocr-v6-tiny-'+meta.sha256.slice(0,12),path=dir+'/'+kind+'.onnx';try{if(fs.statSync(path).size===meta.size)return path}catch(ignore){}
  try{fs.mkdirSync(dir,true)}catch(ignore){}const temp=path+'.part';try{fs.writeFileSync(temp,new ArrayBuffer(0));for(const chunk of meta.chunks){guard();const encoded=await wait((ok,fail)=>(options.loadPackage||loadPackage)(chunk.name).then(ok,fail),'离线识别模型加载超时，请检查网络');guard();const data=wx.base64ToArrayBuffer(encoded);if(data.byteLength!==chunk.size)throw Error('离线识别模型不完整');fs.appendFileSync(temp,data)}if(fs.statSync(temp).size!==meta.size)throw Error('离线识别模型不完整');fs.renameSync(temp,path);return path}catch(error){try{fs.unlinkSync(temp)}catch(ignore){}throw error}
 }
 async function session(kind,path){guard();const s=wx.createInferenceSession({model:path,precisionLevel:4,allowNPU:false,allowQuantize:false,typicalShape:{x:manifest[kind].shape}});if(kind==='det')det=s;else rec=s;await wait((ok,fail)=>{s.onLoad(ok);s.onError(error=>{console.warn('[offline-ocr-model]',kind,JSON.stringify(error));fail(error)})},'当前手机无法加载离线文字模型');return s}
 async function initialize(){
  if(!wx.createInferenceSession)throw Error('当前微信不支持离线模型，请更新微信');if(!ready)ready=(async()=>{progress('model');const detPath=await model('det'),recPath=await model('rec');modelPaths={det:detPath,rec:recPath};await session('det',detPath);await session('rec',recPath)})().catch(async error=>{ready=null;for(const s of [det,rec])if(s)try{s.destroy()}catch(ignore){}det=rec=null;if(/convert onnx model/i.test(error.message||'')&&!destroyed){progress('diagnose');try{if(!diagnosticCache)diagnosticCache=await diagnostics.run(['det','rec'].map(kind=>({kind,path:modelPaths[kind],md5:manifest[kind].md5})));throw Error('离线识别兼容性诊断：'+diagnosticCache.summary)}catch(result){throw result}}throw error});await ready;guard();
 }
 async function image(path){
  progress('read');const info=await wait((ok,fail)=>wx.getImageInfo({src:path,success:ok,fail}),'报告图片读取超时',10000),scale=Math.min(1,2000/Math.max(info.width,info.height)),width=Math.max(1,Math.round(info.width*scale)),height=Math.max(1,Math.round(info.height*scale));guard();
  const canvas=wx.createOffscreenCanvas({type:'2d',width,height}),ctx=canvas.getContext('2d'),im=canvas.createImage();await wait((ok,fail)=>{im.onload=ok;im.onerror=fail;im.src=path},'报告图片解码超时',10000);guard();ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(im,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height);return {data:pixels.data,width,height};
 }
 async function infer(s,data,shape){guard();return await wait((ok,fail)=>s.run({x:{type:'float32',shape,data:data.buffer}}).then(ok,fail),'离线模型计算超时，请尝试裁剪后重试')}
 return {
  async recognize(path){if(busy)throw Error('另一份报告正在识别');busy=true;try{
   await initialize();const pixels=await image(path),size={width:manifest.det.shape[3],height:manifest.det.shape[2]};progress('detect');const prep=detectionInput(pixels,size.width,size.height);const detection=await infer(det,prep.data,[1,3,size.height,size.width]),map=detection.fetch_name_0;if(!map)throw Error('检测模型未返回结果');const regions=boxes(new Float32Array(map.data),map.shape[3],map.shape[2],pixels.width*size.width/prep.scaledWidth,pixels.height*size.height/prep.scaledHeight).filter(b=>b.x<pixels.width&&b.y<pixels.height).map(b=>({...b,w:Math.min(b.w,pixels.width-b.x),h:Math.min(b.h,pixels.height-b.y)}));if(regions.length>300)throw Error('报告内容过多，请按页裁剪后识别');const items=[];
   for(let i=0;i<regions.length;i++){guard();progress('recognize',i+1,regions.length);const b=regions[i],width=manifest.rec.shape[3],result=await infer(rec,tensor(pixels,width,48,b,true),[1,3,48,width]),output=result.fetch_name_0;if(!output)throw Error('文字模型未返回结果');const value=decodeCTC(new Float32Array(output.data),output.shape,characters);if(value.text.trim()&&value.score>=.5)items.push({...value,poly:[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]]})}
   const lines=groupOcrItems(items),text=lines.map(l=>l.text).join('\n'),specimen=text.match(/(?:标本类型|标本种类|标本)[：:\s]*(尿液|尿|血清|血浆|血液|全血)/)?.[1]||'';return {text,records:parseReportLines(lines,specimen)};
  }finally{busy=false}},
  destroy(){destroyed=true;for(const cancel of [...pending])cancel();for(const s of [det,rec])if(s)try{s.destroy()}catch(ignore){}det=rec=null}
 };
}
module.exports={create};
