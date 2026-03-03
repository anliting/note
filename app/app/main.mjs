import fs from              'fs'
import http from            'http'
import pg from              'pg'
import{buffer}from          'stream/consumers'
import url from             'url'
import cutBinary from       './cutBinary/main.mjs'
import{apiMap as file}from  './file/main.mjs'
import folderItem from      './folderItem/main.mjs'
import{apiMap as note}from  './note/main.mjs'
import putBinary from       './putBinary/main.mjs'
import{apiMap as user}from  './user/main.mjs'
let fileResponseHandler=(contentType,path,o={})=>({rq,rs})=>{
  let lastModified
  if(o.lastModified){
    lastModified=fs.statSync(path).mtime.toUTCString()
    if(new Date(lastModified)<=new Date(rq.headers['if-modified-since'])){
      rs.writeHead(304)
      rs.end()
      return
    }
  }
  let header={'content-type':contentType}
  if(o.lastModified)
    header['last-modified']=lastModified
  rs.writeHead(200,header)
  fs.createReadStream(path).pipe(rs)
}
let apiMap=Object.assign({},file,note,user)
let pathnameMap={
  '/':fileResponseHandler(
    'text/html;charset=utf-8',
    'build/root',
    {lastModified:1},
  ),
  '/%23api':async({reply,rq,rs})=>{
    let status400=[]
    try{
      let message
      try{
        message=JSON.parse(await buffer(rq))
      }catch(e){
        if(e instanceof SyntaxError)
          throw status400
        throw e
      }
      if(!apiMap[message.function])
        throw status400
      await apiMap[message.function]({
        db,
        message:message.argument,
        reply,
        rq,rs
      })
    }catch(e){
      if(e==status400){
        rs.writeHead(400)
        rs.end()
        return
      }
      console.error(e)
      rs.writeHead(500)
      rs.end()
      return
    }
  },
  '/%23favicon16':fileResponseHandler(
    'image/png',
    'favicon/favicon-16x16.png',
    {lastModified:1},
  ),
  '/%23favicon32':fileResponseHandler(
    'image/png',
    'favicon/favicon-32x32.png',
    {lastModified:1},
  ),
  '/%23favicon192':fileResponseHandler(
    'image/png',
    'favicon/android-chrome-192x192.png',
    {lastModified:1},
  ),
  '/%23favicon512':fileResponseHandler(
    'image/png',
    'favicon/android-chrome-512x512.png',
    {lastModified:1},
  ),
  '/%23manifest':fileResponseHandler(
    'application/manifest+json',
    'build/manifest',
    {lastModified:1},
  ),
  '/%23ms.woff2':fileResponseHandler(
    'font/woff2',
    'build/ms.woff2',
    {lastModified:1},
  ),
  '/%23putBinary':putBinary,
  '/%23sw':fileResponseHandler('text/javascript','build/sw'),
}
let pool=new pg.Pool({
  host:'db',
  password:process.env.dbPassword,
  port:5432,
  user:'postgres',
})
let db={
  pool,
  async begin(f){
    let client=await this.pool.connect()
    try{
      await client.query('begin')
      await f(client)
      await client.query('commit')
    }catch(e){
      await client.query('rollback')
      throw e
    }finally{
      client.release()
    }
  },
}
for(let{binary}of(await db.pool.query(`
  select"binary"
  from"binary"
  where"binaryState"in('downloading','deleting')
`)).rows)
  await cutBinary({db},binary)
let abortController=new AbortController
let abortedPromise=new Promise(rs=>
  abortController.signal.addEventListener('abort',rs)
)
let garbargeCollector=(async()=>{
  while(!abortController.signal.aborted){
    await db.pool.query(`
      delete from"file"
      where
        "fileType"in('folder','note')and
        not exists(select from"folderItem"where"file"="file"."file")and
        "file"not in(select "folder" from "user")
    `)
    for(let{binary}of(await db.pool.query(`
      select"file" "binary"
      from"file"join"binary"on"file"="binary"
      where
        "fileType"='binary'and
        not exists(select from"folderItem"where"file"="file"."file")and
        "binaryState"='ready'
    `)).rows)
      await cutBinary({db},binary)
    let timeout
    await Promise.race([
      abortedPromise,
      new Promise(rs=>timeout=setTimeout(rs,60e3)),
    ])
    clearTimeout(timeout)
  }
})()
let s=http.createServer((rq,rs)=>{
  let rqUrl=new url.URL(rq.url,'http://a')
  let o={
    db,
    reply:(body,status=200,header={},o={})=>{
      if(body in o)
        body=o.body
      else{
        body=JSON.stringify(body)
        header['content-type']='application/json'
      }
      rs.writeHead(status,header)
      rs.end(body)
    },
    rq,
    rqUrl,
    rs,
  }
  if(pathnameMap[rqUrl.pathname])
    pathnameMap[rqUrl.pathname](o)
  else{
    let pathnameMatchInt=rqUrl.pathname.match(/^\/([0-9]+)$/)
    if(pathnameMatchInt){
      o.folderItem=pathnameMatchInt[1]
      folderItem(o)
    }else{
      rs.writeHead(400)
      rs.end()
    }
  }
})
s.listen(80)
await new Promise(rs=>process.on('SIGINT',rs).on('SIGTERM',rs))
abortController.abort()
pool.end()
s.close()
