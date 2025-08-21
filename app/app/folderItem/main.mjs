import Busboy from        'busboy'
import fs from            'fs'
import mime from          'mime-types'
import stream from        'stream/promises'
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
export default getSessionKey(async({db,rq,rqUrl,rqUrlSplittedPathname,rs,sk})=>{
  let pathnameMatchInt
  if(!(
    rqUrlSplittedPathname.length==3&&
    (pathnameMatchInt=rqUrlSplittedPathname[2].match(/^([0-9]+)$/))
  ))
    return rs.writeHead(400).end()
  let folderItem=pathnameMatchInt[1]
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
  if(!res.rowCount)
    return rs.writeHead(400).end()
  let row=res.rows[0]
  let
    mimeType=mime.lookup(row.folderItemName),
    contentType=allowedMimeSet.has(mimeType)?
      mimeType
    :
      'application/octet-stream'
  let status=200,header={},readStreamOption={}
  header.etag=contentType
  if(rq.headers['if-none-match']==header.etag)
    return rs.writeHead(304,header).end()
  let path=`bin/${row.file}`
  let stat=await fs.promises.stat(path)
  if(rq.headers.range){
    let m
    if(m=rq.headers.range.match(/^bytes=(\d+)-(\d*)$/i)){
      let
        start=+m[1],
        end=Math.min(
          m[2]==''?Infinity:+m[2]+1,
// 2**20 seems to hit a limit that Chrome expects to see some key data for PDF in a limited number of requests.
          //start+2**20,
          start+2**24,
          stat.size
        )
      if(end<=start)
        return rs.writeHead(416).end()
      status=206
      header['content-length']=end-start
      header['content-range']=`bytes ${start}-${end-1}/${stat.size}`
      readStreamOption.start=start
      readStreamOption.end=end-1
    }
  }
  header['content-length']=header['content-length']||stat.size
  header['accept-ranges']='bytes'
  header['content-type']=contentType
  header['content-disposition']=`${
    rqUrl.searchParams.get('a')!=null?'attachment':'inline'
  };filename*=UTF-8''${encodeURIComponent(row.folderItemName)}`
  stream.pipeline(
    fs.createReadStream(path,readStreamOption),
    rs.writeHead(status,header)
  )
})
