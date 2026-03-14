import base from          '../base/main.mjs'
import{getSessionKey}from '../user/main.mjs'
let apiMap={}
apiMap.cutNote=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.note)
  ))
    return reply({type:'badMessage'})
  await db.pool.query(`
    delete from"file"
    using"session"
    where
      "file"=$2 and
      "fileType"='note'and
      "sessionKey"=$1 and
      "file"."user"="session"."user"
  `,[sk,message.note])
  reply({type:'ok'})
})
apiMap.getNoteByNote=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.note)
  ))
    return reply({type:'badMessage'})
  reply({
    type:'ok',
    note:(await db.pool.query(`
      select"note","noteT","noteBody"
      from"session"
      natural join"file"
      join"note"on"file"."file"="note"."note"
      where"sessionKey"=$1 and"note"=$2
    `,[sk,message.note])).rows
  })
})
apiMap.putNote=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.folder)
  ))
    return reply({type:'badMessage'})
  let res=await db.pool.query(`
    with
    "a"as(
      select"user","file" "folder"
      from"session"natural join"file"
      where"sessionKey"=$1 and"file"."file"=$2 and"file"."fileType"='folder'
    ),
    "b"as(
      insert into"file"("user","fileType")
      select"user",'note'
      from"a"
      returning"file"
    ),
    "c"as(
      insert into"folderItem"("folder","folderItemName","file")
      select"folder",'',"file"
      from"a","b"
    )
    insert into"note"("note","noteBody")
    select"file",'{}'
    from"b"
    returning"note","noteT","noteBody"
  `,[sk,message.folder])
  if(!res.rowCount)
    return reply({type:'bad'})
  reply({type:'ok',note:res.rows})
})
apiMap.setNote=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.note)&&
    typeof message.noteBody=='string'
  ))
    return reply({type:'badMessage'})
  await db.pool.query(`
    update"note"
    set"noteBody"=$1
    from"session"natural join"file"
    where"note"=$2 and"sessionKey"=$3 and"note"="file"
  `,[message.noteBody,message.note,sk])
  reply({type:'ok'})
})
export{apiMap}
