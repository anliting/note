import{getSessionKey}from '../user/main.mjs'
let apiMap={}
apiMap.cutNote=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    typeof message.note=='string'
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
    typeof message.note=='string'
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
    typeof message.folder=='string'
  ))
    return reply({type:'badMessage'})
  let res=await db.pool.query(`
    with
    "a"as(
      insert into"file"("user","fileType")
      select"user",'note'
      from"session"
      where"sessionKey"=$1
      returning"file"
    ),
    "b"as(
      insert into"folderItem"("folder","folderItemName","file")
      select"file"."file",'',"a"."file"
      from"session"natural join"file","a"
      where"sessionKey"=$1 and"file"."file"=$2 and"file"."fileType"='folder'
    )
    insert into"note"("note","noteBody")
    select"file",'{}'
    from"a"
    returning"note","noteT","noteBody"
  `,[sk,message.folder])
  if(!res.rows.length)
    return reply({type:'badSessionKey'})
  reply({type:'ok',note:res.rows})
})
apiMap.setNote=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    typeof message.note=='string'&&
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
