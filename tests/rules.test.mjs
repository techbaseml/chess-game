import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {newGame,chessOf,play,terminal,claim,repetitionCount,tick,clockAt,canMate,importPgn,pgnOf,endLoss} from '../lib/chess-core.mjs';
const sequence=(moves,g=newGame({minutes:0}))=>moves.reduce((g,m)=>play(g,m,1000),g);
test('initial legal moves and turn enforcement',()=>{const g=newGame();assert.equal(chessOf(g).moves().length,20);assert.throws(()=>play(g,'e7e5'));assert.throws(()=>play(g,'e2e5'));assert.equal(chessOf(play(g,'e2e4')).turn(),'b');});
for(const [piece,fen,square,includes,excludes] of [
 ['pawn','4k3/8/8/8/8/8/4P3/4K3 w - - 0 1','e2','e4','d3'],
 ['knight','4k3/8/8/8/3N4/8/8/4K3 w - - 0 1','d4','f5','d5'],
 ['bishop','4k3/8/8/8/3B4/8/8/4K3 w - - 0 1','d4','g7','d5'],
 ['rook','4k3/8/8/8/3R4/8/8/4K3 w - - 0 1','d4','d7','e5'],
 ['queen','4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1','d4','g7','f5'],
 ['king','4k3/8/8/8/3K4/8/8/8 w - - 0 1','d4','e5','f5'],
])test(piece+' legal movement',()=>{const c=new Chess(fen);const moves=c.moves({square,verbose:true}).map(m=>m.to);assert(moves.includes(includes));assert(!moves.includes(excludes));});
test('pinned piece cannot expose king',()=>{const c=new Chess('k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1');assert.throws(()=>c.move('e2d2'));});
test('castling moves king and rook',()=>{const c=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');c.move('O-O');assert.equal(c.get('g1').type,'k');assert.equal(c.get('f1').type,'r');});
test('castling through check is rejected',()=>{const c=new Chess('r3kr1r/8/8/8/8/8/8/R3K2R w KQ - 0 1');assert.throws(()=>c.move('O-O'));});
test('castling in check is rejected',()=>{const c=new Chess('r3k2r/8/8/8/8/8/4r3/R3K2R w KQ - 0 1');assert.throws(()=>c.move('O-O'));});
test('en passant capture and expiration',()=>{let g=sequence(['e4','a6','e5','d5']);const c=chessOf(play(g,'exd6'));assert.equal(c.get('d5'),undefined);assert.equal(c.get('d6').color,'w');g=sequence(['Nf3','a5'],g);assert.throws(()=>play(g,'exd6'));});
test('all promotion choices',()=>{for(const p of 'qrbn'){const c=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');c.move('a7a8'+p);assert.equal(c.get('a8').type,p);}});
test('complete local checkmate game and termination',()=>{const g=sequence(['f3','e5','g4','Qh4#']);assert.equal(g.result,'0-1');assert.equal(g.reason,'Checkmate');assert.throws(()=>play(g,'a3'));});
test('stalemate',()=>assert.equal(terminal(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).reason,'Stalemate'));
test('common dead positions',()=>{for(const f of ['8/8/8/8/8/8/4k3/6K1 w - - 0 1','8/8/8/8/8/8/4k3/2B3K1 w - - 0 1','8/8/8/8/8/8/4k3/2N3K1 w - - 0 1'])assert.equal(terminal(new Chess(f)).reason,'Insufficient material');});
test('threefold is claimable, not automatic; fivefold automatic',()=>{const cycle=['Nf3','Nf6','Ng1','Ng8'];let g=sequence([...cycle,...cycle]);assert.equal(repetitionCount(chessOf(g)),3);assert.equal(g.result,null);assert.equal(claim(g).result,'1/2-1/2');g=sequence([...cycle,...cycle],g);assert.equal(g.reason,'Fivefold repetition');});
test('prospective repetition claim',()=>{const g=sequence(['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1']);assert.equal(claim(g,'Ng8').result,'1/2-1/2');});
test('fifty move claim and seventy-five automatic',()=>{let g=newGame({minutes:0,initialFen:'4k2r/8/8/8/8/8/8/R3K3 w Q - 99 50'});g=play(g,'Ra2');assert.equal(g.result,null);assert.equal(claim(g).reason,'Fifty-move rule claimed');g=newGame({minutes:0,initialFen:'4k2r/8/8/8/8/8/8/R3K3 w Q - 149 75'});assert.equal(play(g,'Ra2').reason,'Seventy-five-move rule');});
test('checkmate takes precedence over 75-move rule',()=>{const c=new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 149 75');c.move('Qg7#');assert.equal(terminal(c).reason,'Checkmate');});
test('clock increment, switching and timeout',()=>{let g={...newGame({minutes:1,increment:2}),anchor:1000};g=play(g,'e4',4000);assert.equal(g.clocks.w,59000);assert.equal(clockAt(g,6000).b,58000);assert.equal(clockAt(g,6000).w,59000);const ended=tick(g,65000);assert.equal(ended.result,'1-0');assert.equal(ended.clocks.b,0);assert.throws(()=>play(g,'e5',65000));});
test('paused and unlimited clocks',()=>{let g=newGame({minutes:1});assert.deepEqual(clockAt(g,999999),{w:60000,b:60000});g={...newGame({minutes:0}),anchor:1000};assert.deepEqual(clockAt(g,999999),{w:null,b:null});assert.equal(tick(g,999999).result,null);});
test('timeout with bare opponent king draws',()=>{const g={...newGame({minutes:1,initialFen:'7k/8/8/8/8/8/P7/K7 w - - 0 1'}),anchor:1};assert.equal(tick(g,60002).result,'1/2-1/2');assert.equal(canMate(chessOf(g),'b'),false);});
test('resignation cannot award win to bare king',()=>{const g=newGame({initialFen:'7k/8/8/8/8/8/P7/K7 w - - 0 1'});assert.equal(endLoss(g,'w','Resignation').result,'1/2-1/2');});
test('PGN and FEN round trip',()=>{const g=sequence(['e4','e5','Nf3','Nc6','Bb5']);assert.equal(chessOf(importPgn(pgnOf(g))).fen(),chessOf(g).fen());const custom=newGame({minutes:0,initialFen:'7k/P7/8/8/8/8/8/7K w - - 0 1'});assert.equal(chessOf(importPgn(pgnOf(custom))).fen(),custom.initialFen);assert.throws(()=>importPgn('1. e5 nonsense'));});
test('immutable snapshots support undo and redo',()=>{const original=newGame();const one=play(original,'e4');const two=play(one,'e5');assert.equal(original.moves.length,0);assert.equal(chessOf(one).turn(),'b');assert.equal(chessOf(two).turn(),'w');assert.equal(chessOf(JSON.parse(JSON.stringify(two))).fen(),chessOf(two).fen());});
