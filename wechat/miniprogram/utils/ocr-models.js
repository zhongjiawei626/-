module.exports={
  "det": {
    "shape": [
      1,
      3,
      960,
      960
    ],
    "size": 1753232,
    "md5": "4624094b9d22f315b98dc545afb311fc",
    "sha256": "613504781c2e8cca6d8cfb79cb09293ae6a91a4fef2a751853d2703e509decba",
    "chunks": [
      {
        "name": "ocr-det-0",
        "path": "ocr-det-0/weights.onnx",
        "size": 1500000
      },
      {
        "name": "ocr-det-1",
        "path": "ocr-det-1/weights.onnx",
        "size": 253232
      }
    ]
  },
  "rec": {
    "shape": [
      1,
      3,
      48,
      640
    ],
    "size": 4435873,
    "md5": "3987ba7537ceb1642979ce34e10a4755",
    "sha256": "e2f233eb947bb7d51270bd6f4167915fe6716faca6e569f356fcbc9632c0e7bf",
    "chunks": [
      {
        "name": "ocr-rec-0",
        "path": "ocr-rec-0/weights.onnx",
        "size": 1500000
      },
      {
        "name": "ocr-rec-1",
        "path": "ocr-rec-1/weights.onnx",
        "size": 1500000
      },
      {
        "name": "ocr-rec-2",
        "path": "ocr-rec-2/weights.onnx",
        "size": 1435873
      }
    ]
  },
  "classes": 6906
};
