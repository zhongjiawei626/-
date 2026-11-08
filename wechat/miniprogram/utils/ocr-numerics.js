// Browser-independent image preprocessing and CTC decoding, for native inference.
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
function tensor(image,width,height,box,recognition=false){
 const source=box||{x:0,y:0,w:image.width,h:image.height};const drawWidth=recognition?Math.min(width,Math.ceil(height*source.w/source.h)):width;
 const n=width*height,out=new Float32Array(n*3),mean=recognition?[.5,.5,.5]:[.485,.456,.406],std=recognition?[.5,.5,.5]:[.229,.224,.225];
 for(let y=0;y<height;y++)for(let x=0;x<drawWidth;x++){
  const sx=clamp(source.x+(x+.5)*source.w/drawWidth-.5,0,image.width-1),sy=clamp(source.y+(y+.5)*source.h/height-.5,0,image.height-1),x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,image.width-1),y1=Math.min(y0+1,image.height-1),fx=sx-x0,fy=sy-y0;
  for(let c=0;c<3;c++){const channel=2-c;const a=image.data[(y0*image.width+x0)*4+channel],b=image.data[(y0*image.width+x1)*4+channel],d=image.data[(y1*image.width+x0)*4+channel],e=image.data[(y1*image.width+x1)*4+channel];out[c*n+y*width+x]=(((a*(1-fx)+b*fx)*(1-fy)+(d*(1-fx)+e*fx)*fy)/255-mean[c])/std[c]}
 }
 return out;
}
function detectionSize(width,height,maxSide=960){const scale=Math.min(1,maxSide/Math.max(width,height));return {width:Math.max(32,Math.round(width*scale/32)*32),height:Math.max(32,Math.round(height*scale/32)*32)}}
function boxes(data,width,height,sourceWidth,sourceHeight){
 if(data.length!==width*height)throw Error('检测模型输出尺寸不匹配');const visited=new Uint8Array(data.length),queue=new Int32Array(data.length),out=[];
 for(let start=0;start<data.length;start++){
  if(visited[start]||data[start]<.2)continue;let head=0,tail=1,minX=width,maxX=0,minY=height,maxY=0,sum=0;queue[0]=start;visited[start]=1;
  while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sum+=data[i];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const j=ny*width+nx;if(!visited[j]&&data[j]>=.2){visited[j]=1;queue[tail++]=j}}}
  const w=maxX-minX+1,h=maxY-minY+1;if(tail<8||w<3||h<3||sum/tail<.4)continue;
  const pad=w*h/(2*(w+h))*1.4,x=clamp(minX-pad,0,width),y=clamp(minY-pad,0,height),right=clamp(maxX+1+pad,0,width),bottom=clamp(maxY+1+pad,0,height);
  out.push({x:x/width*sourceWidth,y:y/height*sourceHeight,w:(right-x)/width*sourceWidth,h:(bottom-y)/height*sourceHeight,score:sum/tail});
 }
 return out.sort((a,b)=>a.y-b.y||a.x-b.x);
}
function decodeCTC(data,shape,characters){
 if(shape.length!==3||shape[0]!==1||shape[2]!==characters.length||data.length!==shape.reduce((a,b)=>a*b,1))throw Error('文字模型输出尺寸不匹配');let text='',previous=-1,sum=0,count=0;const classes=shape[2];
 for(let t=0;t<shape[1];t++){let best=0,score=-Infinity;for(let c=0;c<classes;c++){const p=data[t*classes+c];if(p>score){best=c;score=p}}if(best!==0&&best!==previous){text+=characters[best];sum+=score;count++}previous=best}
 return {text,score:count?sum/count:0};
}
module.exports={tensor,detectionSize,boxes,decodeCTC};
