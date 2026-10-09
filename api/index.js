import app from '../worker/app.js';
import {getDatabase} from '../server/libsql.js';
export function createHandler({database=getDatabase,env=process.env}={}){
return async function handler(req,res){
  try{
    const url=new URL(req.url,'https://'+req.headers.host);
    const path=req.query?.__path??url.searchParams.get('__path');
    if(path!==null&&path!==undefined){const value=Array.isArray(path)?path.join('/'):path;if(!/^[a-zA-Z0-9/_-]+$/.test(value))throw Object.assign(new Error('Đường dẫn không hợp lệ'),{status:400});url.pathname='/api/'+value;url.searchParams.delete('__path')}
    const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(', '):v);
    let body;if(!['GET','HEAD'].includes(req.method)){if(req.body!==undefined)body=typeof req.body==='string'||Buffer.isBuffer(req.body)?req.body:JSON.stringify(req.body);else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>300000)throw Object.assign(new Error('Dữ liệu quá lớn'),{status:413});chunks.push(chunk)}body=Buffer.concat(chunks)}if(Buffer.byteLength(body||'')>300000)throw Object.assign(new Error('Dữ liệu quá lớn'),{status:413})}
    const response=await app.fetch(new Request(url,{method:req.method,headers,...(body!==undefined?{body}:{})}),{DB:database(env),OPENAI_API_KEY:env.OPENAI_API_KEY,OPENAI_MODEL:env.OPENAI_MODEL,DEMO_MODE:env.DEMO_MODE});
    res.statusCode=response.status;for(const [k,v] of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){res.statusCode=error.status||503;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:error.status?error.message:'Không kết nối được cơ sở dữ liệu. Kiểm tra cấu hình Turso và chạy migration trước khi sử dụng.'}))}
};}
export default createHandler();
