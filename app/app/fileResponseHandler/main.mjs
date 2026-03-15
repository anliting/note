import fs from              'fs'
import stream from          'stream/promises'
export default(contentType,path,o={})=>async({rq,rs})=>{
  let lastModified
  if(o.lastModified){
    lastModified=(await fs.promises.stat(path)).mtime.toUTCString()
    if(new Date(lastModified)<=new Date(rq.headers['if-modified-since']))
      return rs.writeHead(304).end()
  }
  let etag
  if(o.mtimeAsEtag)
    etag=''+(await fs.promises.stat(path,{bigint:true})).mtimeNs
  if('if-none-match'in rq.headers&&rq.headers['if-none-match']==etag)
    return rs.writeHead(304).end()
  let header={'content-type':contentType}
  if(o.lastModified)
    header['last-modified']=lastModified
  if(etag)
    header['etag']=etag
  await stream.pipeline(fs.createReadStream(path),rs.writeHead(200,header))
}
