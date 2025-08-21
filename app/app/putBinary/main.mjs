import Busboy from        'busboy'
import fs from            'fs'
import cutBinary from     '../cutBinary/main.mjs'
import{getSessionKey}from '../user/main.mjs'
export default getSessionKey(async({db,reply,rq,rs,sk})=>{
  let res=await db.pool.query(`
    with
    "a"as(
      insert into"file"("user","fileType")
      select "user",'binary'
      from"session"
      where"sessionKey"=$1
      returning"file"
    )
    insert into"binary"("binary","binaryState")
    select"file",'downloading'
    from"a"
    returning"binary"
  `,[sk])
  if(!res.rowCount)
    return reply({type:'badSessionKey'})
  let{binary}=res.rows[0],done
  try{
    let
      folder,fileName,
      ws=fs.createWriteStream(`bin/${binary}`,{flush:true}),
      wsClose=new Promise((rs,rj)=>ws.on('error',rj).on('close',rs))
    try{
      await new Promise((rs,rj)=>
        rq.pipe(Busboy({headers:rq.headers})).on('close',rs).on(
          'error',rj
        ).on('field',(k,v)=>{
          if(k=='folder')
            folder=v
        }).on('file',(fieldName,file,info)=>{
          if(!(fieldName=='file'&&fileName==undefined))
            return file.resume()
          fileName=''+Buffer.from(info.filename,'latin1')
          file.pipe(ws)
        })
      )
    }catch(e){
      console.error(e)
      return reply({type:'badMessage'})
    }
    if(!(folder&&fileName))
      return reply({type:'badMessage'})
    await wsClose
    if(!(await db.pool.query(`
      with
      "a"as(
        update"binary"
        set"binaryState"='ready'
        where"binary"=$4
      )
      insert into"folderItem"("folder","folderItemName","file")
      select"file"."file",$3,$4
      from"session"natural join"file"
      where"sessionKey"=$1 and"file"."file"=$2 and"file"."fileType"='folder'
    `,[sk,folder,fileName,binary])).rowCount)
      return reply({type:'badSessionKey'})
    reply({type:'ok',binary})
    done=1
  }finally{
    if(!done)
      await cutBinary({db},binary)
  }
})
