// The unmodified GPLv3 Stockfish build is served in five asset-sized chunks.
const originalFetch=self.fetch.bind(self);
self.fetch=async function(input,options){
 if(String(input).includes('stockfish-19-single.wasm')){
  let index=0,reader=null;
  return new Response(new ReadableStream({async pull(controller){try{while(true){if(!reader){if(index===5){controller.close();return;}const response=await originalFetch('/engine/full-'+index+++'.bin');if(!response.ok)throw Error('Engine download failed');reader=response.body.getReader();}const {done,value}=await reader.read();if(done){reader=null;continue;}controller.enqueue(value);return;}}catch(e){controller.error(e);}}}),{headers:{'Content-Type':'application/wasm'}});
 }
 return originalFetch(input,options);
};
importScripts('/engine/stockfish-19-single.js');
