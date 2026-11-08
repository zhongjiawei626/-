module.exports={
  "det": {
    "shape": [
      1,
      3,
      960,
      960
    ],
    "size": 1753256,
    "md5": "7efc3a73b79caa2af67ba252ce251b3e",
    "sha256": "4bcd340bec607b3445bff9a1043160e478a83db21aa1ab8cd8220c9d8d1490a2",
    "chunks": [
      {
        "name": "ocr-det-0",
        "path": "ocr-det-0/weights.onnx",
        "size": 1500000
      },
      {
        "name": "ocr-det-1",
        "path": "ocr-det-1/weights.onnx",
        "size": 253256
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
