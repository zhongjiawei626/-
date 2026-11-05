import { PaddleOCR } from '@paddleocr/paddleocr-js';
import { groupOcrItems, parseReportLines } from './report-parser.mjs';
let enginePromise;
async function engine() {
  if(!enginePromise) enginePromise=PaddleOCR.create({
    lang:'ch',ocrVersion:'PP-OCRv6',worker:{createWorker:()=>new Worker('/assets/paddle-worker.js',{type:'module'})},
    ortOptions:{backend:'wasm',wasmPaths:'/assets/',numThreads:1},
  }).catch(err=>{enginePromise=null;throw err;});
  return enginePromise;
}
window.localReportExtract=async ({text,image})=>{
  let lines;
  if(text) lines=text.split(/\n+/);
  else {
    const ocr=await engine();
    const blob=await (await fetch(`data:${image.mimeType};base64,${image.data}`)).blob();
    const [result]=await ocr.predict(blob,{textDetLimitSideLen:1600,textDetLimitType:'max'});
    lines=groupOcrItems(result.items);
  }
  const fullText=lines.map(x=>typeof x==='string'?x:x.text).join('\n');
  const date=fullText.match(/(?:报告时间|报告日期|采样时间|检验日期)[：:\s]*(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  return {date:date?`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`:'',hospital:fullText.match(/[^\s\n]{2,25}医院/)?.[0]||'',records:parseReportLines(lines),text:fullText};
};
