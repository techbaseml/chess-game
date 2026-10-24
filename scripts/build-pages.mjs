// Build the existing client as a separate, subpath-safe GitHub Pages app.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import './prepare-engine.mjs';
const base='/chess-game/';
const root=path.resolve('.pages-src'),out=path.resolve('dist-pages');
fs.mkdirSync(root+'/app',{recursive:true});
fs.cpSync('lib',root+'/lib',{recursive:true});
const prefix=s=>s.replaceAll("'/engine/","'"+base+'engine/').replaceAll('"/engine/','"'+base+'engine/');
fs.writeFileSync(root+'/lib/engine.ts',prefix(fs.readFileSync('lib/engine.ts','utf8')));
let app=fs.readFileSync('app/page.tsx','utf8').replaceAll("'/pieces/","'"+base+'pieces/').replaceAll('src="/','src="'+base).replace("register('/sw.js')","register('"+base+"sw.js')");
// The static origin has no trusted API. Offer an explicit handoff instead of broken room controls.
app=app.split('\n').map(line=>line.includes("{page==='online'&&")?` {page==='online'&&<section className="panel" style={{padding:32}}><span className="eyebrow">ONLINE MULTIPLAYER</span><h1>Play with a friend online</h1><p>Local games, Stockfish and analysis run here on GitHub Pages. Private online rooms use our hosted server for legal moves and synchronized clocks.</p><a className="gold button" href="https://nexa-chess-sanjay.adoredotter18.chatgpt.site/?online=1">Open online multiplayer <ArrowRight size={18}/></a></section>}`:line).join('\n');
fs.writeFileSync(root+'/app/page.tsx',app);
fs.copyFileSync('app/globals.css',root+'/app/globals.css');
fs.writeFileSync(root+'/main.tsx',"import React from 'react';import{createRoot}from'react-dom/client';import App from './app/page';import './app/globals.css';createRoot(document.getElementById('root')!).render(<App/>);");
fs.writeFileSync(root+'/index.html',`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#07111F"><title>NEXA CHESS — Play Without Limits</title><link rel="icon" href="${base}favicon.svg"><link rel="manifest" href="${base}manifest.webmanifest"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>`);
await build({configFile:false,root,base,publicDir:path.resolve('public'),plugins:[react()],build:{outDir:out,emptyOutDir:true}});
fs.writeFileSync(out+'/engine/full-worker.js',prefix(fs.readFileSync('public/engine/full-worker.js','utf8')));
const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));manifest.start_url=base;manifest.scope=base;for(const icon of manifest.icons)icon.src=base+icon.src.slice(1);fs.writeFileSync(out+'/manifest.webmanifest',JSON.stringify(manifest));
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const files=walk(out).filter(p=>!p.includes('/engine/full-')&&!p.includes('/engine/stockfish-19-single')&&!p.endsWith('/sw.js'));
const hash=crypto.createHash('sha256');for(const p of files)hash.update(fs.readFileSync(p));const version=hash.digest('hex').slice(0,12);
fs.writeFileSync(out+'/offline-assets.json',JSON.stringify({assets:files.map(p=>base+path.relative(out,p))}));
fs.writeFileSync(out+'/sw.js',fs.readFileSync('public/sw.js','utf8').replaceAll("'/","'"+base).replace('nexa-__BUILD_HASH__','nexa-pages-'+version).replace("key.startsWith('nexa-')","key.startsWith('nexa-pages-')"));
fs.writeFileSync(out+'/.nojekyll','');
console.log('GitHub Pages build ready: '+out);
