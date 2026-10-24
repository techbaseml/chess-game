import test from 'node:test';import assert from 'node:assert/strict';
import {routeFetch} from './route-harness.mjs';
const fetch=process.env.TEST_ORIGIN?globalThis.fetch:routeFetch;
const origin=process.env.TEST_ORIGIN||'http://test.local';let white,black,state;
async function call(body,token){const r=await fetch(origin+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
async function read(token,id=white.id){const r=await fetch(origin+'/api/rooms?id='+id,{headers:token?{Authorization:'Bearer '+token}:{}});return {status:r.status,...await r.json()};}
test('two independent clients: create, join, synchronize, reject, reconnect, draw, rematch',async()=>{
 white=await call({action:'create',name:'QA White',minutes:10,increment:2});assert.equal(white.status,200);assert.match(white.id,/^[a-f0-9]{48}$/);
 assert.equal((await read()).status,401);
 black=await call({action:'join',id:white.id,name:'QA Black'});assert.equal(black.color,'b');
 assert.equal((await call({action:'join',id:white.id,name:'Intruder'})).status,409);
 state=await read(white.token);assert.equal(state.black,'QA Black');assert.equal((await read(black.token)).state.initialFen,state.state.initialFen);
 const out=await call({action:'move',id:white.id,version:state.version,move:'e7e5'},black.token);assert.equal(out.status,400);
 const illegal=await call({action:'move',id:white.id,version:state.version,move:'e2e5'},white.token);assert.equal(illegal.status,400);
 const wrong=await read('0'.repeat(48));assert.equal(wrong.status,403);
 const requests=await Promise.all(['e2e4','d2d4'].map(move=>call({action:'move',id:white.id,version:state.version,move},white.token)));assert.equal(requests.filter(r=>r.status===200).length,1);assert.equal(requests.filter(r=>r.status===409).length,1);
 state=await read(black.token);assert.equal(state.state.moves.length,1);assert(state.state.clocks.w>599000);assert.equal((await read(white.token)).version,state.version);
 state=await call({action:'move',id:white.id,version:state.version,move:'e7e5'},black.token);assert.equal(state.status,200);assert.equal(state.state.moves.length,2);
 const reconnected=await read(white.token);assert.deepEqual(reconnected.state.moves,state.state.moves);
 state=await call({action:'offer',id:white.id,version:state.version},white.token);assert.equal(state.state.drawOffer,'w');
 assert.equal((await call({action:'accept',id:white.id,version:state.version},white.token)).status,400);
 state=await call({action:'accept',id:white.id,version:state.version},black.token);assert.equal(state.state.result,'1/2-1/2');
 state=await call({action:'rematch',id:white.id,version:state.version},white.token);assert.equal(state.state.rematch,'w');
 state=await call({action:'rematch',id:white.id,version:state.version},black.token);assert.equal(state.state.result,null);assert.equal(state.state.moves.length,0);assert.equal(state.state.increment,2000);
 state=await call({action:'resign',id:white.id,version:state.version},black.token);assert.equal(state.state.result,'1-0');
});
test('server timeout is based on server time; cross-room token is rejected',async()=>{
 const a=await call({action:'create',name:'Clock A',minutes:1,increment:0});assert.equal(a.status,200);
 const b=await call({action:'join',id:a.id,name:'Clock B'});assert.equal(b.status,200);
 assert.equal((await read(white.token,a.id)).status,403);
 const originalNow=Date.now;try{const future=Date.now()+61000;Date.now=()=>future;const r=await read(a.token,a.id);assert.equal(r.state.result,'0-1');assert.equal(r.state.reason,'Time expired');assert.equal(r.state.clocks.w,0);}finally{Date.now=originalNow;}
});
test('room expiration denies reads; creation rate limit is enforced',async()=>{
 const originalNow=Date.now;try{const future=Date.now()+86400001;Date.now=()=>future;assert.equal((await read(white.token)).status,404);}finally{Date.now=originalNow;}
 const replies=[];for(let i=0;i<6;i++)replies.push(await call({action:'create',name:'Rate check',minutes:0,increment:0}));assert(replies.some(r=>r.status===429));
});
