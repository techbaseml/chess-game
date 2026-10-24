import { Chess } from 'chess.js';
export const START = new Chess().fen();
export const positionKey=f=>f.split(' ').slice(0,4).join(' ');
export const other = c => c === 'w' ? 'b' : 'w';
export function newGame({minutes=10,increment=0,mode='Friend',initialFen=START}={}) {
 const c=new Chess(initialFen);return {initialFen:c.fen(),fen:c.fen(),positions:{[positionKey(c.fen())]:1},initialMinutes:minutes,moves:[],clocks:{w:minutes===0?null:minutes*60000,b:minutes===0?null:minutes*60000},increment:increment*1000,anchor:null,result:null,reason:'',mode,drawOffer:null,rematch:null};
}
export function chessOf(g){const c=new Chess(g.initialFen);for(const m of g.moves)c.move(m.uci);return c;}
export function repetitionCount(c){const all=[c.fen(),...c.history({verbose:true}).map(m=>m.before)];const key=f=>f.split(' ').slice(0,4).join(' ');return all.filter(f=>key(f)===key(c.fen())).length;}
export function terminal(c,repetitions=repetitionCount(c)){
 if(c.isCheckmate())return {result:c.turn()==='w'?'0-1':'1-0',reason:'Checkmate'};
 if(c.isStalemate())return {result:'1/2-1/2',reason:'Stalemate'};
 if(c.isInsufficientMaterial())return {result:'1/2-1/2',reason:'Insufficient material'};
 if(repetitions>=5)return {result:'1/2-1/2',reason:'Fivefold repetition'};
 if(+c.fen().split(' ')[4]>=150)return {result:'1/2-1/2',reason:'Seventy-five-move rule'};
 return null;
}
export function canMate(c,color){
 const own=c.board().flat().filter(p=>p?.color===color&&p.type!=='k');
 if(!own.length)return false;
 if(own.some(p=>'pqr'.includes(p.type)))return true;
 const opp=c.board().flat().filter(p=>p&&p.color!==color&&p.type!=='k');
 if(own.length===1&&own[0].type==='n')return opp.some(p=>p.type!=='q');
 if(own.every(p=>p.type==='b')){
  const parity=p=>(p.square.charCodeAt(0)+Number(p.square[1]))%2;
  const colors=new Set(own.map(parity));
  if(colors.size===1)return opp.some(p=>p.type!=='b'||parity(p)!==parity(own[0]));
 }
 return true;
}
export function endLoss(g,loser,reason){const winner=other(loser);return {...g,result:canMate(new Chess(g.fen||chessOf(g).fen()),winner)?(winner==='w'?'1-0':'0-1'):'1/2-1/2',reason,anchor:null,drawOffer:null};}
export function clockAt(g,now=Date.now()){
 const clocks={...g.clocks};if(!g.result&&g.anchor!==null){const t=g.fen?.split(' ')[1]||chessOf(g).turn();if(clocks[t]!==null)clocks[t]=Math.max(0,clocks[t]-Math.max(0,now-g.anchor));}return clocks;
}
export function tick(g,now=Date.now()) {if(g.result||g.anchor===null)return g;const t=g.fen?.split(' ')[1]||chessOf(g).turn();const clocks=clockAt(g,now);if(clocks[t]===0)return {...endLoss(g,t,'Time expired'),clocks};return g;}
export function play(g,uci,now=Date.now()){
 g=tick(g,now);if(g.result)throw Error('This game has ended.');const c=new Chess(g.fen||chessOf(g).fen()),color=c.turn();let m;try{m=c.move(uci);}catch{throw Error('Illegal move.');}
 const clocks=clockAt(g,now);if(clocks[color]!==null)clocks[color]+=g.increment;
 const positions={...g.positions};const k=positionKey(c.fen());positions[k]=(positions[k]||0)+1;
 const next={...g,fen:c.fen(),positions,clocks,moves:[...g.moves,{uci:m.from+m.to+(m.promotion||''),san:m.san}],anchor:now,drawOffer:null};
 const end=terminal(c,positions[k]);return end?{...next,...end,anchor:null}:next;
}
export function claim(g,intended){if(g.result)throw Error('This game has ended.');const c=chessOf(g);if(intended)c.move(intended);if(!c.isThreefoldRepetition()&&!c.isDrawByFiftyMoves())throw Error('No threefold repetition or fifty-move claim is available.');return {...g,result:'1/2-1/2',reason:c.isThreefoldRepetition()?'Threefold repetition claimed':'Fifty-move rule claimed',anchor:null};}
export function pgnOf(g){const c=chessOf(g);c.setHeader('Event','NEXA CHESS','Result',g.result||'*','White',g.white||'White','Black',g.black||'Black');return c.pgn();}
export function importPgn(text){const c=new Chess();c.loadPgn(text);const history=c.history({verbose:true});const g=newGame({minutes:0,initialFen:history[0]?.before||c.fen()});g.fen=c.fen();g.positions={};for(const f of [c.fen(),...history.map(m=>m.before)])g.positions[positionKey(f)]=(g.positions[positionKey(f)]||0)+1;g.moves=history.map(m=>({uci:m.from+m.to+(m.promotion||''),san:m.san}));return {...g,...(terminal(c)||{}),anchor:null};}
