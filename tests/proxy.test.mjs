import test from 'node:test';import assert from 'node:assert/strict';
import {handle} from '../lib/room-proxy.mjs';
import {routeFetch} from './route-harness.mjs';
const origin='https://nexa-test.vercel.app';
test('Vercel gateway creates and joins rooms and synchronizes a legal move through real rules',async()=>{
 const request=async(body,token)=>{const r=await handle(new Request(origin+'/api/rooms',{method:'POST',headers:{origin,...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}),routeFetch);return {status:r.status,data:await r.json()};};
 const white=await request({action:'create',name:'White',minutes:0,increment:0});assert.equal(white.status,200);
 const black=await request({action:'join',id:white.data.id,name:'Black'});assert.equal(black.status,200);
 const read=async t=>(await handle(new Request(origin+'/api/rooms?id='+white.data.id,{headers:{authorization:'Bearer '+t}}),routeFetch)).json();
 let state=await read(white.data.token);
 const moved=await request({action:'move',id:white.data.id,version:state.version,move:'e4'},white.data.token);assert.equal(moved.status,200);
 assert.equal((await read(black.data.token)).state.fen,moved.data.state.fen);
 const illegal=await request({action:'move',id:white.data.id,version:moved.data.version,move:'e5'},white.data.token);assert.equal(illegal.status,400);
});
test('Gateway rejects cross-origin writes and oversize bodies before forwarding',async()=>{
 const no=()=>{throw Error('Must not forward');};
 assert.equal((await handle(new Request(origin+'/api/rooms',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}),no)).status,403);
 assert.equal((await handle(new Request(origin+'/api/rooms',{method:'POST',body:'x'.repeat(8193)}),no)).status,413);
});
test('Gateway does not redirect users or leak non-JSON upstream responses',async()=>{
 const req=new Request(origin+'/api/rooms');
 assert.equal((await handle(req,async()=>new Response('',{status:302,headers:{location:'/login'}}))).status,502);
 assert.equal((await handle(req,async()=>new Response('<html>error</html>'))).status,502);
});
