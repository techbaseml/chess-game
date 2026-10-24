import fs from 'node:fs';
const dir='public/engine';fs.mkdirSync(dir,{recursive:true});
for(const file of ['stockfish-19-lite-single.js','stockfish-19-lite-single.wasm','stockfish-19-single.js'])fs.copyFileSync('node_modules/stockfish/bin/'+file,dir+'/'+file);
const binary=fs.readFileSync('node_modules/stockfish/bin/stockfish-19-single.wasm');const chunk=20*1024*1024;
for(let i=0;i<binary.length;i+=chunk)fs.writeFileSync(dir+'/full-'+Math.floor(i/chunk)+'.bin',binary.subarray(i,i+chunk));
fs.copyFileSync('node_modules/stockfish/Copying.txt',dir+'/LICENSE.txt');
console.log('Stockfish assets prepared from pinned stockfish@19.0.1.');
