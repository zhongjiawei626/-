"""Simplify official Paddle OCR weights for WeChat's older ONNX converter.
Usage: python prepare-wechat-models.py DET_DIRECTORY REC_DIRECTORY OUTPUT_DIRECTORY
Requires onnx, onnxsim, onnxruntime, numpy. No reports or network calls.
"""
import sys, pathlib, shutil
import numpy as np
import onnx
import onnxruntime as rt
from onnxsim import simplify
base=pathlib.Path(sys.argv[3]);base.mkdir(parents=True,exist_ok=True)
for kind,source,shape in [('det',sys.argv[1],[1,3,960,960]),('rec',sys.argv[2],[1,3,48,640])]:
    original=pathlib.Path(source)/'inference.onnx';output=base/kind;output.mkdir(exist_ok=True)
    model,valid=simplify(onnx.load(original),overwrite_input_shapes={'x':shape})
    if not valid:raise RuntimeError('Simplification validation failed: '+kind)
    # These float32 operators use the same schemas at opset 11; check numerically.
    # Normalize Paddle's SAME_UPPER padding to explicit ONNX pads. The
    # mobile converter can differ from ORT in handling automatic padding.
    inferred=onnx.shape_inference.infer_shapes(model)
    dims={v.name:[d.dim_value for d in v.type.tensor_type.shape.dim] for v in list(inferred.graph.input)+list(inferred.graph.value_info)}
    for node in model.graph.node:
        attrs={a.name:onnx.helper.get_attribute_value(a) for a in node.attribute}
        auto=attrs.get('auto_pad',b'NOTSET')
        if auto not in [b'SAME_UPPER',b'SAME_LOWER']:continue
        spatial=dims[node.input[0]][-2:];kernel=attrs['kernel_shape'];stride=attrs.get('strides',[1,1]);dilation=attrs.get('dilations',[1,1]);starts=[];ends=[]
        for length,k,st,di in zip(spatial,kernel,stride,dilation):
            total=max(0,((length+st-1)//st-1)*st+(k-1)*di+1-length)
            start=total//2 if auto==b'SAME_UPPER' else (total+1)//2
            starts.append(start);ends.append(total-start)
        keep=[a for a in node.attribute if a.name not in ['auto_pad','pads']]
        del node.attribute[:];node.attribute.extend(keep+[onnx.helper.make_attribute('pads',starts+ends)])
    model.ir_version=6;model.opset_import[0].version=11
    onnx.checker.check_model(model);onnx.save(model,output/'inference.onnx')
    opts=rt.SessionOptions();opts.intra_op_num_threads=2
    old=rt.InferenceSession(str(original),opts,providers=['CPUExecutionProvider'])
    new=rt.InferenceSession(str(output/'inference.onnx'),opts,providers=['CPUExecutionProvider'])
    data=np.random.default_rng(42).normal(size=shape).astype('float32')
    expected=old.run(None,{'x':data})[0];actual=new.run(None,{'x':data})[0]
    np.testing.assert_allclose(expected,actual,atol=1e-5,rtol=1e-4)
    shutil.copyfile(pathlib.Path(source)/'inference.yml',output/'inference.yml')
    print(kind,'max difference',float(np.max(np.abs(expected-actual))))
