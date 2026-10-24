import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {Chess} from 'chess.js';
for(const name of ['stockfish-19-lite-single','stockfish-19-single'])test(name+' UCI handshake, legal best move and mate detection',{timeout:30000},async()=>{
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/stockfish/bin/'+name+'.js'],{stdio:['pipe','pipe','pipe']});let buffer='',ready=false,finished=false;
 const timer=setTimeout(()=>{child.kill();reject(Error('Engine timeout'));},25000);
 child.stdout.on('data',chunk=>{buffer+=chunk.toString();let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i).trim();buffer=buffer.slice(i+1);if(line==='uciok')child.stdin.write('isready\n');if(line==='readyok'&&!ready){ready=true;child.stdin.write('position fen 7k/5Q2/6K1/8/8/8/8/8 w - - 0 1\ngo movetime 150\n');}if(line.startsWith('bestmove')){try{const c=new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1');c.move(line.split(' ')[1]);assert(c.isCheckmate());finished=true;child.stdin.write('quit\n');}catch(e){child.kill();reject(e);}}}});
 child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',()=>{clearTimeout(timer);finished?resolve():reject(Error('Engine exited before bestmove'));});child.stdin.write('uci\n');
 });
});
