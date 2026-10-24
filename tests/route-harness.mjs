import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import ts from 'typescript';
import {pathToFileURL} from 'node:url';
const sql=new DatabaseSync(':memory:');
sql.exec(fs.readFileSync(new URL('../drizzle/0000_solid_triathlon.sql',import.meta.url),'utf8'));
class Statement{constructor(query){this.query=query;this.args=[];}bind(...args){this.args=args;return this;}async first(){return sql.prepare(this.query).get(...this.args)||null;}async run(){const r=sql.prepare(this.query).run(...this.args);return {meta:{changes:Number(r.changes)}};}}
globalThis.__nexaTestDB={prepare:q=>new Statement(q),batch:async statements=>{sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
let code=fs.readFileSync(new URL('../app/api/rooms/route.ts',import.meta.url),'utf8').replace("import {env} from 'cloudflare:workers';","const env={DB:globalThis.__nexaTestDB};").replace("'../../../lib/chess-core.mjs'",JSON.stringify(new URL('../lib/chess-core.mjs',import.meta.url).href));
code=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const route=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
export const routeFetch=async(url,options)=>route[options?.method||'GET'](new Request(url,options));
