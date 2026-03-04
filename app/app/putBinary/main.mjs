import Busboy from        'busboy'
import fs from            'fs'
import{pipeline}from      'stream/promises'
import cutBinary from     '../cutBinary/main.mjs'
import{getSessionKey}from '../user/main.mjs'
export default getSessionKey(async({db,reply,rq,rs,sk})=>{
  reply(await new Promise(rs=>{
    ;(async()=>{
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
        return rs({type:'badSessionKey'})
      let{binary}=res.rows[0],done
      try{
        let
          folder,fileName,
          ws=fs.createWriteStream(`bin/${binary}`,{flush:true}),
          wsClose=new Promise((rs,rj)=>ws.on('error',rj).on('close',rs)),
          fileWs
        try{
          let bb=Busboy({headers:rq.headers}).on('field',(k,v)=>{
            if(k=='folder')
              folder=v
          }).on('file',(fieldName,file,info)=>{
            if(!(fieldName=='file'&&!fileWs))
              return file.resume()
            fileName=''+Buffer.from(info.filename,'latin1')
            fileWs=pipeline(file,ws).catch(e=>{
              rs({type:
                rq.readableAborted||rq.destroyed?'badMessage':'serverError'
              })
              //bb.destroy(e)
            })
          })
          await pipeline(rq,bb)
        }catch(e){
          //console.error(e)
          return rs({type:'badMessage'})
        }
        if(!(folder&&fileWs))
          return rs({type:'badMessage'})
        await fileWs
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
          return rs({type:'badSessionKey'})
        rs({type:'ok',binary})
        done=1
      }finally{
        if(!done)
          await cutBinary({db},binary)
      }
    })().catch(e=>{
      console.log('aaaaaaaaaaaaaaaaaaaaaa')
    })
  }))
})
