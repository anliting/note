import Busboy from        'busboy'
import fs from            'fs'
import mime from          'mime-types'
import url from           'url'
import{getSessionKey}from '../user/main.mjs'
let allowedMimeSet=new Set([
  'application/pdf',
  'audio/mp4',
  'audio/mpeg',
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/tiff',
  'image/vnd.microsoft.icon',
  'image/webp',
  'image/x-icon',
  'video/mp4',
  'video/webm',
  'video/x-flv',
  'video/x-matroska',
  'video/x-msvideo',
])
export default getSessionKey(async({db,folderItem,rq,rs,sk})=>{
  let urlObj=new url.URL(rq.url,'http://a')
  let res=await db.pool.query(`
    select"folderItem"."folderItemName","folderItem"."file"
    from"session"natural join"file" "a"
    join"folderItem"on"folderItem"."folder"="a"."file"
    join"file" "b"on"folderItem"."file"="b"."file"
    join"binary" "c"on"b"."file"="c"."binary"
    where
      "sessionKey"=$1 and
      "folderItem"."folderItem"=$2 and
      "a"."fileType"='folder'and
      "b"."fileType"='binary'and
      "c"."binaryState"='ready'
  `,[sk,folderItem])
  if(!res.rowCount){
    rs.writeHead(400)
    return rs.end()
  }
  let row=res.rows[0]
  let
    mimeType=mime.lookup(row.folderItemName),
    contentType=allowedMimeSet.has(mimeType)?
      mimeType
    :
      'application/octet-stream'
  let status=200,header={},readStreamOption={}
  header.etag=contentType
  if(rq.headers['if-none-match']==header.etag){
    rs.writeHead(304,header)
    return rs.end()
  }
  let path=`bin/${row.file}`
  let stat=await fs.promises.stat(path)
  if(rq.headers.range){
    if(!/^bytes=[0-9]+-[0-9]*$/.test(rq.headers.range)){
      rs.writeHead(400)
      return rs.end()
    }
    let
      match=rq.headers.range.match(/^bytes=([0-9]+)-([0-9]*)$/),
      start=+match[1],
      end=Math.min(
        match[2]==''?Infinity:+match[2]+1,
        start+2**20,
        stat.size
      )
    if(end<start){
      rs.writeHead(400)
      return rs.end()
    }
    status=206
    header['content-length']=end-start
    header['content-range']=`bytes ${start}-${end-1}/${stat.size}`
    readStreamOption.start=start
    readStreamOption.end=end-1
  }else
    header['content-length']=stat.size
  header['content-type']=contentType
  header['content-disposition']=`${
    urlObj.searchParams.get('a')!=null?'attachment':'inline'
  };filename*=UTF-8''${encodeURIComponent(row.folderItemName)}`
  rs.writeHead(status,header)
  fs.createReadStream(path,readStreamOption).pipe(rs)
})
