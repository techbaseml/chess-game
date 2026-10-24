export type EngineInfo={score:number|null,mate:number|null,depth:number,pv:string[],nodes:number};
export class Engine {
 worker:Worker|null=null;reject:((reason:Error)=>void)|null=null;
 cancel(){this.worker?.terminate();this.worker=null;this.reject?.(new Error('Cancelled'));this.reject=null;}
 search(fen:string,{level='Maximum',time=1500,depth=0,full=false}:{level?:string,time?:number,depth?:number,full?:boolean},onInfo:(i:EngineInfo)=>void):Promise<string>{
 this.cancel();return new Promise((resolve,reject)=>{
 this.reject=reject;const worker=new Worker(full?'/engine/full-worker.js#'+encodeURIComponent('/engine/stockfish-19-single.wasm'):'/engine/stockfish-19-lite-single.js');this.worker=worker;
 const timer=setTimeout(()=>{this.cancel();reject(new Error('Engine loading timed out. Check your connection or use the compact engine.'));},full?180000:45000);
 const send=(s:string)=>worker.postMessage(s);let searching=false;
 worker.onerror=(e)=>{clearTimeout(timer);reject(new Error(e.message||'Stockfish could not load. Try the compact engine.'));worker.terminate();};
 worker.onmessage=({data})=>{if(typeof data!=='string')return;
 if(data==='uciok'){send('setoption name Hash value '+(full?64:16));send('setoption name Threads value 1');send('setoption name Skill Level value '+({Beginner:0,Intermediate:5,Advanced:12,Expert:18,Maximum:20}[level]??20));send('isready');}
 if(data==='readyok'&&!searching){searching=true;clearTimeout(timer);send('position fen '+fen);send('go movetime '+Math.round(time)+(depth?' depth '+depth:''));}
 if(data.startsWith('info depth')){const cp=data.match(/score cp (-?\d+)/),mate=data.match(/score mate (-?\d+)/);onInfo({score:cp?+cp[1]/100:null,mate:mate?+mate[1]:null,depth:+(data.match(/depth (\d+)/)?.[1]||0),pv:data.split(' pv ')[1]?.split(' ')||[],nodes:+(data.match(/ nodes (\d+)/)?.[1]||0)});}
 if(data.startsWith('bestmove')){clearTimeout(timer);this.reject=null;resolve(data.split(' ')[1]);worker.terminate();if(this.worker===worker)this.worker=null;}
 };send('uci');
 });}
}
