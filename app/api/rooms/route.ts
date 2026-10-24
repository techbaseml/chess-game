import {env} from 'cloudflare:workers';
import {newGame,chessOf,play,tick,claim,endLoss,other} from '../../../lib/chess-core.mjs';
const json=(v:unknown,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}});
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>n.toString(16).padStart(2,'0')).join('');
const hash=async(v:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),n=>n.toString(16).padStart(2,'0')).join('');
const name=(v:unknown)=>typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,24)||'Guest':'Guest';
export async function GET(req:Request){return handle(req,false);}
export async function POST(req:Request){return handle(req,true);}
async function handle(req:Request,post:boolean){
 try{
 const db=env.DB;if(!db)return json({error:'Online database is not configured.'},503);
 if(post&&req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origin rejected'},403);
 if(Number(req.headers.get('content-length')||0)>8192)return json({error:'Request too large'},413);
 let b:any={};if(post){const raw=await req.text();if(raw.length>8192)return json({error:'Request too large'},413);b=JSON.parse(raw);}
 const now=Date.now(),ip=req.headers.get('cf-connecting-ip')||'local';const key=await hash(ip+':'+Math.floor(now/60000)+':'+(b.action==='create'?'create':'all'));
 const rate:any=await db.prepare('INSERT INTO limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+120000).first();
 if(rate.count>(b.action==='create'?5:100))return json({error:'Too many requests. Please wait a minute.'},429);
 if(b.action==='create'){
  await db.batch([db.prepare('DELETE FROM rooms WHERE expires < ?').bind(now),db.prepare('DELETE FROM limits WHERE expires < ?').bind(now)]);
  const minutes=Number(b.minutes),increment=Number(b.increment);if(!Number.isFinite(minutes)||minutes<0||minutes>180||!Number.isInteger(increment)||increment<0||increment>60)throw Error('Invalid clock');
  const id=random(),token=random();const g=newGame({minutes,increment,mode:'Online Friend'});
  await db.prepare('INSERT INTO rooms(id,state,white_token,white_name,expires,white_seen) VALUES(?,?,?,?,?,?)').bind(id,JSON.stringify(g),await hash(token),name(b.name),now+86400000,now).run();return json({id,token,color:'w'});
 }
 const url=new URL(req.url),id=post?b.id:url.searchParams.get('id');if(!/^[a-f0-9]{48}$/.test(id||''))return json({error:'Invalid room code'},400);
 let r:any=await db.prepare('SELECT * FROM rooms WHERE id=? AND expires>?').bind(id,now).first();if(!r)return json({error:'Room not found or expired'},404);
 if(b.action==='join'){
  const token=random();const changed=await db.prepare('UPDATE rooms SET black_token=?,black_name=?,black_seen=?,state=?,version=version+1 WHERE id=? AND black_token IS NULL AND version=?').bind(await hash(token),name(b.name),now,JSON.stringify({...JSON.parse(r.state),anchor:now}),id,r.version).run();
  if(!changed.meta.changes)return json({error:'This room already has two players.'},409);return json({id,token,color:'b'});
 }
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return json({error:'Room membership required'},401);const digest=await hash(token);const color=digest===r.white_token?'w':digest===r.black_token?'b':null;if(!color)return json({error:'Room membership rejected'},403);
 let g=JSON.parse(r.state);let next=tick(g,now);
 if(!next.result&&r.black_token&&Math.max(r.white_seen,r.black_seen)<now-600000)next={...next,result:'1/2-1/2',reason:'Room abandoned',anchor:null};
 if(post){
  if(b.version!==r.version)return json({error:'Position changed. Synchronizing…'},409);
  if(!r.black_token)throw Error('Waiting for your friend.');
  switch(b.action){
   case 'move':if(next.result)throw Error('Game ended');if((next.fen?.split(' ')[1]||chessOf(next).turn())!==color)throw Error('It is not your turn.');next=play(next,b.move,now);break;
   case 'resign':if(!next.result)next=endLoss(next,color,'Resignation');break;
   case 'offer':if(next.result)throw Error('Game ended');next={...next,drawOffer:color};break;
   case 'accept':if(next.result||next.drawOffer!==other(color))throw Error('No opponent draw offer');next={...next,result:'1/2-1/2',reason:'Draw by agreement',anchor:null,drawOffer:null};break;
   case 'decline':if(next.drawOffer!==other(color))throw Error('No opponent draw offer');next={...next,drawOffer:null};break;
   case 'claim':if((next.fen?.split(' ')[1]||chessOf(next).turn())!==color||next.result)throw Error('Cannot claim now');next=claim(next,b.move);break;
   case 'rematch':if(!next.result)throw Error('Finish the current game first');next=next.rematch===other(color)?newGame({minutes:next.clocks.w===null?0:(next.initialMinutes||10),increment:next.increment/1000,mode:'Online Friend'}):{...next,rematch:color};if(!next.result)next.anchor=now;break;
   default:throw Error('Unknown action');
  }
 }
 if(JSON.stringify(next)!==JSON.stringify(g)){
  const result=await db.prepare('UPDATE rooms SET state=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(next),id,r.version).run();if(!result.meta.changes)return json({error:'Position changed. Synchronizing…'},409);r.state=JSON.stringify(next);r.version++;
 }
 const field=color==='w'?'white_seen':'black_seen';if(now-r[field]>15000){await db.prepare(`UPDATE rooms SET ${field}=? WHERE id=?`).bind(now,id).run();r[field]=now;}
 return json({id,state:JSON.parse(r.state),version:r.version,color,white:r.white_name,black:r.black_name,connected:{w:now-r.white_seen<30000,b:now-r.black_seen<30000},serverNow:now,expires:r.expires});
 }catch(e){return json({error:e instanceof Error?e.message:'Request failed'},400);}
}
