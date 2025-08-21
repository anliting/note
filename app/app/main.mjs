import http from                'http'
import pg from                  'pg'
import url from                 'url'
import cutBinary from           './cutBinary/main.mjs'
import folderItem from          './folderItem/main.mjs'
import pathnameMap from         './pathnameMap/main.mjs'
let db={
  pool:new pg.Pool({
    host:'db',
    password:process.env.dbPassword,
    port:5432,
    user:'postgres',
  }),
  /*async begin(f){
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
  },*/
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
let pathnameFirstElementMap={
  fi:folderItem,
}
let s=http.createServer(async(rq,rs)=>{
  try{
    let rqUrl=new url.URL(rq.url,'http://a')
    let o={
      db,
      reply:(body,status=200,header={},o={})=>{
        if('body'in o)
          body=o.body
        else{
          body=JSON.stringify(body)
          header['content-type']='application/json'
        }
        rs.writeHead(status,header).end(body)
      },
      rq,
      rqUrl,
      rs,
    }
    if(pathnameMap[rqUrl.pathname])
      return await pathnameMap[rqUrl.pathname](o)
    o.rqUrlSplittedPathname=rqUrl.pathname.split('/')
    let pathnameFirstElement=o.rqUrlSplittedPathname[1]
    if(pathnameFirstElementMap[pathnameFirstElement])
      return await pathnameFirstElementMap[pathnameFirstElement](o)
    rs.writeHead(400).end()
  }catch(e){
    console.error(e)
    return rs.headersSent||rs.writeHead(500).end()
  }
})
s.requestTimeout=0
s.listen(80)
await new Promise(rs=>process.on('SIGINT',rs).on('SIGTERM',rs))
abortController.abort()
db.pool.end()
s.close()
