import onnx,onnxruntime as rt,numpy as np,base64,json
from onnx import helper as h,numpy_helper as nh,TensorProto as T
out=[]
for name in ['Conv','Scalar0D','Scalar1D','Erf','HardSigmoid','ResizeEmptyROI','UpsampleLegacy','ReduceMean','ConvTranspose']:
 init=[nh.from_array(np.array([[[[2.]]]],dtype=np.float32),'weight'),nh.from_array(np.array([0.],dtype=np.float32),'bias')]
 nodes=[h.make_node('Conv',['x','weight','bias'],['c'],kernel_shape=[1,1])];shape=[1,1,2,2]
 if name=='Conv':nodes[-1].output[0]='y'
 elif name.startswith('Scalar'):
  init.append(nh.from_array(np.array(2.,dtype=np.float32).reshape([] if name=='Scalar0D' else [1]),'scalar'));nodes.append(h.make_node('Mul',['c','scalar'],['y']))
 elif name in ['Erf','HardSigmoid']:nodes.append(h.make_node(name,['c'],['y']))
 elif name.startswith('Resize'):
  init.append(nh.from_array(np.array([1,1,2,2],dtype=np.float32),'scales'));roi=''
  if name=='ResizeEmptyROI':roi='roi';init.append(nh.from_array(np.array([],dtype=np.float32),'roi'))
  nodes.append(h.make_node('Resize',['c',roi,'scales'],['y'],mode='nearest',coordinate_transformation_mode='asymmetric',nearest_mode='floor'));shape=[1,1,4,4]
 elif name=='UpsampleLegacy':
  init.append(nh.from_array(np.array([1,1,2,2],dtype=np.float32),'scales'));nodes.append(h.make_node('Upsample',['c','scales'],['y'],mode='nearest'));shape=[1,1,4,4]
 elif name=='ReduceMean':nodes.append(h.make_node('ReduceMean',['c'],['y'],axes=[2,3],keepdims=1));shape=[1,1,1,1]
 else:
  init.append(nh.from_array(np.ones([1,1,4,4],dtype=np.float32)*.25,'up'));nodes.append(h.make_node('ConvTranspose',['c','up'],['y'],kernel_shape=[4,4],strides=[2,2],pads=[1,1,1,1]));shape=[1,1,4,4]
 model=h.make_model(h.make_graph(nodes,'probe',[h.make_tensor_value_info('x',T.FLOAT,[1,1,2,2])],[h.make_tensor_value_info('y',T.FLOAT,shape)],init),opset_imports=[h.make_opsetid('',9 if name=='UpsampleLegacy' else 11)]);model.ir_version=6;onnx.checker.check_model(model);data=model.SerializeToString();s=rt.InferenceSession(data,providers=['CPUExecutionProvider']);expected=s.run(None,{'x':np.array([1,2,3,4],dtype=np.float32).reshape([1,1,2,2])})[0]
 out.append({'name':name,'model':base64.b64encode(data).decode(),'expected':expected.flatten().tolist()})
open('wechat/miniprogram/utils/ocr-probes.js','w').write('module.exports='+json.dumps(out,separators=(',',':'))+';\n');print('Generated',len(out),'validated diagnostic models')
