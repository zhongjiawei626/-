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
