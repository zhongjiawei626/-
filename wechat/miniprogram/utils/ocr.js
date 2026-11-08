// VisionKit static photo OCR. Keep reading VK frames to dispatch anchor events,
// as in WeChat's official photo-ocr-detect example. Each request owns a session.
const {groupOcrItems,parseReportLines}=require('./report-parser');
function decode(anchors,width,height){
 const list=Array.isArray(anchors)?anchors:Array.isArray(anchors&&anchors.anchors)?anchors.anchors:[];
 const items=list.filter(a=>a.subtext&&Array.isArray(a.box)&&a.box.length>=4).map(a=>({text:Array.isArray(a.subtext)?a.subtext.join(' '):String(a.subtext),poly:a.box.map(p=>Array.isArray(p)?[p[0]*width,p[1]*height]:[p.x*width,p.y*height]),score:typeof a.confidence==='number'&&a.confidence>=0&&a.confidence<=1?a.confidence:0}));
 const lines=items.length?groupOcrItems(items):list.map(a=>String(a.text||a.subtext||'')).filter(Boolean).join('\n').split(/\n/).map(text=>({text,score:0}));
 const text=lines.map(l=>l.text).join('\n').trim(),specimen=text.match(/(?:标本类型|标本种类|标本)[：:\s]*(尿液|尿|血清|血浆|血液|全血)/)?.[1]||'';
 return {text,records:parseReportLines(lines,specimen)};
}
function create(gl,options={}){
 if(!wx.createVKSession)throw Error('当前设备不支持微信端侧 OCR');
 let disposed=false,active=null,last={stage:'idle',frames:0,events:0};
 const timeoutMs=options.timeoutMs||16000,prepareTimeoutMs=options.prepareTimeoutMs||10000;
 const stage=value=>{last={...last,stage:value};if(options.onProgress)options.onProgress(value)};
 function waitFor(register,message){return new Promise((resolve,reject)=>{let settled=false;const done=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);if(active)active.cancelWait=null;error?reject(error):resolve(value)};const timer=setTimeout(()=>done(Error(message)),prepareTimeoutMs);if(active)active.cancelWait=()=>done(Error('识别已取消'));try{register(value=>done(null,value),error=>done(error))}catch(error){done(error)}})}
 async function pixels(path){
  stage('read');const info=await waitFor((resolve,reject)=>wx.getImageInfo({src:path,success:resolve,fail:()=>reject(Error('报告图片无法读取'))}),'读取报告图片超时，请重试已保存原件');
  if(disposed)throw Error('识别已取消');stage('decode');
  const scale=Math.min(1,1600/Math.max(info.width,info.height)),width=Math.max(1,Math.round(info.width*scale)),height=Math.max(1,Math.round(info.height*scale));
  const canvas=wx.createOffscreenCanvas({type:'2d',width,height}),ctx=canvas.getContext('2d'),image=canvas.createImage();
  await waitFor((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('图片解码失败'));image.src=path},'图片解码超时，请重试已保存原件');
  if(disposed)throw Error('识别已取消');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);
  const frame=ctx.getImageData(0,0,width,height);return {width,height,frameBuffer:frame.data.buffer};
 }
 return {
  diagnostics(){return {...last}},
  async recognize(path){
   if(disposed)throw Error('识别器已关闭');if(active)throw Error('另一份报告正在识别');
   const job={session:null,raf:null,timer:null,done:false,submitted:false,reject:null};active=job;last={stage:'decode',frames:0,events:0,started:Date.now()};
   try{
    const input=await pixels(path);if(disposed||active!==job)throw Error('识别已取消');
    return await new Promise((resolve,reject)=>{
     job.reject=reject;
     const finish=(error,result)=>{if(job.done)return;job.done=true;clearTimeout(job.timer);if(job.raf!==null&&job.session&&job.session.cancelAnimationFrame){try{job.session.cancelAnimationFrame(job.raf)}catch(ignore){}}if(job.session){try{job.session.stop&&job.session.stop()}catch(ignore){}try{job.session.destroy&&job.session.destroy()}catch(ignore){}}if(active===job)active=null;last={...last,stage:error?'failed':'complete',elapsedMs:Date.now()-last.started};console.info('[health-ocr]',JSON.stringify(last));if(error)reject(error);else resolve(result)};
     job.finish=finish;
     try{
      const session=job.session=wx.createVKSession({track:{OCR:{mode:2}},version:'v1',gl});
      const receive=(anchors,event)=>{if(job.done||!job.submitted)return;last.events++;try{const result=decode(anchors,input.width,input.height);if(!result.text&&event==='addAnchors')return;finish(null,result)}catch(error){finish(Error('识别结果解析失败，请重试已保存报告'))}};
      session.on('updateAnchors',anchors=>receive(anchors,'updateAnchors'));
      session.on('addAnchors',anchors=>receive(anchors,'addAnchors'));
      stage('start');job.timer=setTimeout(()=>finish(Error('微信 OCR 初始化超时，请重试已保存报告')),10000);
      session.start(error=>{
       if(job.done)return;if(error){finish(Error('微信 OCR 初始化失败（'+String(error)+'）'));return}
       clearTimeout(job.timer);
       if(typeof session.runOCR!=='function'||typeof session.getVKFrame!=='function'||typeof session.requestAnimationFrame!=='function'){finish(Error('当前设备缺少照片识别能力，请更新微信'));return}
       const pump=()=>{if(job.done)return;try{session.getVKFrame(Math.max(1,gl&&gl.drawingBufferWidth||300),Math.max(1,gl&&gl.drawingBufferHeight||150));last.frames++}catch(error){last.frameError=true}if(!job.done)job.raf=session.requestAnimationFrame(pump)};
       job.raf=session.requestAnimationFrame(pump);
       job.timer=setTimeout(()=>finish(Error('微信 OCR 未返回结果，可在报告库重试；无需重复导入')),timeoutMs);
       stage('recognize');job.submitted=true;
       try{session.runOCR(input)}catch(error){finish(Error('微信 OCR 调用失败，请重试已保存报告'))}
      });
     }catch(error){finish(error)}
    });
   }catch(error){if(active===job)active=null;last={...last,stage:'failed'};throw error}
  },
  destroy(){disposed=true;if(active&&active.cancelWait)active.cancelWait();if(active&&active.finish)active.finish(Error('识别已取消'));active=null}
 };
}
module.exports={create,decode};
