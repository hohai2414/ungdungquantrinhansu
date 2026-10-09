import {createClient} from '@libsql/client';
export function createD1Adapter(client){
  const wrap=(sql,args=[])=>({
    statement:{sql,args},
    bind(...values){return wrap(sql,values)},
    async all(){return {results:(await client.execute({sql,args})).rows.map(r=>({...r}))}},
    async first(){const r=await client.execute({sql,args});return r.rows[0]?{...r.rows[0]}:null},
    async run(){const r=await client.execute({sql,args});return {meta:{changes:r.rowsAffected}}}
  });
  return {prepare:wrap,async batch(statements){return (await client.batch(statements.map(s=>s.statement),'write')).map(r=>({results:r.rows.map(x=>({...x})),meta:{changes:r.rowsAffected}}))}};
}
let cached;
export function getDatabase(env=process.env){
  if(!env.TURSO_DATABASE_URL||!env.TURSO_AUTH_TOKEN)throw Object.assign(new Error('Chưa cấu hình TURSO_DATABASE_URL và TURSO_AUTH_TOKEN trong Vercel.'),{status:503});
  if(!/^(libsql|https):\/\//.test(env.TURSO_DATABASE_URL))throw Object.assign(new Error('Cơ sở dữ liệu Vercel cần kết nối từ xa qua HTTPS/libsql.'),{status:503});
  if(!cached)cached=createD1Adapter(createClient({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN}));
  return cached;
}
