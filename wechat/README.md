# 微信小程序真机调试工程

AppID：`wx2c46f39f8ce19434`，个人主体。用微信开发者工具导入本目录，选择“不使用云服务”。不要导入仓库根目录或 `miniprogram` 子目录。

## 当前范围

- 原生 WXML/WXSS 页面，本机保存图片/PDF 原件、检查记录和指标设置。
- 折线图默认显示当前指标最新日期往前六个月，手势滑动历史；固定 Y 轴、参考范围背景、点击点编辑。
- 数据编辑、人工核对、单位换算、原件关联、单条移动。
- 下拉列表内置顶、上下排序、重命名、可恢复删除。
- 图片 OCR 使用 PaddleOCR v6 tiny 官方 ONNX 权重，通过 `wx.createInferenceSession` 在手机推理。约 6 MB 权重以 Base64 形式分为 5 个小于 2 MB 的 JS 分包，首次加载并在手机缓存；无需报告上传、API 密钥或付费识别接口。电脑实际模型验证通过，手机模型兼容性仍需真机验证。
- PDF 当前仅保存/打开原件和手动记录，不提供自动 PDF OCR。原生 PDF 查看器会暂时切出编辑页，返回后草稿保留。
- 原生页面暂不提供网页端的批量指标合并；可以逐条移动。网页原版继续可用。

## 数据迁移

网页“导出数据”得到的 JSON 可发到自己的微信聊天，再在小程序点“从微信聊天导入 PDF 或记录 JSON”。导入会去重，不会把旧 `sourceReportId` 冒充为手机上已存在的原件；图片/PDF 需另外导入，再在编辑页关联。网页浏览器的数据与手机本地档案不自动同步。

## 构建和校验

仓库根目录执行 `node build-wechat.mjs` 更新共享解析器和换算规则。本目录不需要构建 npm、云开发、服务器或 API 密钥。

打开工程后先确认模拟器能进入首页，点工具栏“真机调试”，选择 iOS，使用管理员或开发者微信扫码。二维码连接成功前，只能称“调试工程已准备”，不能视为真机验证通过。

OCR 适配依据：https://github.com/wechat-miniprogram/miniprogram-demo/tree/master/miniprogram/packageAPI/pages/ar/photo-ocr-detect

## OCR 排障与重试

报告库点击图片后选择“重新识别此图片”，无需再次导入。识别显示读取、图片处理、初始化、识别四个阶段，每阶段有超时保护。旧 VisionKit 适配器已补齐帧循环，但实测小米手机在远程调试和普通预览中均没有识别回调，因此不再作为默认引擎。当前默认加载本地 ONNX 检测及识别模型；日志不含报告文字或指标值。重新识别保留人工确认/移动记录，失败保留已有数据。

回归检查：`node wechat/tests/ocr.cjs` 和 `node wechat/tests/retry.cjs`。这些检查使用模拟 SDK，不代表真机识别成功。

## 免费的整份文字备用导入

报告库选择图片或 PDF → “粘贴整份文字，自动记录”。从系统相册或微信支持的提取文字功能复制全文，粘贴后检查日期，一次保存所有匹配指标；自动进行兼容单位换算并关联当前原件。此入口不调用付费 API，也不上传报告。它需要手动复制整份文字，不等同于已解决自动图片 OCR；系统是否能提取文字取决于手机和微信版本。

`node wechat/tests/text-import.cjs` 检查全文解析、日期、单位换算、来源保留。

## 本地模型构建与验证

权重源自 Paddle 官方模型仓库（Apache-2.0，许可证在 `miniprogram/PADDLE-LICENSE.txt`）：

- https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv6_tiny_det_onnx_infer.tar
- https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv6_tiny_rec_onnx_infer.tar

原始检测模型为 IR 10 / opset 14，已实测微信转换失败。先将模型简化为固定输入、IR 6 / opset 11，并验证转换前后输出差异，再打包。解压原始模型后，在仓库根目录运行：

```
python prepare-wechat-models.py DET_EXTRACTED_DIRECTORY REC_EXTRACTED_DIRECTORY /tmp/health-compatible
node build-wechat-models.mjs /tmp/health-compatible/det /tmp/health-compatible/rec
node wechat/tests/native-models.cjs
```

构建脚本生成模型 JS 分包、字符表和带 SHA-256 的清单。`native-models.cjs` 用真实权重与原生 API 形状的适配层在电脑执行合成报告识别，验证 3 个指标、单位、置信度及模型复用；它不能代替手机的模型算子兼容性检查。当前文字区域处理适合清晰横向检验表，未实现透视纠正或大角度旋转纠正。

兼容转换依赖 `onnx`、`onnxsim`、`onnxruntime`、`numpy`。检测保持等比缩放并补白到 960×960；识别固定 48×640。原件不参与模型转换。

模型转换失败时会自动使用固定公开测试张量检查模型 MD5、基础卷积、零维/一维标量、Erf、HardSigmoid、空 ROI 缩放、旧式上采样、均值归约和反卷积。诊断不读取报告内容。用 `python build-wechat-probes.py` 重建探针；电脑端 9 项已通过，手机结果仍需实测。

补充兼容处理：将 SAME_UPPER / SAME_LOWER 自动补边按固定输入计算为显式 pads。新增自动/显式补边、深度卷积、通道门控和折叠 GELU 组合探针，共 21 项；电脑全部通过，前 9 项已由用户在手机确认通过。新版诊断只汇总失败项，状态文字可长按选择。
