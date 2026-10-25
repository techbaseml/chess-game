// Same-origin Vercel gateway; room rules and storage remain on the existing backend.
const UPSTREAM='https://nexa-chess-sanjay.adoredotter18.chatgpt.site';
const json=(value,status)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function handle(request,fetcher=fetch){
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 const incoming=new URL(request.url);
 if(request.headers.get('origin')&&request.headers.get('origin')!==incoming.origin)return json({error:'Origin rejected'},403);
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'Request too large'},413);
 try{
  const target=new URL('/api/rooms',UPSTREAM);
  const id=incoming.searchParams.get('id');if(id)target.searchParams.set('id',id);
  const headers={'Accept':'application/json','Origin':UPSTREAM};
  const token=request.headers.get('authorization');if(token)headers.Authorization=token;
  let body;if(request.method==='POST'){body=await request.text();if(new TextEncoder().encode(body).length>8192)return json({error:'Request too large'},413);headers['Content-Type']='application/json';}
  const response=await fetcher(target,{method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(response.status>=300&&response.status<400||!response.headers.get('content-type')?.includes('application/json'))return json({error:'Online server unavailable. Please retry shortly.'},502);
  return json(await response.json(),response.status);
 }catch{return json({error:'Online server unavailable. Please retry shortly.'},502);}
}
