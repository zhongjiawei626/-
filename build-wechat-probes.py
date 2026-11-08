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
for name in ['AutoPadConv','ExplicitPadConv','AutoPadPool','ExplicitPadPool','DepthwiseConv','DepthwiseDownsample','NamedConv','GELUFolded','ChannelGate','GlobalAveragePool','ConcatBranches','TransposeKernel2']:
    shape=[1,2,8,8];init=[];nodes=[]
    def const(key,value):
        init.append(nh.from_array(np.array(value,dtype=np.float32),key));return key
    def conv(src,out,weight,**attrs):
        kernel=attrs.get('kernel_shape',[1,1]);group=attrs.get('group',1)
        const(weight,np.ones([2,2//group,*kernel],dtype=np.float32)*.25)
        nodes.append(h.make_node('Conv',[src,weight],[out],name='Conv.'+str(len(nodes)),**attrs))
    if name in ['AutoPadConv','ExplicitPadConv']:
        attrs={'kernel_shape':[2,2],'strides':[1,1]}
        attrs.update({'auto_pad':'SAME_UPPER'} if name=='AutoPadConv' else {'pads':[0,0,1,1]})
        conv('x','y','w',**attrs)
    elif name in ['AutoPadPool','ExplicitPadPool']:
        attrs={'kernel_shape':[2,2],'strides':[1,1],'ceil_mode':0}
        attrs.update({'auto_pad':'SAME_UPPER'} if name=='AutoPadPool' else {'pads':[0,0,1,1]})
        nodes.append(h.make_node('MaxPool',['x'],['y'],**attrs))
    elif name.startswith('Depthwise'):
        conv('x','y','w',kernel_shape=[3,3],strides=[2,2] if name.endswith('Downsample') else [1,1],group=2,pads=[1,1,1,1])
    elif name=='NamedConv':conv('x','y','conv2d_108.w_0',kernel_shape=[1,1])
    elif name=='GELUFolded':
        conv('x','p2o.pd_op.conv2d.7.0','w',kernel_shape=[1,1]);const('sqrt2',2**.5);const('one',1.)
        nodes.extend([h.make_node('Div',['p2o.pd_op.conv2d.7.0','sqrt2'],['Div.1']),h.make_node('Erf',['Div.1'],['Erf.1']),h.make_node('Add',['Erf.1','one'],['Add.19']),h.make_node('Mul',['p2o.pd_op.conv2d.7.0','Add.19'],['Mul.3'])]);conv('Mul.3','y','w2',kernel_shape=[1,1])
    elif name=='ChannelGate':
        conv('x','c','w',kernel_shape=[1,1]);nodes.extend([h.make_node('ReduceMean',['c'],['pool'],axes=[2,3],keepdims=1),h.make_node('HardSigmoid',['pool'],['gate'],alpha=1/6,beta=.5),h.make_node('Mul',['c','gate'],['y'])])
    elif name=='GlobalAveragePool':nodes.append(h.make_node('GlobalAveragePool',['x'],['y']))
    elif name=='ConcatBranches':
        conv('x','c','w',kernel_shape=[1,1]);nodes.extend([h.make_node('Relu',['c'],['relu']),h.make_node('Concat',['c','relu'],['y'],axis=1)])
    else:
        const('w',np.ones([2,2,2,2],dtype=np.float32)*.25);nodes.append(h.make_node('ConvTranspose',['x','w'],['y'],kernel_shape=[2,2],strides=[2,2],dilations=[1,1],group=1,pads=[0,0,0,0]))
    model=h.make_model(h.make_graph(nodes,'exact-attributes',[h.make_tensor_value_info('x',T.FLOAT,shape)],[h.make_tensor_value_info('y',T.FLOAT,[None,None,None,None])],init),opset_imports=[h.make_opsetid('',11)]);model.ir_version=6;model=onnx.shape_inference.infer_shapes(model);onnx.checker.check_model(model);data=model.SerializeToString();values=np.arange(1,129,dtype=np.float32)/128;s=rt.InferenceSession(data,providers=['CPUExecutionProvider']);expected=s.run(None,{'x':values.reshape(shape)})[0]
    out.append({'name':name,'model':base64.b64encode(data).decode(),'shape':shape,'input':values.tolist(),'expected':expected.flatten().tolist()})

open('wechat/miniprogram/utils/ocr-probes.js','w').write('module.exports='+json.dumps(out,separators=(',',':'))+';\n');print('Generated',len(out),'validated diagnostic models')
