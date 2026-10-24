import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root='dist/client';
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(root).filter(p=>{const rel=p.slice(root.length).replaceAll('\\','/');return /\.(js|css|svg|png|webp|webmanifest)$/.test(rel)&&!rel.startsWith('/engine/stockfish-19-single')&&!rel.startsWith('/engine/full-')||rel==='/engine/stockfish-19-lite-single.wasm';});
const assets=files.map(p=>p.slice(root.length).replaceAll('\\','/')).sort();
const hash=crypto.createHash('sha256');for(const p of files)hash.update(fs.readFileSync(p));
const version=hash.digest('hex').slice(0,12);
fs.writeFileSync(path.join(root,'offline-assets.json'),JSON.stringify({version,assets}));
const sw=fs.readFileSync('public/sw.js','utf8').replace('__BUILD_HASH__',version);fs.writeFileSync(path.join(root,'sw.js'),sw);
console.log(`Offline package: ${assets.length} assets, version ${version}. Full engine downloads only when selected.`);
