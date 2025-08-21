import{buffer}from              'stream/consumers'
import{apiMap as file}from      '../file/main.mjs'
import fileResponseHandler from '../fileResponseHandler/main.mjs'
import{apiMap as note}from      '../note/main.mjs'
import putBinary from           '../putBinary/main.mjs'
import{apiMap as user}from      '../user/main.mjs'
let apiMap=Object.assign({},file,note,user)
export default{
  '/':fileResponseHandler(
    'text/html;charset=utf-8',
    'build/root',
    {lastModified:1},
  ),
  '/%23api':async({db,reply,rq,rs})=>{
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
      if(!(
        typeof message=='object'&&
        message!=null&&
        Object.hasOwn(apiMap,message.function)
      ))
        throw status400
      await apiMap[message.function]({
        db,
        message:message.argument,
        reply,
        rq,rs
      })
    }catch(e){
      if(e==status400)
        return rs.writeHead(400).end()
      throw e
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
    {lastModified:1,mtimeAsEtag:1},
  ),
  '/%23putBinary':putBinary,
  '/%23sw':fileResponseHandler('text/javascript','build/sw'),
}
