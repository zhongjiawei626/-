const loaders={"ocr-det-0":()=>require.async("../ocr-det-0/ready.js"),"ocr-det-1":()=>require.async("../ocr-det-1/ready.js"),"ocr-rec-0":()=>require.async("../ocr-rec-0/ready.js"),"ocr-rec-1":()=>require.async("../ocr-rec-1/ready.js"),"ocr-rec-2":()=>require.async("../ocr-rec-2/ready.js")};
module.exports=name=>{if(!loaders[name])throw Error("未知模型分包");return loaders[name]()};
